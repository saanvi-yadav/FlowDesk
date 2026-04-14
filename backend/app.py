from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_db_connection
from collections import Counter
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
import json
import os
import hashlib
import secrets
import re

app = Flask(__name__)
CORS(app)

ALLOWED_ROLES = {"admin", "manager", "employee"}
TASK_STATUSES = {"TO_DO", "IN_PROGRESS", "DONE"}
TASK_PRIORITIES = {"LOW", "MEDIUM", "HIGH"}
ATTENDANCE_STATUSES = {"present", "absent", "half_day", "leave"}
LEAVE_TYPES = {"sick", "vacation", "personal", "unpaid", "emergency"}
LEAVE_STATUSES = {"pending", "approved", "rejected", "cancelled"}
PAYROLL_STATUSES = {"pending", "paid", "failed"}
NOTIFICATION_TYPES = {"task", "employee", "warning", "info", "system"}
TOKEN_SALT = "flowdesk-auth-token"
TOKEN_MAX_AGE_SECONDS = int(os.getenv("AUTH_TOKEN_MAX_AGE_SECONDS", "86400"))
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "flowdesk-dev-secret-change-me")
token_serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])


def build_user_payload(user):
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "employee"),
        "created_at": user.get("created_at"),
    }


def error_response(message, status_code):
    return jsonify({"error": message}), status_code


def is_valid_email(email):
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email or ""))


def parse_int_id(value, field_name, *, required=False):
    if value in (None, "", 0, "0"):
        if required:
            raise ValueError(f"{field_name} is required")
        return None

    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid integer")

    if parsed <= 0:
        raise ValueError(f"{field_name} must be greater than zero")

    return parsed


def parse_date_value(value, field_name, *, required=False):
    if value in (None, ""):
        if required:
            raise ValueError(f"{field_name} is required")
        return None

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"{field_name} must use YYYY-MM-DD format")


def parse_time_value(value, field_name, *, required=False):
    if value in (None, ""):
        if required:
            raise ValueError(f"{field_name} is required")
        return None

    if hasattr(value, "strftime"):
        return value.strftime("%H:%M:%S")

    candidate = str(value).strip()
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(candidate, fmt).strftime("%H:%M:%S")
        except ValueError:
            continue

    raise ValueError(f"{field_name} must use HH:MM or HH:MM:SS format")


def parse_decimal_value(value, field_name, *, required=False, minimum=None):
    if value in (None, ""):
        if required:
            raise ValueError(f"{field_name} is required")
        return None

    try:
        decimal_value = Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        raise ValueError(f"{field_name} must be a valid amount")

    if minimum is not None and decimal_value < Decimal(str(minimum)):
        raise ValueError(f"{field_name} must be at least {minimum}")

    return decimal_value


def serialize_date(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def serialize_time_value(value):
    if isinstance(value, timedelta):
        total_seconds = int(value.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    if hasattr(value, "strftime"):
        return value.strftime("%H:%M:%S")

    return value


def normalize_attendance_record(record):
    normalized = dict(record)
    normalized["date"] = serialize_date(normalized.get("date"))
    normalized["created_at"] = serialize_date(normalized.get("created_at"))
    normalized["check_in"] = serialize_time_value(normalized.get("check_in"))
    normalized["check_out"] = serialize_time_value(normalized.get("check_out"))
    return normalized


def get_table_columns(table_name):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT COLUMN_NAME
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = %s
        """,
        (table_name,),
    )
    columns = {row["COLUMN_NAME"] for row in cursor.fetchall()}
    cursor.close()
    conn.close()
    return columns


def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_auth_token(user):
    session_id = secrets.token_urlsafe(24)
    token = token_serializer.dumps(
        {
            "user_id": user["id"],
            "role": user.get("role", "employee"),
            "session_id": session_id,
        },
        salt=TOKEN_SALT,
    )
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO auth_sessions (session_id, user_id, token_hash, expires_at)
        VALUES (%s, %s, %s, DATE_ADD(NOW(), INTERVAL %s SECOND))
        """,
        (session_id, user["id"], hash_token(token), TOKEN_MAX_AGE_SECONDS),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return token


def get_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, name, email, role, created_at FROM users WHERE id=%s LIMIT 1",
        (user_id,),
    )
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user


def get_request_user():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.removeprefix("Bearer ").strip()
    try:
        payload = token_serializer.loads(
            token,
            salt=TOKEN_SALT,
            max_age=TOKEN_MAX_AGE_SECONDS,
        )
        user_id = int(payload.get("user_id"))
        session_id = payload.get("session_id")
    except (BadSignature, SignatureExpired, TypeError, ValueError):
        return None

    if not session_id:
        return None

    try:
        user = get_user_by_id(user_id)
    except (ValueError, mysql.connector.Error):
        return None

    if not user or user.get("role") not in ALLOWED_ROLES:
        return None

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT id
        FROM auth_sessions
        WHERE session_id=%s
        AND user_id=%s
        AND token_hash=%s
        AND revoked_at IS NULL
        AND expires_at > NOW()
        LIMIT 1
        """,
        (session_id, user["id"], hash_token(token)),
    )
    session = cursor.fetchone()
    cursor.close()
    conn.close()

    if not session:
        return None

    return {"id": user["id"], "role": user["role"], "session_id": session_id}


def require_authenticated_user():
    request_user = get_request_user()
    if not request_user:
        return None, error_response("Authentication required", 401)
    return request_user, None


def require_admin():
    request_user, error = require_authenticated_user()
    if error:
        return None, error

    if request_user["role"] != "admin":
        return None, error_response("Admin access required", 403)

    return request_user, None


def require_manager_or_admin():
    request_user, error = require_authenticated_user()
    if error:
        return None, error

    if request_user["role"] not in {"admin", "manager"}:
        return None, error_response("Manager or admin access required", 403)

    return request_user, None


def department_exists(department_name):
    if not department_name:
        return True

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT 1 FROM departments WHERE name=%s LIMIT 1",
        (department_name,),
    )
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result is not None


def project_exists(project_id):
    if project_id in (None, "", 0, "0"):
        return True

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT 1 FROM projects WHERE id=%s LIMIT 1",
        (project_id,),
    )
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result is not None


def employee_exists(employee_id):
    if employee_id in (None, "", 0, "0"):
        return True

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT 1 FROM employees WHERE id=%s LIMIT 1",
        (employee_id,),
    )
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result is not None


def get_employee_by_id(employee_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT id, user_id, name, email, role, department_id, department
        FROM employees
        WHERE id=%s
        LIMIT 1
        """,
        (employee_id,),
    )
    employee = cursor.fetchone()
    cursor.close()
    conn.close()
    return employee


def get_employee_by_user_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT id, user_id, name, email, role, department_id, department
        FROM employees
        WHERE user_id=%s
        LIMIT 1
        """,
        (user_id,),
    )
    employee = cursor.fetchone()
    cursor.close()
    conn.close()
    return employee


def get_department_by_id(department_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT
            departments.id,
            departments.name,
            departments.description,
            departments.manager_user_id,
            departments.created_at,
            users.name AS manager_name,
            users.email AS manager_email
        FROM departments
        LEFT JOIN users ON departments.manager_user_id = users.id
        WHERE departments.id=%s
        LIMIT 1
        """,
        (department_id,),
    )
    department = cursor.fetchone()
    cursor.close()
    conn.close()
    return department


def get_department_by_name(department_name):
    if not department_name:
        return None

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT
            departments.id,
            departments.name,
            departments.description,
            departments.manager_user_id,
            departments.created_at,
            users.name AS manager_name,
            users.email AS manager_email
        FROM departments
        LEFT JOIN users ON departments.manager_user_id = users.id
        WHERE departments.name=%s
        LIMIT 1
        """,
        (department_name,),
    )
    department = cursor.fetchone()
    cursor.close()
    conn.close()
    return department


def get_departments_for_manager(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, name FROM departments WHERE manager_user_id=%s ORDER BY name ASC",
        (user_id,),
    )
    departments = cursor.fetchall()
    cursor.close()
    conn.close()
    return departments


def get_department_for_manager(user_id):
    departments = get_departments_for_manager(user_id)
    return departments[0] if departments else None


def get_project_by_id(project_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT id, project_name, description, department_id, manager_user_id, created_by, created_at
        FROM projects
        WHERE id=%s
        LIMIT 1
        """,
        (project_id,),
    )
    project = cursor.fetchone()
    cursor.close()
    conn.close()
    return project


def get_manager_project_ids(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM projects WHERE manager_user_id=%s", (user_id,))
    project_ids = [row["id"] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return project_ids


def get_manager_employee_ids(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT DISTINCT employees.id
        FROM employees
        INNER JOIN departments ON (
            employees.department_id = departments.id
            OR (employees.department_id IS NULL AND employees.department = departments.name)
        )
        WHERE departments.manager_user_id=%s
        ORDER BY employees.id
        """,
        (user_id,),
    )
    employee_ids = [row["id"] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return employee_ids


def get_project_team_member_ids(project_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT employee_id
        FROM project_team_members
        WHERE project_id=%s
        ORDER BY employee_id
        """,
        (project_id,),
    )
    employee_ids = [row["employee_id"] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return employee_ids


def get_department_employee_ids(department_name):
    if not department_name:
        return []

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT id
        FROM employees
        WHERE department=%s
        ORDER BY id ASC
        """,
        (department_name,),
    )
    employee_ids = [row["id"] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return employee_ids


def get_department_employee_ids_by_id(department_id):
    if not department_id:
        return []

    department = get_department_by_id(department_id)
    if not department:
        return []

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT id
        FROM employees
        WHERE department_id=%s
           OR (department_id IS NULL AND department=%s)
        ORDER BY id ASC
        """,
        (department_id, department["name"]),
    )
    employee_ids = [row["id"] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return employee_ids


def normalize_team_member_ids(team_member_ids):
    normalized_ids = []
    for employee_id in team_member_ids or []:
        parsed_id = parse_int_id(employee_id, "Team member", required=True)
        if parsed_id not in normalized_ids:
            normalized_ids.append(parsed_id)
    return normalized_ids


def validate_team_members_for_department(department_name, team_member_ids):
    normalized_ids = normalize_team_member_ids(team_member_ids)
    if not normalized_ids:
        return []

    allowed_employee_ids = set(get_department_employee_ids(department_name))
    invalid_ids = [employee_id for employee_id in normalized_ids if employee_id not in allowed_employee_ids]
    if invalid_ids:
        raise ValueError("All project team members must belong to the selected department")

    return normalized_ids


def validate_team_members_for_department_id(department_id, team_member_ids):
    normalized_ids = normalize_team_member_ids(team_member_ids)
    if not normalized_ids:
        return []

    allowed_employee_ids = set(get_department_employee_ids_by_id(department_id))
    invalid_ids = [employee_id for employee_id in normalized_ids if employee_id not in allowed_employee_ids]
    if invalid_ids:
        raise ValueError("All project team members must belong to the selected department")

    return normalized_ids


def sync_project_team_members(project_id, team_member_ids, assigned_by_user_id, *, conn):
    cursor = conn.cursor()
    normalized_ids = list(team_member_ids or [])

    cursor.execute("DELETE FROM project_team_members WHERE project_id=%s", (project_id,))
    if normalized_ids:
        team_rows = [(project_id, employee_id, assigned_by_user_id) for employee_id in normalized_ids]
        cursor.executemany(
            """
            INSERT INTO project_team_members (project_id, employee_id, assigned_by)
            VALUES (%s, %s, %s)
            """,
            team_rows,
        )

        placeholders = ",".join(["%s"] * len(normalized_ids))
        cursor.execute(
            f"""
            UPDATE tasks
            SET assigned_to=NULL
            WHERE project_id=%s
              AND assigned_to IS NOT NULL
              AND assigned_to NOT IN ({placeholders})
            """,
            (project_id, *normalized_ids),
        )
    else:
        cursor.execute(
            """
            UPDATE tasks
            SET assigned_to=NULL
            WHERE project_id=%s
            """,
            (project_id,),
        )

    cursor.close()


def sync_task_assignment(task_id, employee_id, manager_user_id, *, conn):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM task_assignments WHERE task_id=%s", (task_id,))
    if employee_id and manager_user_id:
        cursor.execute(
            """
            INSERT INTO task_assignments (task_id, employee_id, assigned_by_manager)
            VALUES (%s, %s, %s)
            """,
            (task_id, employee_id, manager_user_id),
        )
    cursor.close()


def employee_is_in_project_team(project_id, employee_id):
    if not project_id or not employee_id:
        return False

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT 1
        FROM project_team_members
        WHERE project_id=%s AND employee_id=%s
        LIMIT 1
        """,
        (project_id, employee_id),
    )
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result is not None


def can_access_project(request_user, project_id):
    if project_id in (None, ""):
        return request_user["role"] == "admin"

    if request_user["role"] == "admin":
        return True

    if request_user["role"] != "manager":
        return False

    return project_id in get_manager_project_ids(request_user["id"])


def can_access_employee(request_user, employee_id):
    if request_user["role"] == "admin":
        return True

    if request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        return bool(employee and employee["id"] == employee_id)

    return employee_id in get_manager_employee_ids(request_user["id"])


def get_task_detail(task_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT
            tasks.id,
            tasks.title,
            tasks.description,
            tasks.status,
            tasks.priority,
            tasks.deadline,
            tasks.manager_user_id,
            tasks.assigned_by_admin_user_id,
            tasks.assigned_to,
            tasks.project_id,
            employees.name AS employee_name,
            employees.department AS employee_department,
            employees.user_id AS employee_user_id,
            projects.project_name,
            projects.created_by AS project_owner_id,
            projects.department_id,
            projects.manager_user_id AS project_manager_user_id,
            manager_users.name AS manager_name
        FROM tasks
        LEFT JOIN employees
        ON tasks.assigned_to = employees.id
        LEFT JOIN projects
        ON tasks.project_id = projects.id
        LEFT JOIN users AS manager_users
        ON tasks.manager_user_id = manager_users.id
        WHERE tasks.id=%s
        LIMIT 1
        """,
        (task_id,),
    )
    task = cursor.fetchone()
    cursor.close()
    conn.close()
    return task


def build_project_list_query(request_user):
    query = """
    SELECT DISTINCT
        projects.id,
        projects.project_name,
        projects.description,
        projects.department_id,
        projects.manager_user_id,
        projects.created_by,
        projects.created_at,
        users.name AS created_by_name,
        departments.name AS department_name,
        managers.name AS manager_name,
        managers.email AS manager_email
    FROM projects
    LEFT JOIN users ON projects.created_by = users.id
    LEFT JOIN departments ON projects.department_id = departments.id
    LEFT JOIN users AS managers ON projects.manager_user_id = managers.id
    """
    params = []

    if request_user["role"] == "manager":
        query += " WHERE projects.manager_user_id=%s"
        params.append(request_user["id"])
    elif request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        if not employee:
            return None, []
        query += """
        LEFT JOIN project_team_members
        ON project_team_members.project_id = projects.id
        LEFT JOIN tasks AS employee_tasks
        ON employee_tasks.project_id = projects.id
        WHERE project_team_members.employee_id=%s OR employee_tasks.assigned_to=%s
        """
        params.extend([employee["id"], employee["id"]])

    query += " ORDER BY projects.created_at DESC, projects.id DESC"
    return query, params


def can_access_task(request_user, task):
    if request_user["role"] == "admin":
        return True

    if request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        return bool(employee and task and task.get("assigned_to") == employee["id"])

    return bool(
        task
        and (
            task.get("manager_user_id") == request_user["id"]
            or task.get("project_manager_user_id") == request_user["id"]
            or task.get("project_id") in get_manager_project_ids(request_user["id"])
        )
    )


def create_notification(user_id, title, body, notification_type="info", *, conn=None):
    if not user_id or notification_type not in NOTIFICATION_TYPES:
        return

    own_connection = conn is None
    if own_connection:
        conn = get_db_connection()

    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO notifications (user_id, title, body, notification_type)
        VALUES (%s, %s, %s, %s)
        """,
        (user_id, title.strip(), body.strip(), notification_type),
    )

    if own_connection:
        conn.commit()
        cursor.close()
        conn.close()
    else:
        cursor.close()


def create_audit_log(actor_user_id, action_type, entity_type, entity_id=None, details=None, *, conn=None):
    own_connection = conn is None
    if own_connection:
        conn = get_db_connection()

    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT COLUMN_NAME
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'audit_logs'
            """
        )
        columns = {row[0] for row in cursor.fetchall()}
        payload = json.dumps(details or {})

        if {"actor_user_id", "action_type", "entity_type", "entity_id", "details"}.issubset(columns):
            cursor.execute(
                """
                INSERT INTO audit_logs (actor_user_id, action_type, entity_type, entity_id, details)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    actor_user_id,
                    action_type,
                    entity_type,
                    entity_id,
                    payload,
                ),
            )
        elif {"event_type", "entity", "entity_id", "data"}.issubset(columns):
            cursor.execute(
                """
                INSERT INTO audit_logs (event_type, entity, entity_id, data)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    action_type,
                    entity_type,
                    entity_id,
                    payload,
                ),
            )

        if own_connection:
            conn.commit()
    except mysql.connector.Error:
        if own_connection:
            conn.rollback()
    finally:
        cursor.close()
        if own_connection:
            conn.close()


def get_employee_for_user(request_user):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT employees.id, employees.user_id, employees.name, employees.email, employees.department_id, employees.department
        FROM employees
        INNER JOIN users
        ON employees.user_id = users.id OR LOWER(users.email) = LOWER(employees.email)
        WHERE users.id=%s
        LIMIT 1
        """,
        (request_user["id"],),
    )
    employee = cursor.fetchone()
    cursor.close()
    conn.close()
    return employee


def get_scope_ids(request_user):
    if request_user["role"] == "admin":
        return {"role": "admin"}

    if request_user["role"] == "manager":
        project_ids = get_manager_project_ids(request_user["id"])
        employee_ids = get_manager_employee_ids(request_user["id"])
        departments = get_departments_for_manager(request_user["id"])
        return {
            "role": "manager",
            "project_ids": project_ids,
            "employee_ids": employee_ids,
            "department_ids": [department["id"] for department in departments],
            "department_names": [department["name"] for department in departments],
        }

    employee = get_employee_for_user(request_user)
    return {
        "role": "employee",
        "employee": employee,
    }


def get_tasks_for_scope(request_user):
    scope = get_scope_ids(request_user)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT DISTINCT
        tasks.id,
        tasks.title,
        tasks.status,
        tasks.priority,
        tasks.deadline,
        tasks.manager_user_id,
        tasks.assigned_to,
        tasks.project_id,
        employees.name AS employee_name,
        employees.department AS employee_department,
        projects.project_name,
        projects.department_id,
        projects.manager_user_id AS project_manager_user_id,
        manager_users.name AS manager_name,
        project_manager_users.name AS project_manager_name
    FROM tasks
    LEFT JOIN employees
    ON tasks.assigned_to = employees.id
    LEFT JOIN projects
    ON tasks.project_id = projects.id
    LEFT JOIN users AS manager_users
    ON tasks.manager_user_id = manager_users.id
    LEFT JOIN users AS project_manager_users
    ON projects.manager_user_id = project_manager_users.id
    """
    params = []

    if scope["role"] == "manager":
        project_ids = scope.get("project_ids", [])
        if not project_ids:
            cursor.close()
            conn.close()
            return []
        placeholders = ",".join(["%s"] * len(project_ids))
        query += f" WHERE tasks.project_id IN ({placeholders}) OR tasks.manager_user_id=%s"
        params.extend(project_ids)
        params.append(request_user["id"])
    elif scope["role"] == "employee":
        employee = scope.get("employee")
        if not employee:
            cursor.close()
            conn.close()
            return []
        query += " WHERE tasks.assigned_to=%s"
        params.append(employee["id"])

    query += " ORDER BY tasks.deadline IS NULL, tasks.deadline ASC, tasks.id DESC"
    cursor.execute(query, tuple(params))
    tasks = cursor.fetchall()

    cursor.close()
    conn.close()
    return tasks


def get_attendance_records_for_scope(request_user):
    scope = get_scope_ids(request_user)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        query = """
        SELECT
            a.id,
            a.employee_id,
            a.date,
            a.check_in,
            a.check_out,
            a.status,
            a.notes,
            a.created_at,
            e.name AS employee_name,
            e.department AS employee_department
        FROM attendance a
        LEFT JOIN employees e ON a.employee_id = e.id
        """
        params = []
        filters = []

        if scope["role"] == "manager":
            employee_ids = scope.get("employee_ids", [])
            if not employee_ids:
                cursor.close()
                conn.close()
                return []
            placeholders = ",".join(["%s"] * len(employee_ids))
            filters.append(f"a.employee_id IN ({placeholders})")
            params.extend(employee_ids)
        elif scope["role"] == "employee":
            employee = scope.get("employee")
            if not employee:
                cursor.close()
                conn.close()
                return []
            filters.append("a.employee_id=%s")
            params.append(employee["id"])

        if filters:
            query += " WHERE " + " AND ".join(filters)

        query += " ORDER BY a.date DESC, a.id DESC"
        cursor.execute(query, tuple(params))
        records = [normalize_attendance_record(record) for record in cursor.fetchall()]
        cursor.close()
        conn.close()
        return records
    except mysql.connector.Error:
        cursor.close()
        conn.close()
        return get_attendance_records_from_audit_logs(request_user)


def get_attendance_records_from_audit_logs(request_user, *, employee_id=None, date_from=None, date_to=None):
    scope = get_scope_ids(request_user)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT COLUMN_NAME
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'audit_logs'
        """
    )
    audit_columns = {row["COLUMN_NAME"] for row in cursor.fetchall()}

    if {"event_type", "entity", "entity_id", "data"}.issubset(audit_columns):
        event_column = "event_type"
        entity_column = "entity"
        payload_column = "data"
    elif {"action_type", "entity_type", "entity_id", "details"}.issubset(audit_columns):
        event_column = "action_type"
        entity_column = "entity_type"
        payload_column = "details"
    else:
        cursor.close()
        conn.close()
        return []

    query = f"""
    SELECT
        id,
        CAST(JSON_UNQUOTE(JSON_EXTRACT({payload_column}, '$.employee_id')) AS UNSIGNED) AS employee_id,
        JSON_UNQUOTE(JSON_EXTRACT({payload_column}, '$.date')) AS date,
        JSON_UNQUOTE(JSON_EXTRACT({payload_column}, '$.check_in')) AS check_in,
        JSON_UNQUOTE(JSON_EXTRACT({payload_column}, '$.check_out')) AS check_out,
        JSON_UNQUOTE(JSON_EXTRACT({payload_column}, '$.status')) AS status,
        JSON_UNQUOTE(JSON_EXTRACT({payload_column}, '$.notes')) AS notes,
        created_at
    FROM audit_logs
    WHERE {event_column} = 'attendance_recorded'
      AND {entity_column} = 'attendance'
    """
    params = []

    if scope["role"] == "manager":
        employee_ids = scope.get("employee_ids", [])
        if not employee_ids:
            cursor.close()
            conn.close()
            return []
        if employee_id and employee_id not in employee_ids:
            cursor.close()
            conn.close()
            return []
        target_ids = [employee_id] if employee_id else employee_ids
        placeholders = ",".join(["%s"] * len(target_ids))
        query += f" AND CAST(JSON_UNQUOTE(JSON_EXTRACT({payload_column}, '$.employee_id')) AS UNSIGNED) IN ({placeholders})"
        params.extend(target_ids)
    elif scope["role"] == "employee":
        employee = scope.get("employee")
        if not employee:
            cursor.close()
            conn.close()
            return []
        query += f" AND CAST(JSON_UNQUOTE(JSON_EXTRACT({payload_column}, '$.employee_id')) AS UNSIGNED) = %s"
        params.append(employee["id"])
    elif employee_id:
        query += f" AND CAST(JSON_UNQUOTE(JSON_EXTRACT({payload_column}, '$.employee_id')) AS UNSIGNED) = %s"
        params.append(employee_id)

    if date_from:
        query += f" AND JSON_UNQUOTE(JSON_EXTRACT({payload_column}, '$.date')) >= %s"
        params.append(date_from.isoformat() if isinstance(date_from, date) else str(date_from))

    if date_to:
        query += f" AND JSON_UNQUOTE(JSON_EXTRACT({payload_column}, '$.date')) <= %s"
        params.append(date_to.isoformat() if isinstance(date_to, date) else str(date_to))

    query += " ORDER BY created_at DESC, id DESC"
    cursor.execute(query, tuple(params))
    records = [normalize_attendance_record(record) for record in cursor.fetchall()]

    employee_ids = sorted({row["employee_id"] for row in records if row.get("employee_id")})
    employee_map = {}
    if employee_ids:
        placeholders = ",".join(["%s"] * len(employee_ids))
        cursor.execute(
            f"""
            SELECT id, name, department
            FROM employees
            WHERE id IN ({placeholders})
            """,
            tuple(employee_ids),
        )
        employee_map = {row["id"]: row for row in cursor.fetchall()}

    for row in records:
        employee = employee_map.get(row.get("employee_id"), {})
        row["employee_name"] = employee.get("name")
        row["employee_department"] = employee.get("department")

    cursor.close()
    conn.close()
    return records


def get_leave_requests_for_scope(request_user):
    scope = get_scope_ids(request_user)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT
        lr.id,
        lr.employee_id,
        lr.start_date,
        lr.end_date,
        lr.leave_type,
        lr.status
    FROM leave_requests lr
    """
    params = []

    if scope["role"] == "manager":
        employee_ids = scope.get("employee_ids", [])
        if not employee_ids:
            cursor.close()
            conn.close()
            return []
        placeholders = ",".join(["%s"] * len(employee_ids))
        query += f" WHERE lr.employee_id IN ({placeholders})"
        params.extend(employee_ids)
    elif scope["role"] == "employee":
        employee = scope.get("employee")
        if not employee:
            cursor.close()
            conn.close()
            return []
        query += " WHERE lr.employee_id=%s"
        params.append(employee["id"])

    query += " ORDER BY lr.created_at DESC, lr.id DESC"
    cursor.execute(query, tuple(params))
    records = cursor.fetchall()
    cursor.close()
    conn.close()
    return records


def get_payroll_records_for_scope(request_user):
    scope = get_scope_ids(request_user)

    if scope["role"] == "manager":
        return []

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
    SELECT
        p.id,
        p.employee_id,
        p.pay_period_start,
        p.pay_period_end,
        p.net_pay,
        p.status
    FROM payroll p
    """
    params = []

    if scope["role"] == "employee":
        employee = scope.get("employee")
        if not employee:
            cursor.close()
            conn.close()
            return []
        query += " WHERE p.employee_id=%s"
        params.append(employee["id"])

    query += " ORDER BY p.pay_period_end DESC, p.id DESC"
    cursor.execute(query, tuple(params))
    records = cursor.fetchall()
    cursor.close()
    conn.close()
    return records


def build_dashboard_stats(request_user):
    scope = get_scope_ids(request_user)
    tasks = get_tasks_for_scope(request_user)
    attendance_records = get_attendance_records_for_scope(request_user)
    leave_requests = get_leave_requests_for_scope(request_user)
    payroll_records = get_payroll_records_for_scope(request_user)
    completed = sum(1 for task in tasks if task["status"] == "DONE")

    if scope["role"] == "admin":
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS total FROM employees")
        employees = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) AS total FROM projects")
        projects = cursor.fetchone()["total"]
        cursor.close()
        conn.close()
    elif scope["role"] == "manager":
        employees = len(scope.get("employee_ids", []))
        projects = len(scope.get("project_ids", []))
    else:
        employees = 1 if scope.get("employee") else 0
        projects = len({task["project_id"] for task in tasks if task["project_id"]})

    return {
        "employees": employees,
        "tasks": len(tasks),
        "projects": projects,
        "completed": completed,
        "attendance_records": len(attendance_records),
        "leave_requests": len(leave_requests),
        "payroll_records": len(payroll_records),
    }


def build_reports_payload(request_user):
    scope = get_scope_ids(request_user)
    tasks = get_tasks_for_scope(request_user)
    attendance_records = get_attendance_records_for_scope(request_user)
    leave_requests = get_leave_requests_for_scope(request_user)
    payroll_records = get_payroll_records_for_scope(request_user)

    status_counts = Counter(task["status"] for task in tasks if task["status"])
    priority_counts = Counter(task["priority"] for task in tasks if task["priority"])
    project_counts = Counter(task["project_name"] or "Unlinked" for task in tasks)
    department_counts = Counter(task["employee_department"] or "Unassigned" for task in tasks)
    workload_counts = Counter(task["employee_name"] or "Unassigned" for task in tasks)
    attendance_status_counts = Counter(record["status"] for record in attendance_records if record["status"])
    leave_status_counts = Counter(record["status"] for record in leave_requests if record["status"])
    payroll_status_counts = Counter(record["status"] for record in payroll_records if record["status"])

    completion_rate = round((status_counts.get("DONE", 0) / len(tasks)) * 100) if tasks else 0

    if scope["role"] == "admin":
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS total FROM employees")
        total_employees = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) AS total FROM departments")
        total_departments = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) AS total FROM projects")
        total_projects = cursor.fetchone()["total"]
        cursor.close()
        conn.close()
    elif scope["role"] == "manager":
        total_employees = len(scope.get("employee_ids", []))
        total_departments = len({task["employee_department"] for task in tasks if task["employee_department"]})
        total_projects = len(scope.get("project_ids", []))
    else:
        total_employees = 1 if scope.get("employee") else 0
        total_departments = 1 if scope.get("employee", {}).get("department") else 0
        total_projects = len({task["project_id"] for task in tasks if task["project_id"]})

    due_soon = []
    for task in tasks[:5]:
        due_soon.append({
            "id": task["id"],
            "title": task["title"],
            "status": task["status"],
            "project_name": task["project_name"],
            "employee_name": task["employee_name"],
            "deadline": task["deadline"],
        })

    return {
        "summary": {
            "tasks": len(tasks),
            "completed": status_counts.get("DONE", 0),
            "in_progress": status_counts.get("IN_PROGRESS", 0),
            "completion_rate": completion_rate,
            "employees": total_employees,
            "departments": total_departments,
            "projects": total_projects,
            "attendance_records": len(attendance_records),
            "leave_requests": len(leave_requests),
            "payroll_records": len(payroll_records),
            "pending_leaves": leave_status_counts.get("pending", 0),
            "paid_payrolls": payroll_status_counts.get("paid", 0),
        },
        "status_breakdown": [{"name": key.replace("_", " ").title(), "value": value} for key, value in status_counts.items()],
        "priority_breakdown": [{"name": key.title(), "value": value} for key, value in priority_counts.items()],
        "project_breakdown": [{"name": key, "value": value} for key, value in project_counts.items()],
        "department_breakdown": [{"name": key, "value": value} for key, value in department_counts.items()],
        "workload_breakdown": [{"name": key, "value": value} for key, value in workload_counts.items()],
        "attendance_breakdown": [{"name": key.replace("_", " ").title(), "value": value} for key, value in attendance_status_counts.items()],
        "leave_breakdown": [{"name": key.title(), "value": value} for key, value in leave_status_counts.items()],
        "payroll_breakdown": [{"name": key.title(), "value": value} for key, value in payroll_status_counts.items()],
        "due_soon": due_soon,
    }


def build_dashboard_insights(request_user):
    scope = get_scope_ids(request_user)
    tasks = get_tasks_for_scope(request_user)
    reports = build_reports_payload(request_user)

    if scope["role"] == "admin":
        headline = "Keep the whole company moving across departments and delivery lanes."
        support = "You’re seeing workspace-wide performance across employees, projects, and task flow."
    elif scope["role"] == "manager":
        headline = "Track your project delivery and keep your team’s workload balanced."
        support = "Your dashboard is focused on the projects you own and the tasks flowing through them."
    else:
        headline = "Stay on top of your assigned work and upcoming deadlines."
        support = "Your dashboard is focused on your tasks, linked projects, and personal completion pace."

    active_projects = sorted(
        reports["project_breakdown"],
        key=lambda item: item["value"],
        reverse=True,
    )[:3]

    return {
        "headline": headline,
        "support": support,
        "active_projects": active_projects,
        "due_soon": reports["due_soon"],
        "department_breakdown": reports["department_breakdown"][:4],
        "workload_breakdown": reports["workload_breakdown"][:5],
        "task_count": len(tasks),
    }


# -----------------------------
# Home
# -----------------------------
@app.route("/")
def home():
    return "FlowDesk API Running"


# -----------------------------
# Register
# -----------------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = "employee"

    if not name or not email or not password:
        return error_response("Name, email, and password are required", 400)

    if not is_valid_email(email):
        return error_response("A valid email address is required", 400)

    if len(password) < 6:
        return error_response("Password must be at least 6 characters", 400)

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if email already exists
        cursor.execute(
            "SELECT id FROM users WHERE LOWER(email)=%s LIMIT 1",
            (email,),
        )
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return error_response("Email is already in use", 409)

        hashed_password = generate_password_hash(password)

        cursor.execute(
            """
            INSERT INTO users (name,email,password,role)
            VALUES (%s,%s,%s,%s)
            """,
            (name, email, hashed_password, role),
        )
        conn.commit()
        user_id = cursor.lastrowid
        
        # Also create employee record when user registers as employee
        cursor.execute(
            """
            INSERT INTO employees (user_id,name,email,role,department)
            VALUES (%s,%s,%s,%s,%s)
            """,
            (user_id, name, email, "employee", None),
        )
        conn.commit()
        
        cursor.execute(
            """
            SELECT id, name, email, role, created_at
            FROM users
            WHERE id=%s
            """,
            (user_id,),
        )
        user = cursor.fetchone()

        return (
            jsonify(
                {
                    "message": "User registered successfully",
                    "user": build_user_payload(user),
                    "token": create_auth_token(user),
                }
            ),
            201,
        )
    except mysql.connector.IntegrityError as e:
        if conn:
            conn.rollback()
        return error_response("Email is already in use", 409)
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(f"Registration failed: {str(e)}", 500)
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# -----------------------------
# Login (email OR username)
# -----------------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not identifier or not password:
        return error_response("Email or username and password are required", 400)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    identifier_lower = identifier.lower()
    cursor.execute(
        """
        SELECT id, name, email, password, role, created_at
        FROM users
        WHERE LOWER(email)=%s OR LOWER(name)=%s
        LIMIT 1
        """,
        (identifier_lower, identifier_lower),
    )

    user = cursor.fetchone()

    login_successful = False
    if user:
        stored_password = user["password"]
        login_successful = (
            check_password_hash(stored_password, password) or stored_password == password
        )

        # Upgrade any legacy plain-text passwords after a successful login.
        if login_successful and stored_password == password:
            cursor.execute(
                "UPDATE users SET password=%s WHERE id=%s",
                (generate_password_hash(password), user["id"]),
            )
            conn.commit()

    cursor.close()
    conn.close()

    if login_successful:
        return jsonify({
            "message":"Login successful",
            "user": build_user_payload(user),
            "token": create_auth_token(user)
        })

    return error_response("Invalid email or password", 401)


# -----------------------------
# Current user
@app.route("/me", methods=["GET"])
def me():
    request_user, error = require_authenticated_user()
    if error:
        return error

    user = get_user_by_id(request_user["id"])
    if not user:
        return error_response("User not found", 404)

    return jsonify({"user": build_user_payload(user)})


# -----------------------------
# Logout
@app.route("/logout", methods=["POST"])
def logout():
    request_user, error = require_authenticated_user()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE auth_sessions SET revoked_at=NOW() WHERE session_id=%s AND user_id=%s",
        (request_user["session_id"], request_user["id"]),
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Logged out successfully"}), 200


# -----------------------------
# Create user (admin only)
@app.route("/users", methods=["POST"])
def create_user():
    _, error = require_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "employee").strip().lower()

    if not name or not email or not password:
        return error_response("Name, email, and password are required", 400)

    if not is_valid_email(email):
        return error_response("A valid email address is required", 400)

    if len(password) < 6:
        return error_response("Password must be at least 6 characters", 400)

    if role not in ALLOWED_ROLES:
        return error_response("Invalid role selected", 400)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT id FROM users WHERE LOWER(email)=%s LIMIT 1",
            (email,),
        )
        if cursor.fetchone():
            return error_response("Email is already in use", 409)

        hashed_password = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (name,email,password,role) VALUES (%s,%s,%s,%s)",
            (name, email, hashed_password, role),
        )
        conn.commit()
        user_id = cursor.lastrowid

        if role == "employee":
            cursor.execute(
                """
                INSERT INTO employees (user_id,name,email,role,department)
                VALUES (%s,%s,%s,%s,%s)
                """,
                (user_id, name, email, "employee", None),
            )
            conn.commit()
    except mysql.connector.IntegrityError:
        conn.rollback()
        return error_response("Email is already in use", 409)
    except Exception as e:
        conn.rollback()
        return error_response(f"User creation failed: {str(e)}", 500)
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "User created successfully", "user_id": user_id}), 201


# -----------------------------
# Add Employee
# -----------------------------
@app.route("/employees", methods=["POST"])
def add_employee():
    _, error = require_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    position = (data.get("role") or "").strip()
    department = (data.get("department") or "").strip()

    try:
        department_id = parse_int_id(data.get("department_id"), "Department", required=False)
    except ValueError as exc:
        return error_response(str(exc), 400)

    department_record = None
    if department_id:
        department_record = get_department_by_id(department_id)
        if not department_record:
            return error_response("Selected department does not exist", 400)
        department = department_record["name"]

    if not name or not email:
        return error_response("Employee name and email are required", 400)

    if not is_valid_email(email):
        return error_response("A valid email address is required", 400)

    if department and not department_exists(department):
        return error_response("Selected department does not exist", 400)

    auth_role = "employee"
    if position.lower() in {"admin", "manager", "employee"}:
        auth_role = position.lower()

    display_role = position or "Employee"

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT id FROM users WHERE LOWER(email)=%s LIMIT 1",
            (email,),
        )
        existing_user = cursor.fetchone()

        user_id = None
        temp_password = None
        if not existing_user:
            import secrets
            temp_password = secrets.token_urlsafe(12)
            hashed_password = generate_password_hash(temp_password)

            cursor.execute(
                "INSERT INTO users (name,email,password,role) VALUES (%s,%s,%s,%s)",
                (name, email, hashed_password, auth_role),
            )
            conn.commit()
            user_id = cursor.lastrowid
            created_user = True
        else:
            user_id = existing_user["id"]
            created_user = False

        cursor.execute(
            """
            INSERT INTO employees (user_id,name,email,role,department_id,department)
            VALUES (%s,%s,%s,%s,%s,%s)
            """,
            (user_id, name, email, display_role, department_id, department or None),
        )
        conn.commit()
        employee_id = cursor.lastrowid

        message = "Employee added"
        if created_user:
            message += " and user account created with temporary password (inform employee to change password on first login)"

        response_payload = {"message": message, "employee_id": employee_id}
        if temp_password:
            response_payload["temporary_password"] = temp_password

        return jsonify(response_payload), 201

    except mysql.connector.IntegrityError:
        conn.rollback()
        return error_response("Employee with this email already exists", 409)
    except Exception as e:
        conn.rollback()
        return error_response(f"Failed to add employee: {str(e)}", 500)
    finally:
        cursor.close()
        conn.close()


# -----------------------------

# -----------------------------

# -----------------------------
# Delete Employee
# -----------------------------
@app.route("/employees/<int:id>", methods=["DELETE"])
def delete_employee(id):
    _, error = require_admin()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT employees.user_id, users.role AS user_role
        FROM employees
        LEFT JOIN users
        ON employees.user_id = users.id
        WHERE employees.id=%s
        """,
        (id,),
    )
    employee = cursor.fetchone()

    if not employee:
        cursor.close()
        conn.close()
        return error_response("Employee not found", 404)

    if employee.get("user_id") and employee.get("user_role") == "employee":
        cursor.execute("DELETE FROM users WHERE id=%s", (employee["user_id"],))
    else:
        cursor.execute("DELETE FROM employees WHERE id=%s", (id,))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message":"Employee deleted"})


@app.route("/employees/<int:id>", methods=["PUT"])
def update_employee(id):
    _, error = require_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    role = (data.get("role") or "").strip()
    department = (data.get("department") or "").strip()

    try:
        department_id = parse_int_id(data.get("department_id"), "Department", required=False)
    except ValueError as exc:
        return error_response(str(exc), 400)

    if department_id:
        department_record = get_department_by_id(department_id)
        if not department_record:
            return error_response("Selected department does not exist", 400)
        department = department_record["name"]

    if not name or not email:
        return error_response("Employee name and email are required", 400)

    if not is_valid_email(email):
        return error_response("A valid email address is required", 400)

    if not department_exists(department):
        return error_response("Selected department does not exist", 400)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT user_id FROM employees WHERE id=%s", (id,))
        employee = cursor.fetchone()
        if not employee:
            cursor.close()
            conn.close()
            return error_response("Employee not found", 404)

        cursor.execute(
            """
            UPDATE employees
            SET name=%s, email=%s, role=%s, department_id=%s, department=%s
            WHERE id=%s
            """,
            (
                name,
                email,
                role,
                department_id,
                department,
                id,
            )
        )

        if employee.get("user_id"):
            auth_role = role.lower() if role.lower() in ALLOWED_ROLES else "employee"
            cursor.execute(
                "UPDATE users SET name=%s, email=%s, role=%s WHERE id=%s",
                (name, email, auth_role, employee["user_id"]),
            )

        conn.commit()
    except mysql.connector.IntegrityError:
        conn.rollback()
        cursor.close()
        conn.close()
        return error_response("Email is already in use", 409)

    cursor.close()
    conn.close()

    return jsonify({"message":"Employee updated"})



@app.route("/tasks", methods=["GET"])
def get_tasks():
    request_user, error = require_authenticated_user()
    if error:
        return error
    return jsonify(get_tasks_for_scope(request_user))


@app.route("/tasks", methods=["POST"])
def add_task():
    request_user, error = require_manager_or_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}

    try:
        title = (data.get("title") or "").strip()
        description = (data.get("description") or "").strip()
        priority = (data.get("priority") or "MEDIUM").strip().upper()
        assigned_to = parse_int_id(data.get("assigned_to"), "Assignee")
        project_id = parse_int_id(data.get("project_id"), "Project")
        manager_user_id = parse_int_id(data.get("manager_user_id"), "Manager")
        deadline = parse_date_value(data.get("deadline"), "Deadline")
    except ValueError as exc:
        return error_response(str(exc), 400)

    if not title:
        return error_response("Task title is required", 400)
    if priority not in TASK_PRIORITIES:
        return error_response("Invalid task priority", 400)
    if project_id is None:
        return error_response("Project is required for task assignment", 400)
    if not project_exists(project_id):
        return error_response("Selected project does not exist", 400)
    project = get_project_by_id(project_id)
    if not project:
        return error_response("Selected project does not exist", 400)
    if request_user["role"] == "manager":
        if not can_access_project(request_user, project_id):
            return error_response("Managers can only create tasks for projects they manage", 403)
        manager_user_id = request_user["id"]
    else:
        if not manager_user_id:
            manager_user_id = project.get("manager_user_id")
        if not manager_user_id:
            return error_response("Manager assignment is required", 400)
        if manager_user_id != project.get("manager_user_id"):
            return error_response("Task manager must match the manager assigned to the project department", 400)
    if assigned_to and not employee_exists(assigned_to):
        return error_response("Selected assignee does not exist", 400)
    if assigned_to and not employee_is_in_project_team(project_id, assigned_to):
        return error_response("Selected assignee must be assigned to the project team", 400)
    if request_user["role"] == "admin" and assigned_to:
        return error_response("Admin must assign tasks to a manager first, not directly to an employee", 400)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        INSERT INTO tasks (title, description, status, priority, manager_user_id, assigned_by_admin_user_id, assigned_to, project_id, deadline)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            title,
            description or None,
            "TO_DO",
            priority,
            manager_user_id,
            request_user["id"] if request_user["role"] == "admin" else project.get("created_by"),
            assigned_to,
            project_id,
            deadline,
        ),
    )
    task_id = cursor.lastrowid
    conn.commit()

    if assigned_to and manager_user_id:
        sync_task_assignment(task_id, assigned_to, manager_user_id, conn=conn)
        conn.commit()

    if assigned_to:
        assignee = get_employee_by_id(assigned_to)
        if assignee and assignee.get("user_id"):
            create_notification(
                assignee["user_id"],
                "Task assigned",
                f"You have been assigned '{title}'.",
                "task",
                conn=conn,
            )
            conn.commit()
    elif manager_user_id:
        manager = get_user_by_id(manager_user_id)
        if manager:
            create_notification(
                manager["id"],
                "Task assigned by admin",
                f"You have received '{title}' for project '{project.get('project_name') or 'Unassigned'}'.",
                "task",
                conn=conn,
            )
            conn.commit()

    create_audit_log(
        request_user["id"],
        "task_created",
        "task",
        task_id,
        {"title": title, "project_id": project_id, "assigned_to": assigned_to, "manager_user_id": manager_user_id},
    )

    cursor.close()
    conn.close()

    return jsonify({"message": "Task added", "task_id": task_id}), 201


@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    request_user, error = require_authenticated_user()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    task = get_task_detail(task_id)
    if not task:
        return error_response("Task not found", 404)

    if not can_access_task(request_user, task):
        if request_user["role"] == "employee":
            return error_response("Employees can only update their assigned tasks", 403)
        return error_response("You do not have access to this task", 403)

    try:
        request_status = (
            None if data.get("status") is None else str(data.get("status")).strip().upper()
        )
        manager_user_id = (
            task.get("manager_user_id")
            if "manager_user_id" not in data
            else parse_int_id(data.get("manager_user_id"), "Manager")
        )
        assigned_to = (
            task["assigned_to"]
            if "assigned_to" not in data
            else parse_int_id(data.get("assigned_to"), "Assignee")
        )
        project_id = (
            task["project_id"]
            if "project_id" not in data
            else parse_int_id(data.get("project_id"), "Project", required=True)
        )
        deadline = (
            parse_date_value(task["deadline"], "Deadline")
            if "deadline" not in data
            else parse_date_value(data.get("deadline"), "Deadline")
        )
    except ValueError as exc:
        return error_response(str(exc), 400)

    mutable_fields = {"title", "description", "priority", "assigned_to", "project_id", "deadline"}
    employee_edit_attempt = any(field in data for field in mutable_fields)

    if request_user["role"] == "employee" and employee_edit_attempt:
        return error_response("Employees can only update task status", 403)

    if request_status is not None and request_status not in TASK_STATUSES:
        return error_response("Invalid task status", 400)

    if request_user["role"] == "manager":
        if project_id and not can_access_project(request_user, project_id):
            return error_response("Managers can only manage tasks for their own projects", 403)
        manager_user_id = request_user["id"]
    elif project_id:
        project = get_project_by_id(project_id)
        if not project:
            return error_response("Selected project does not exist", 400)
        if manager_user_id and manager_user_id != project.get("manager_user_id"):
            return error_response("Task manager must match the manager assigned to the project department", 400)
        if not manager_user_id:
            manager_user_id = project.get("manager_user_id")

    if assigned_to and not employee_exists(assigned_to):
        return error_response("Selected assignee does not exist", 400)
    if project_id and not project_exists(project_id):
        return error_response("Selected project does not exist", 400)
    if assigned_to and project_id and not employee_is_in_project_team(project_id, assigned_to):
        return error_response("Selected assignee must be assigned to the project team", 400)
    if request_user["role"] == "admin" and "assigned_to" in data and assigned_to:
        return error_response("Admin must assign tasks to a manager first, not directly to an employee", 400)

    title = (data.get("title") if "title" in data else task["title"] or "").strip()
    description = (data.get("description") if "description" in data else task.get("description") or "").strip()
    priority = (
        str(data.get("priority") if "priority" in data else task["priority"] or "MEDIUM")
        .strip()
        .upper()
    )

    if request_user["role"] in {"admin", "manager"}:
        if not title:
            return error_response("Task title is required", 400)
        if priority not in TASK_PRIORITIES:
            return error_response("Invalid task priority", 400)
        if project_id is None:
            return error_response("Project is required for task assignment", 400)

    conn = get_db_connection()
    cursor = conn.cursor()

    if request_user["role"] == "employee":
        cursor.execute(
            "UPDATE tasks SET status=%s WHERE id=%s",
            (request_status or task["status"], task_id),
        )
    else:
        cursor.execute(
            """
            UPDATE tasks
            SET title=%s,
                description=%s,
                status=%s,
                priority=%s,
                manager_user_id=%s,
                assigned_to=%s,
                project_id=%s,
                deadline=%s
            WHERE id=%s
            """,
            (
                title,
                description or None,
                request_status or task["status"],
                priority,
                manager_user_id,
                assigned_to,
                project_id,
                deadline,
                task_id,
            ),
        )

    conn.commit()

    if request_user["role"] in {"admin", "manager"}:
        sync_task_assignment(task_id, assigned_to, manager_user_id, conn=conn)
        conn.commit()

    if request_status == "DONE" and task["status"] != "DONE" and task.get("project_owner_id"):
        create_notification(
            task["project_owner_id"],
            "Task completed",
            f"'{task['title']}' was marked done.",
            "task",
            conn=conn,
        )
        conn.commit()

    if request_user["role"] in {"admin", "manager"} and assigned_to and assigned_to != task["assigned_to"]:
        assignee = get_employee_by_id(assigned_to)
        if assignee and assignee.get("user_id"):
            create_notification(
                assignee["user_id"],
                "Task reassigned",
                f"You have been assigned '{title}'.",
                "task",
                conn=conn,
            )
            conn.commit()

    create_audit_log(
        request_user["id"],
        "task_updated",
        "task",
        task_id,
        {"status": request_status or task["status"], "project_id": project_id, "assigned_to": assigned_to, "manager_user_id": manager_user_id},
    )

    cursor.close()
    conn.close()

    return jsonify({"message": "Task updated"})


@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    request_user, error = require_manager_or_admin()
    if error:
        return error

    task = get_task_detail(task_id)
    if not task:
        return error_response("Task not found", 404)
    if request_user["role"] == "manager" and not can_access_task(request_user, task):
        return error_response("Managers can only delete tasks for their own projects", 403)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM tasks WHERE id=%s", (task_id,))
    conn.commit()
    deleted_rows = cursor.rowcount

    cursor.close()
    conn.close()

    if deleted_rows == 0:
        return error_response("Task not found", 404)

    create_audit_log(
        request_user["id"],
        "task_deleted",
        "task",
        task_id,
        {"title": task["title"], "project_id": task["project_id"]},
    )

    return jsonify({"message":"Task deleted"})


@app.route("/assign-task-to-manager", methods=["POST"])
def assign_task_to_manager():
    request_user, error = require_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    try:
        title = (data.get("title") or "").strip()
        description = (data.get("description") or "").strip()
        priority = (data.get("priority") or "MEDIUM").strip().upper()
        project_id = parse_int_id(data.get("project_id"), "Project", required=True)
        manager_user_id = parse_int_id(data.get("manager_user_id"), "Manager", required=False)
        deadline = parse_date_value(data.get("deadline"), "Deadline")
    except ValueError as exc:
        return error_response(str(exc), 400)

    if not title:
        return error_response("Task title is required", 400)
    if priority not in TASK_PRIORITIES:
        return error_response("Invalid task priority", 400)

    project = get_project_by_id(project_id)
    if not project:
        return error_response("Project not found", 404)

    manager_user_id = manager_user_id or project.get("manager_user_id")
    if not manager_user_id:
        return error_response("Project must be linked to a department manager first", 400)
    if manager_user_id != project.get("manager_user_id"):
        return error_response("Task manager must match the manager assigned to the project department", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO tasks (
            title, description, status, priority, manager_user_id,
            assigned_by_admin_user_id, assigned_to, project_id, deadline
        )
        VALUES (%s, %s, %s, %s, %s, %s, NULL, %s, %s)
        """,
        (
            title,
            description or None,
            "TO_DO",
            priority,
            manager_user_id,
            request_user["id"],
            project_id,
            deadline,
        ),
    )
    task_id = cursor.lastrowid
    conn.commit()

    manager = get_user_by_id(manager_user_id)
    if manager:
        create_notification(
            manager["id"],
            "Task assigned by admin",
            f"You have received '{title}' for project '{project.get('project_name') or 'Unassigned'}'.",
            "task",
            conn=conn,
        )
        conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Task assigned to manager successfully",
        "task_id": task_id,
        "manager_user_id": manager_user_id,
        "project_id": project_id,
    }), 201


@app.route("/my-department-projects", methods=["GET"])
def my_department_projects():
    request_user, error = require_authenticated_user()
    if error:
        return error
    if request_user["role"] != "manager":
        return error_response("Manager access required", 403)
    return jsonify(get_projects().get_json())


@app.route("/assign-employee-to-project", methods=["POST"])
def assign_employee_to_project():
    request_user, error = require_manager_or_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    try:
        project_id = parse_int_id(data.get("project_id"), "Project", required=True)
        employee_id = parse_int_id(data.get("employee_id"), "Employee", required=True)
    except ValueError as exc:
        return error_response(str(exc), 400)

    project = get_project_by_id(project_id)
    employee = get_employee_by_id(employee_id)
    if not project:
        return error_response("Project not found", 404)
    if not employee:
        return error_response("Employee not found", 404)
    if request_user["role"] == "manager" and project.get("manager_user_id") != request_user["id"]:
        return error_response("Managers can only assign employees to their own department projects", 403)
    if project.get("department_id") and employee.get("department_id") and employee["department_id"] != project["department_id"]:
        return error_response("Managers can only assign employees from their own department", 400)
    if project.get("department_id") and employee.get("department_id") is None:
        department = get_department_by_id(project["department_id"])
        if department and employee.get("department") != department["name"]:
            return error_response("Managers can only assign employees from their own department", 400)

    conn = get_db_connection()
    try:
        team_member_ids = get_project_team_member_ids(project_id)
        if employee_id not in team_member_ids:
            team_member_ids.append(employee_id)
        sync_project_team_members(project_id, sorted(team_member_ids), request_user["id"], conn=conn)
        conn.commit()
    finally:
        conn.close()

    return jsonify({
        "message": "Employee assigned to project successfully",
        "project_id": project_id,
        "employee_id": employee_id,
    })


@app.route("/assign-task-to-employee", methods=["POST"])
def assign_task_to_employee():
    request_user, error = require_authenticated_user()
    if error:
        return error
    if request_user["role"] != "manager":
        return error_response("Manager access required", 403)

    data = request.get_json(silent=True) or {}
    try:
        task_id = parse_int_id(data.get("task_id"), "Task", required=True)
        employee_id = parse_int_id(data.get("employee_id"), "Employee", required=True)
    except ValueError as exc:
        return error_response(str(exc), 400)

    task = get_task_detail(task_id)
    employee = get_employee_by_id(employee_id)
    if not task:
        return error_response("Task not found", 404)
    if not employee:
        return error_response("Employee not found", 404)
    if task.get("manager_user_id") != request_user["id"] and task.get("project_manager_user_id") != request_user["id"]:
        return error_response("Managers can only assign employees for tasks assigned to them", 403)
    if task.get("project_id") and not employee_is_in_project_team(task["project_id"], employee_id):
        return error_response("Employee must be assigned to the project before receiving task work", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE tasks SET assigned_to=%s, manager_user_id=%s WHERE id=%s",
        (employee_id, request_user["id"], task_id),
    )
    conn.commit()
    sync_task_assignment(task_id, employee_id, request_user["id"], conn=conn)
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "message": "Task assigned to employee successfully",
        "task_id": task_id,
        "employee_id": employee_id,
        "assigned_by_manager": request_user["id"],
    })


@app.route("/my-tasks", methods=["GET"])
def my_tasks():
    request_user, error = require_authenticated_user()
    if error:
        return error
    if request_user["role"] != "employee":
        return error_response("Employee access required", 403)
    return jsonify(get_tasks_for_scope(request_user))


@app.route("/my-projects", methods=["GET"])
def my_projects():
    request_user, error = require_authenticated_user()
    if error:
        return error
    if request_user["role"] != "employee":
        return error_response("Employee access required", 403)
    return jsonify(get_projects().get_json())
@app.route("/employees", methods=["GET"])
def get_employees():
    request_user, error = require_authenticated_user()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if request_user["role"] == "admin":
        cursor.execute(
            """
            SELECT id, user_id, name, email, role, department_id, department
            FROM employees
            ORDER BY name ASC
            """
        )
    elif request_user["role"] == "manager":
        managed_departments = get_departments_for_manager(request_user["id"])
        department_names = [department["name"] for department in managed_departments]
        if not department_names:
            cursor.close()
            conn.close()
            return jsonify([])
        placeholders = ",".join(["%s"] * len(department_names))
        cursor.execute(
            f"""
            SELECT id, user_id, name, email, role, department_id, department
            FROM employees
            WHERE department IN ({placeholders})
            ORDER BY name ASC
            """,
            tuple(department_names),
        )
    else:
        employee = get_employee_for_user(request_user)
        cursor.close()
        conn.close()
        return jsonify([employee] if employee else [])

    employees = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(employees)


@app.route("/employees/me", methods=["GET"])
def get_employee_profile():
    request_user, error = require_authenticated_user()
    if error:
        return error

    employee = get_employee_for_user(request_user)
    if not employee:
        return error_response("Employee profile not found", 404)

    return jsonify({"employee": employee})


@app.route("/employees/me", methods=["PUT"])
def update_employee_profile():
    request_user, error = require_authenticated_user()
    if error:
        return error

    employee = get_employee_for_user(request_user)
    if not employee:
        return error_response("Employee profile not found", 404)

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    role = (data.get("role") or "").strip()

    if not name:
        return error_response("Employee name is required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE employees
        SET name=%s, role=%s
        WHERE id=%s
        """,
        (name, role, employee["id"]),
    )
    cursor.execute(
        "UPDATE users SET name=%s WHERE id=%s",
        (name, request_user["id"]),
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Profile updated successfully"}), 200


@app.route("/managers", methods=["GET"])
def get_managers():
    _, error = require_authenticated_user()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT
            users.id,
            users.name,
            users.email,
            users.role,
            departments.id AS department_id,
            departments.name AS department_name
        FROM users
        LEFT JOIN departments ON departments.manager_user_id = users.id
        WHERE users.role='manager'
        ORDER BY users.name ASC
        """
    )
    managers = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(managers)


@app.route("/departments", methods=["GET"])
def get_departments():
    request_user, error = require_authenticated_user()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request_user["role"] == "manager":
        cursor.execute(
            """
            SELECT
                departments.id,
                departments.name,
                departments.description,
                departments.manager_user_id,
                departments.created_at,
                users.name AS manager_name,
                users.email AS manager_email
            FROM departments
            LEFT JOIN users ON departments.manager_user_id = users.id
            WHERE departments.manager_user_id=%s
            ORDER BY name ASC
            """,
            (request_user["id"],),
        )
    elif request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        if not employee or not employee.get("department_id"):
            cursor.close()
            conn.close()
            return jsonify([])
        cursor.execute(
            """
            SELECT
                departments.id,
                departments.name,
                departments.description,
                departments.manager_user_id,
                departments.created_at,
                users.name AS manager_name,
                users.email AS manager_email
            FROM departments
            LEFT JOIN users ON departments.manager_user_id = users.id
            WHERE departments.id=%s
            ORDER BY name ASC
            """,
            (employee["department_id"],),
        )
    else:
        cursor.execute(
            """
            SELECT
                departments.id,
                departments.name,
                departments.description,
                departments.manager_user_id,
                departments.created_at,
                users.name AS manager_name,
                users.email AS manager_email
            FROM departments
            LEFT JOIN users ON departments.manager_user_id = users.id
            ORDER BY name ASC
        """
        )
    departments = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(departments)


@app.route("/departments", methods=["POST"])
def add_department():
    _, error = require_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    manager_user_id = data.get("manager_user_id")

    if not name:
        return error_response("Department name is required", 400)

    try:
        manager_user_id = parse_int_id(manager_user_id, "Manager", required=False)
    except ValueError as exc:
        return error_response(str(exc), 400)

    if manager_user_id:
        manager = get_user_by_id(manager_user_id)
        if not manager or manager["role"] != "manager":
            return error_response("Selected department manager is invalid", 400)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            INSERT INTO departments (name, description, manager_user_id)
            VALUES (%s, %s, %s)
            """,
            (name, description or None, manager_user_id),
        )
        conn.commit()
        department_id = cursor.lastrowid
        cursor.execute(
            """
            SELECT
                departments.id,
                departments.name,
                departments.description,
                departments.manager_user_id,
                departments.created_at,
                users.name AS manager_name,
                users.email AS manager_email
            FROM departments
            LEFT JOIN users ON departments.manager_user_id = users.id
            WHERE departments.id=%s
            """,
            (department_id,),
        )
        department = cursor.fetchone()
    except mysql.connector.IntegrityError:
        return error_response("Department name already exists", 409)
    finally:
        cursor.close()
        conn.close()

    return jsonify({
        "message": "Department created successfully",
        "department": department,
    }), 201


@app.route("/departments/<int:department_id>", methods=["PUT"])
def update_department(department_id):
    _, error = require_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    manager_user_id = data.get("manager_user_id")

    if not name:
        return error_response("Department name is required", 400)

    try:
        manager_user_id = parse_int_id(manager_user_id, "Manager", required=False)
    except ValueError as exc:
        return error_response(str(exc), 400)

    if manager_user_id:
        manager = get_user_by_id(manager_user_id)
        if not manager or manager["role"] != "manager":
            return error_response("Selected department manager is invalid", 400)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT name, manager_user_id FROM departments WHERE id=%s",
            (department_id,),
        )
        current_department = cursor.fetchone()

        if not current_department:
            return error_response("Department not found", 404)

        previous_name = current_department["name"]

        cursor.execute(
            """
            UPDATE departments
            SET name=%s, description=%s, manager_user_id=%s
            WHERE id=%s
            """,
            (name, description or None, manager_user_id, department_id),
        )
        conn.commit()

        cursor.execute(
            """
            UPDATE employees
            SET department_id=%s, department=%s
            WHERE department=%s
            """,
            (department_id, name, previous_name),
        )
        conn.commit()

        cursor.execute(
            """
            UPDATE projects
            SET manager_user_id=%s
            WHERE department_id=%s
            """,
            (manager_user_id, department_id),
        )
        conn.commit()

        cursor.execute(
            """
            SELECT
                departments.id,
                departments.name,
                departments.description,
                departments.manager_user_id,
                departments.created_at,
                users.name AS manager_name,
                users.email AS manager_email
            FROM departments
            LEFT JOIN users ON departments.manager_user_id = users.id
            WHERE departments.id=%s
            """,
            (department_id,),
        )
        department = cursor.fetchone()
    except mysql.connector.IntegrityError:
        return error_response("Department name already exists", 409)
    finally:
        cursor.close()
        conn.close()

    return jsonify({
        "message": "Department updated successfully",
        "department": department,
    })


@app.route("/departments/<int:department_id>", methods=["DELETE"])
def delete_department(department_id):
    _, error = require_admin()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT name FROM departments WHERE id=%s",
        (department_id,),
    )
    department = cursor.fetchone()

    if not department:
        cursor.close()
        conn.close()
        return error_response("Department not found", 404)

    cursor.execute(
        "UPDATE employees SET department_id=NULL, department=NULL WHERE department=%s OR department_id=%s",
        (department["name"], department_id),
    )
    cursor.execute(
        """
        UPDATE projects
        SET manager_user_id=NULL
        WHERE department_id=%s
        """,
        (department_id,),
    )
    cursor.execute("DELETE FROM departments WHERE id=%s", (department_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Department deleted successfully"})


@app.route("/assign-manager", methods=["POST"])
def assign_manager_to_department():
    _, error = require_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    try:
        department_id = parse_int_id(data.get("department_id"), "Department", required=True)
        manager_user_id = parse_int_id(data.get("manager_user_id"), "Manager", required=True)
    except ValueError as exc:
        return error_response(str(exc), 400)

    department = get_department_by_id(department_id)
    manager = get_user_by_id(manager_user_id)
    if not department:
        return error_response("Department not found", 404)
    if not manager or manager["role"] != "manager":
        return error_response("Selected manager is invalid", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE departments SET manager_user_id=%s WHERE id=%s",
        (manager_user_id, department_id),
    )
    cursor.execute(
        "UPDATE projects SET manager_user_id=%s WHERE department_id=%s",
        (manager_user_id, department_id),
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "message": "Manager assigned successfully",
        "department_id": department_id,
        "manager_user_id": manager_user_id,
    })


@app.route("/projects", methods=["GET"])
def get_projects():
    request_user, error = require_authenticated_user()
    if error:
        return error

    query, params = build_project_list_query(request_user)
    if query is None:
        return jsonify([])

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, tuple(params))
    projects = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(projects)


@app.route("/projects", methods=["POST"])
def add_project():
    request_user, error = require_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    project_name = (data.get("project_name") or "").strip()
    description = (data.get("description") or "").strip()
    team_member_ids = data.get("team_member_ids") or []

    if not project_name:
        return error_response("Project name is required", 400)

    try:
        department_id = parse_int_id(data.get("department_id"), "Department", required=True)
        manager_user_id = parse_int_id(data.get("manager_user_id"), "Manager", required=True)
        team_member_ids = normalize_team_member_ids(team_member_ids)
    except ValueError as exc:
        return error_response(str(exc), 400)

    department = get_department_by_id(department_id)
    if not department:
        return error_response("Selected department does not exist", 400)

    manager = get_user_by_id(manager_user_id)
    if not manager or manager["role"] != "manager":
        return error_response("Selected manager is invalid", 400)

    if department.get("manager_user_id") != manager_user_id:
        return error_response("Selected manager must be assigned as the department manager", 400)

    try:
        valid_employee_ids = validate_team_members_for_department(department["name"], team_member_ids)
    except ValueError as exc:
        return error_response(str(exc), 400)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        INSERT INTO projects (project_name, description, department_id, manager_user_id, created_by)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (project_name, description or None, department_id, manager_user_id, request_user["id"]),
    )
    conn.commit()
    project_id = cursor.lastrowid

    if valid_employee_ids:
        sync_project_team_members(project_id, valid_employee_ids, request_user["id"], conn=conn)
        conn.commit()

    cursor.execute(
        """
        SELECT
            projects.id,
            projects.project_name,
            projects.description,
            projects.department_id,
            projects.manager_user_id,
            projects.created_by,
            projects.created_at,
            users.name AS created_by_name,
            departments.name AS department_name,
            managers.name AS manager_name,
            managers.email AS manager_email
        FROM projects
        LEFT JOIN users ON projects.created_by = users.id
        LEFT JOIN departments ON projects.department_id = departments.id
        LEFT JOIN users AS managers ON projects.manager_user_id = managers.id
        WHERE projects.id=%s
        """,
        (project_id,),
    )
    project = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Project created successfully",
        "project": project,
    }), 201


@app.route("/projects/<int:project_id>", methods=["PUT"])
def update_project(project_id):
    request_user, error = require_manager_or_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    project_name = (data.get("project_name") or "").strip()
    description = (data.get("description") or "").strip()
    team_member_ids = data.get("team_member_ids")

    if not project_name:
        return error_response("Project name is required", 400)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT created_by, department_id, manager_user_id FROM projects WHERE id=%s",
        (project_id,),
    )
    project_owner = cursor.fetchone()
    if not project_owner:
        cursor.close()
        conn.close()
        return error_response("Project not found", 404)

    if request_user["role"] == "manager" and project_owner["manager_user_id"] != request_user["id"]:
        cursor.close()
        conn.close()
        return error_response("Managers can only update projects assigned to them", 403)

    department_id = project_owner["department_id"]
    manager_user_id = project_owner["manager_user_id"]

    if request_user["role"] == "admin":
        try:
            department_id = parse_int_id(data.get("department_id"), "Department", required=True)
            manager_user_id = parse_int_id(data.get("manager_user_id"), "Manager", required=True)
            if team_member_ids is not None:
                team_member_ids = normalize_team_member_ids(team_member_ids)
        except ValueError as exc:
            cursor.close()
            conn.close()
            return error_response(str(exc), 400)

        department = get_department_by_id(department_id)
        manager = get_user_by_id(manager_user_id)
        if not department:
            cursor.close()
            conn.close()
            return error_response("Selected department does not exist", 400)
        if not manager or manager["role"] != "manager":
            cursor.close()
            conn.close()
            return error_response("Selected manager is invalid", 400)
        if department.get("manager_user_id") != manager_user_id:
            cursor.close()
            conn.close()
            return error_response("Selected manager must be assigned as the department manager", 400)
    else:
        department = get_department_by_id(department_id) if department_id else None
        if team_member_ids is not None:
            try:
                team_member_ids = normalize_team_member_ids(team_member_ids)
            except ValueError as exc:
                cursor.close()
                conn.close()
                return error_response(str(exc), 400)

    if team_member_ids is not None:
        if not department:
            cursor.close()
            conn.close()
            return error_response("Project department not found", 400)
        try:
            valid_employee_ids = validate_team_members_for_department(
                department["name"],
                team_member_ids,
            )
        except ValueError:
            cursor.close()
            conn.close()
            return error_response("All project team members must belong to the project department", 400)
    else:
        valid_employee_ids = None

    cursor.execute(
        """
        UPDATE projects
        SET project_name=%s, description=%s, department_id=%s, manager_user_id=%s
        WHERE id=%s
        """,
        (project_name, description or None, department_id, manager_user_id, project_id),
    )
    conn.commit()

    if valid_employee_ids is not None:
        sync_project_team_members(project_id, valid_employee_ids, request_user["id"], conn=conn)
        conn.commit()

    cursor.execute(
        """
        SELECT
            projects.id,
            projects.project_name,
            projects.description,
            projects.department_id,
            projects.manager_user_id,
            projects.created_by,
            projects.created_at,
            users.name AS created_by_name,
            departments.name AS department_name,
            managers.name AS manager_name,
            managers.email AS manager_email
        FROM projects
        LEFT JOIN users ON projects.created_by = users.id
        LEFT JOIN departments ON projects.department_id = departments.id
        LEFT JOIN users AS managers ON projects.manager_user_id = managers.id
        WHERE projects.id=%s
        """,
        (project_id,),
    )
    project = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Project updated successfully",
        "project": project,
    })


@app.route("/projects/<int:project_id>/team", methods=["PUT"])
def update_project_team(project_id):
    request_user, error = require_manager_or_admin()
    if error:
        return error

    project = get_project_by_id(project_id)
    if not project:
        return error_response("Project not found", 404)

    if request_user["role"] == "manager" and project.get("manager_user_id") != request_user["id"]:
        return error_response("Managers can only manage team members for their assigned projects", 403)

    department = get_department_by_id(project["department_id"]) if project.get("department_id") else None
    if not department:
        return error_response("Project department not found", 400)

    data = request.get_json(silent=True) or {}
    try:
        team_member_ids = normalize_team_member_ids(data.get("team_member_ids") or [])
        valid_employee_ids = validate_team_members_for_department(
            department["name"],
            team_member_ids,
        )
    except ValueError as exc:
        return error_response(str(exc), 400)

    conn = get_db_connection()
    try:
        sync_project_team_members(project_id, valid_employee_ids, request_user["id"], conn=conn)
        conn.commit()
    finally:
        conn.close()

    return jsonify({
        "message": "Project team updated successfully",
        "project_id": project_id,
        "team_member_ids": valid_employee_ids,
    })


@app.route("/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    request_user, error = require_admin()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT created_by FROM projects WHERE id=%s",
        (project_id,),
    )
    project_owner = cursor.fetchone()
    if not project_owner:
        cursor.close()
        conn.close()
        return error_response("Project not found", 404)

    cursor.execute("UPDATE tasks SET project_id=NULL WHERE project_id=%s", (project_id,))
    cursor.execute("DELETE FROM project_team_members WHERE project_id=%s", (project_id,))
    cursor.execute("DELETE FROM projects WHERE id=%s", (project_id,))
    conn.commit()
    deleted_rows = cursor.rowcount

    cursor.close()
    conn.close()

    if deleted_rows == 0:
        return error_response("Project not found", 404)

    return jsonify({"message": "Project deleted successfully"})


@app.route("/projects/<int:project_id>/team", methods=["GET"])
def get_project_team(project_id):
    request_user, error = require_authenticated_user()
    if error:
        return error

    project = get_project_by_id(project_id)
    if not project:
        return error_response("Project not found", 404)
    if request_user["role"] == "manager" and project.get("manager_user_id") != request_user["id"]:
        return error_response("Managers can only view team for their assigned projects", 403)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT
            employees.id,
            employees.user_id,
            employees.name,
            employees.email,
            employees.role,
            employees.department_id,
            employees.department
        FROM project_team_members
        INNER JOIN employees ON project_team_members.employee_id = employees.id
        WHERE project_team_members.project_id=%s
        ORDER BY employees.name ASC
        """,
        (project_id,),
    )
    members = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(members)


@app.route("/assign-project-to-department", methods=["POST"])
def assign_project_to_department():
    _, error = require_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    try:
        project_id = parse_int_id(data.get("project_id"), "Project", required=True)
        department_id = parse_int_id(data.get("department_id"), "Department", required=True)
    except ValueError as exc:
        return error_response(str(exc), 400)

    project = get_project_by_id(project_id)
    department = get_department_by_id(department_id)
    if not project:
        return error_response("Project not found", 404)
    if not department:
        return error_response("Department not found", 404)
    if not department.get("manager_user_id"):
        return error_response("Assign a manager to the department before linking projects", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE projects
        SET department_id=%s, manager_user_id=%s
        WHERE id=%s
        """,
        (department_id, department["manager_user_id"], project_id),
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "message": "Project assigned to department successfully",
        "project_id": project_id,
        "department_id": department_id,
        "manager_user_id": department["manager_user_id"],
    })


@app.route("/dashboard-stats")
def dashboard_stats():
    request_user, error = require_authenticated_user()
    if error:
        return error

    return jsonify(build_dashboard_stats(request_user))


@app.route("/dashboard-insights")
def dashboard_insights():
    request_user, error = require_authenticated_user()
    if error:
        return error

    return jsonify(build_dashboard_insights(request_user))


@app.route("/reports/overview")
def reports_overview():
    request_user, error = require_authenticated_user()
    if error:
        return error

    return jsonify(build_reports_payload(request_user))


@app.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    request_user, error = require_authenticated_user()
    if error:
        return error

    if request_user["id"] != user_id and request_user["role"] != "admin":
        return error_response("You can only update your own profile", 403)

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()

    if not name or not email:
        return error_response("Name and email are required", 400)

    if not is_valid_email(email):
        return error_response("A valid email address is required", 400)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            UPDATE users
            SET name=%s, email=%s
            WHERE id=%s
            """,
            (name, email, user_id),
        )
        if cursor.rowcount == 0:
            return error_response("User not found", 404)

        cursor.execute(
            """
            UPDATE employees
            SET name=%s, email=%s
            WHERE user_id=%s
            """,
            (name, email, user_id),
        )
        conn.commit()

        cursor.execute(
            """
            SELECT id, name, email, role, created_at
            FROM users
            WHERE id=%s
            """,
            (user_id,),
        )
        user = cursor.fetchone()
    except mysql.connector.IntegrityError:
        return error_response("Email is already in use", 409)
    finally:
        cursor.close()
        conn.close()

    return jsonify({
        "message": "Profile updated successfully",
        "user": build_user_payload(user),
    })


@app.route("/users/<int:user_id>/password", methods=["PUT"])
def update_user_password(user_id):
    request_user, error = require_authenticated_user()
    if error:
        return error

    if request_user["id"] != user_id and request_user["role"] != "admin":
        return error_response("You can only update your own password", 403)

    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if not current_password or not new_password:
        return error_response("Current and new passwords are required", 400)

    if len(new_password) < 6:
        return error_response("New password must be at least 6 characters", 400)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT id, password FROM users WHERE id=%s",
        (user_id,),
    )
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return error_response("User not found", 404)

    stored_password = user["password"]
    password_matches = (
        check_password_hash(stored_password, current_password)
        or stored_password == current_password
    )

    if not password_matches:
        cursor.close()
        conn.close()
        return error_response("Current password is incorrect", 400)

    cursor.execute(
        "UPDATE users SET password=%s WHERE id=%s",
        (generate_password_hash(new_password), user_id),
    )
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Password changed successfully"})


# =============================
# ATTENDANCE MANAGEMENT
# =============================

@app.route("/attendance", methods=["GET"])
def get_attendance():
    request_user, error = require_authenticated_user()
    if error:
        return error

    employee_id = request.args.get("employee_id", type=int)
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    try:
        parsed_date_from = parse_date_value(date_from, "date_from") if date_from else None
        parsed_date_to = parse_date_value(date_to, "date_to") if date_to else None
    except ValueError as exc:
        return error_response(str(exc), 400)

    if parsed_date_from and parsed_date_to and parsed_date_from > parsed_date_to:
        return error_response("date_from cannot be after date_to", 400)

    if request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        if not employee:
            return error_response("Employee record not found", 404)
    elif request_user["role"] == "manager":
        managed_employee_ids = get_manager_employee_ids(request_user["id"])
        if not managed_employee_ids:
            return jsonify([])
        if employee_id and employee_id not in managed_employee_ids:
            return error_response("Managers can only view attendance for their own team", 403)

    records = get_attendance_records_for_scope(request_user)

    if not records:
        records = get_attendance_records_from_audit_logs(
            request_user,
            employee_id=employee_id,
            date_from=parsed_date_from,
            date_to=parsed_date_to,
        )
    else:
        records = [
            record for record in records
            if (not employee_id or record.get("employee_id") == employee_id)
            and (not parsed_date_from or str(record.get("date")) >= parsed_date_from.isoformat())
            and (not parsed_date_to or str(record.get("date")) <= parsed_date_to.isoformat())
        ]

    return jsonify(records)


@app.route("/attendance", methods=["POST"])
def mark_attendance():
    request_user, error = require_authenticated_user()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    try:
        employee_id = parse_int_id(data.get("employee_id"), "Employee ID", required=True)
        attendance_date = parse_date_value(data.get("date"), "Date", required=True)
        check_in = parse_time_value(data.get("check_in"), "Check-in")
        check_out = parse_time_value(data.get("check_out"), "Check-out")
    except ValueError as exc:
        return error_response(str(exc), 400)

    status = (data.get("status") or "present").lower().strip()
    if status not in ATTENDANCE_STATUSES:
        return error_response("Invalid attendance status", 400)
    if not employee_exists(employee_id):
        return error_response("Employee record not found", 404)
    if check_in and check_out and check_out <= check_in:
        return error_response("Check-out must be later than check-in", 400)

    if request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        if not employee or employee["id"] != employee_id:
            return error_response("Cannot mark attendance for others", 403)
    elif request_user["role"] == "manager" and not can_access_employee(request_user, employee_id):
        return error_response("Managers can only mark attendance for their own team", 403)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO attendance (employee_id, date, check_in, check_out, status)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                check_in=VALUES(check_in),
                check_out=VALUES(check_out),
                status=VALUES(status)
            """,
            (employee_id, attendance_date, check_in, check_out, status),
        )
        conn.commit()
        employee_record = get_employee_by_id(employee_id)
        if employee_record and employee_record.get("user_id") and request_user["role"] in {"admin", "manager"}:
            create_notification(
                employee_record["user_id"],
                "Attendance updated",
                f"Your attendance for {attendance_date.isoformat()} was updated to {status.replace('_', ' ')}.",
                "info",
                conn=conn,
            )
            conn.commit()
        create_audit_log(
            request_user["id"],
            "attendance_recorded",
            "attendance",
            None,
            {"employee_id": employee_id, "date": attendance_date.isoformat(), "status": status},
        )
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return error_response(f"Database error: {str(e)}", 400)

    cursor.close()
    conn.close()

    return jsonify({"message": "Attendance recorded"}), 201


@app.route("/attendance/<int:attendance_id>", methods=["PUT"])
def update_attendance(attendance_id):
    request_user, error = require_manager_or_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT employee_id FROM attendance WHERE id=%s", (attendance_id,))
    record = cursor.fetchone()
    if not record:
        cursor.close()
        conn.close()
        return error_response("Attendance record not found", 404)
    if request_user["role"] == "manager" and not can_access_employee(request_user, record["employee_id"]):
        cursor.close()
        conn.close()
        return error_response("Managers can only update attendance for their own team", 403)

    try:
        check_in = parse_time_value(data.get("check_in"), "Check-in") if "check_in" in data else None
        check_out = parse_time_value(data.get("check_out"), "Check-out") if "check_out" in data else None
    except ValueError as exc:
        cursor.close()
        conn.close()
        return error_response(str(exc), 400)

    status = (data.get("status") or "").lower().strip()
    notes = (data.get("notes") or "").strip()

    if status and status not in ATTENDANCE_STATUSES:
        cursor.close()
        conn.close()
        return error_response("Invalid attendance status", 400)
    if check_in and check_out and check_out <= check_in:
        cursor.close()
        conn.close()
        return error_response("Check-out must be later than check-in", 400)

    updates = []
    params = []

    if check_in is not None:
        updates.append("check_in=%s")
        params.append(check_in)

    if check_out is not None:
        updates.append("check_out=%s")
        params.append(check_out)

    if status:
        updates.append("status=%s")
        params.append(status)

    if notes is not None:
        updates.append("notes=%s")
        params.append(notes)

    if not updates:
        cursor.close()
        conn.close()
        return error_response("No fields to update", 400)

    updates.append("updated_at=NOW()")
    params.append(attendance_id)

    query = f"UPDATE attendance SET {', '.join(updates)} WHERE id=%s"
    cursor.execute(query, tuple(params))
    conn.commit()

    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        return error_response("Attendance record not found", 404)

    employee_record = get_employee_by_id(record["employee_id"])
    if employee_record and employee_record.get("user_id"):
        create_notification(
            employee_record["user_id"],
            "Attendance reviewed",
            "An attendance record linked to your account was updated.",
            "info",
            conn=conn,
        )
        conn.commit()
    create_audit_log(
        request_user["id"],
        "attendance_updated",
        "attendance",
        attendance_id,
        {"employee_id": record["employee_id"], "status": status or None},
    )

    cursor.close()
    conn.close()

    return jsonify({"message": "Attendance updated"})


# =============================
# LEAVE REQUEST MANAGEMENT
# =============================

@app.route("/leave-requests", methods=["GET"])
def get_leave_requests():
    request_user, error = require_authenticated_user()
    if error:
        return error

    status_filter = request.args.get("status", "").lower().strip()
    employee_id = request.args.get("employee_id", type=int)

    if status_filter and status_filter not in LEAVE_STATUSES:
        return error_response("Invalid leave status filter", 400)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT
        lr.id,
        lr.employee_id,
        lr.start_date,
        lr.end_date,
        lr.leave_type,
        lr.reason,
        lr.status,
        lr.reviewed_by,
        lr.review_notes,
        lr.reviewed_at,
        lr.created_at,
        e.name AS employee_name,
        e.email AS employee_email,
        u.name AS reviewed_by_name
    FROM leave_requests lr
    LEFT JOIN employees e ON lr.employee_id = e.id
    LEFT JOIN users u ON lr.reviewed_by = u.id
    WHERE 1=1
    """
    params = []

    if request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        if not employee:
            cursor.close()
            conn.close()
            return error_response("Employee record not found", 404)
        query += " AND lr.employee_id=%s"
        params.append(employee["id"])
    elif request_user["role"] == "manager":
        if employee_id:
            query += " AND lr.employee_id=%s"
            params.append(employee_id)
    elif employee_id:
        query += " AND lr.employee_id=%s"
        params.append(employee_id)

    if status_filter:
        query += " AND lr.status=%s"
        params.append(status_filter)

    query += " ORDER BY lr.created_at DESC, lr.id DESC"
    cursor.execute(query, tuple(params))
    requests = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(requests)


@app.route("/leave-requests/pending", methods=["GET"])
def get_pending_leave_requests():
    request_user, error = require_manager_or_admin()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if request_user["role"] == "admin":
        query = """
        SELECT
            lr.id,
            lr.employee_id,
            lr.start_date,
            lr.end_date,
            lr.leave_type,
            lr.reason,
            lr.status,
            lr.created_at,
            e.name AS employee_name,
            e.email AS employee_email,
            e.department AS employee_department
        FROM leave_requests lr
        LEFT JOIN employees e ON lr.employee_id = e.id
        WHERE lr.status='pending'
        ORDER BY lr.created_at DESC
        """
        cursor.execute(query)
    else:
        query = """
        SELECT
            lr.id,
            lr.employee_id,
            lr.start_date,
            lr.end_date,
            lr.leave_type,
            lr.reason,
            lr.status,
            lr.created_at,
            e.name AS employee_name,
            e.email AS employee_email,
            e.department AS employee_department
        FROM leave_requests lr
        LEFT JOIN employees e ON lr.employee_id = e.id
        WHERE lr.status='pending'
        ORDER BY lr.created_at DESC
        """
        cursor.execute(query)

    requests = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(requests)


@app.route("/leave-requests", methods=["POST"])
def submit_leave_request():
    request_user, error = require_authenticated_user()
    if error:
        return error

    payload = request.get_json(silent=True) or {}
    print("submit_leave_request payload:", payload)
    try:
        employee_id = parse_int_id(payload.get("employee_id"), "Employee ID", required=True)
        start_date = parse_date_value(payload.get("start_date"), "Start date", required=True)
        end_date = parse_date_value(payload.get("end_date"), "End date", required=True)
    except ValueError as exc:
        return error_response(str(exc), 400)

    leave_type = (payload.get("leave_type") or "vacation").lower()
    reason = (payload.get("reason") or "").strip()

    if leave_type not in LEAVE_TYPES:
        return error_response("Invalid leave type", 400)
    if not employee_exists(employee_id):
        return error_response("Employee record not found", 404)
    if start_date > end_date:
        return error_response("Start date cannot be after end date", 400)

    if request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        if not employee or employee["id"] != employee_id:
            return error_response("Cannot submit leave for others", 403)
    elif request_user["role"] == "manager" and not employee_exists(employee_id):
        return error_response("Employee record not found", 404)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        print("Before insert leave_requests")
        cursor.execute(
            """
            INSERT INTO leave_requests (employee_id, start_date, end_date, leave_type, reason)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (employee_id, start_date, end_date, leave_type, reason or None),
        )
        conn.commit()
        request_id = cursor.lastrowid
        print("After insert leave_requests, request_id:", request_id)

        cursor.execute(
            """
            SELECT
                lr.id,
                lr.employee_id,
                lr.start_date,
                lr.end_date,
                lr.leave_type,
                lr.reason,
                lr.status,
                lr.created_at,
                e.name AS employee_name
            FROM leave_requests lr
            LEFT JOIN employees e ON lr.employee_id = e.id
            WHERE lr.id=%s
            """,
            (request_id,),
        )
        leave_request_record = cursor.fetchone()
        create_audit_log(
            request_user["id"],
            "leave_submitted",
            "leave_request",
            request_id,
            {
                "employee_id": employee_id,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "leave_type": leave_type,
            },
        )
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return error_response(f"Database error: {str(e)}", 400)

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Leave request submitted successfully",
        "request": leave_request_record,
    }), 201


@app.route("/leave-requests/<int:request_id>", methods=["PUT"])
def update_leave_request(request_id):
    request_user, error = require_authenticated_user()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    action = (data.get("action") or "").lower()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT employee_id, status FROM leave_requests WHERE id=%s",
        (request_id,),
    )
    leave_req = cursor.fetchone()

    if not leave_req:
        cursor.close()
        conn.close()
        return error_response("Leave request not found", 404)

    if request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        if not employee or employee["id"] != leave_req["employee_id"]:
            cursor.close()
            conn.close()
            return error_response("Cannot update others' leave requests", 403)
    if action == "approve":
        if request_user["role"] not in {"admin", "manager"}:
            cursor.close()
            conn.close()
            return error_response("Only managers and admins can approve", 403)
        if leave_req["status"] != "pending":
            cursor.close()
            conn.close()
            return error_response("Only pending leave requests can be approved", 400)

        review_notes = (data.get("review_notes") or "").strip()
        cursor.execute(
            """
            UPDATE leave_requests
            SET status='approved', reviewed_by=%s, review_notes=%s, reviewed_at=NOW()
            WHERE id=%s
            """,
            (request_user["id"], review_notes or None, request_id),
        )

    elif action == "reject":
        if request_user["role"] not in {"admin", "manager"}:
            cursor.close()
            conn.close()
            return error_response("Only managers and admins can reject", 403)
        if leave_req["status"] != "pending":
            cursor.close()
            conn.close()
            return error_response("Only pending leave requests can be rejected", 400)

        review_notes = (data.get("review_notes") or "").strip()
        cursor.execute(
            """
            UPDATE leave_requests
            SET status='rejected', reviewed_by=%s, review_notes=%s, reviewed_at=NOW()
            WHERE id=%s
            """,
            (request_user["id"], review_notes or None, request_id),
        )

    elif action == "cancel":
        if request_user["role"] not in {"employee", "admin", "manager"}:
            cursor.close()
            conn.close()
            return error_response("Only authenticated users can cancel leave requests", 403)
        if leave_req["status"] not in {"pending", "approved"}:
            cursor.close()
            conn.close()
            return error_response("Cannot cancel this leave request", 400)

        cursor.execute(
            "UPDATE leave_requests SET status='cancelled' WHERE id=%s",
            (request_id,),
        )

    else:
        cursor.close()
        conn.close()
        return error_response("Invalid action. Use 'approve', 'reject', or 'cancel'", 400)

    conn.commit()

    cursor.execute(
        """
        SELECT
            lr.id,
            lr.employee_id,
            lr.start_date,
            lr.end_date,
            lr.leave_type,
            lr.reason,
            lr.status,
            lr.reviewed_by,
            lr.review_notes,
            lr.reviewed_at,
            e.name AS employee_name
        FROM leave_requests lr
        LEFT JOIN employees e ON lr.employee_id = e.id
        WHERE lr.id=%s
        """,
        (request_id,),
    )
    updated_request = cursor.fetchone()

    employee_record = get_employee_by_id(leave_req["employee_id"])
    if action in {"approve", "reject", "cancel"} and employee_record and employee_record.get("user_id"):
        create_notification(
            employee_record["user_id"],
            "Leave request updated",
            f"Your leave request is now {updated_request['status']}.",
            "info",
            conn=conn,
        )
        conn.commit()
    create_audit_log(
        request_user["id"],
        f"leave_{action}",
        "leave_request",
        request_id,
        {"employee_id": leave_req["employee_id"], "status": updated_request["status"]},
    )

    cursor.close()
    conn.close()

    action_message = {
        "approve": "approved",
        "reject": "rejected",
        "cancel": "cancelled",
    }.get(action, action)

    return jsonify({
        "message": f"Leave request {action_message} successfully",
        "request": updated_request,
    })


@app.route("/leave-requests/<int:request_id>", methods=["DELETE"])
def delete_leave_request(request_id):
    request_user, error = require_authenticated_user()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT employee_id, status FROM leave_requests WHERE id=%s",
        (request_id,),
    )
    leave_req = cursor.fetchone()

    if not leave_req:
        cursor.close()
        conn.close()
        return error_response("Leave request not found", 404)

    if request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        if not employee or employee["id"] != leave_req["employee_id"]:
            cursor.close()
            conn.close()
            return error_response("Cannot delete others' leave requests", 403)

        if leave_req["status"] != "pending":
            cursor.close()
            conn.close()
            return error_response("Can only delete pending leave requests", 400)
    elif request_user["role"] == "manager" and not can_access_employee(request_user, leave_req["employee_id"]):
        cursor.close()
        conn.close()
        return error_response("Managers can only delete leave requests for their own team", 403)

    cursor.execute("DELETE FROM leave_requests WHERE id=%s", (request_id,))
    conn.commit()
    deleted_rows = cursor.rowcount

    cursor.close()
    conn.close()

    if deleted_rows == 0:
        return error_response("Leave request not found", 404)

    create_audit_log(
        request_user["id"],
        "leave_deleted",
        "leave_request",
        request_id,
        {"employee_id": leave_req["employee_id"]},
    )

    return jsonify({"message": "Leave request deleted"})


# =============================
# ATTENDANCE STATISTICS
# =============================

@app.route("/attendance/stats", methods=["GET"])
def get_attendance_stats():
    request_user, error = require_authenticated_user()
    if error:
        return error

    employee_id = request.args.get("employee_id", type=int)
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    if not month or not year:
        from datetime import datetime
        now = datetime.now()
        month = month or now.month
        year = year or now.year

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT
        COUNT(*) as total_days,
        SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status='half_day' THEN 1 ELSE 0 END) as half_days,
        SUM(CASE WHEN status='leave' THEN 1 ELSE 0 END) as leave_days
    FROM attendance
    WHERE MONTH(date)=%s AND YEAR(date)=%s
    """
    params = [month, year]

    if request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        if not employee:
            return error_response("Employee record not found", 404)
        query += " AND employee_id=%s"
        params.append(employee["id"])
    elif request_user["role"] == "manager":
        managed_employee_ids = get_manager_employee_ids(request_user["id"])
        if not managed_employee_ids:
            cursor.close()
            conn.close()
            return jsonify({
                "total_days": 0,
                "present_days": 0,
                "absent_days": 0,
                "half_days": 0,
                "leave_days": 0,
                "attendance_rate": 0,
            })
        if employee_id and employee_id not in managed_employee_ids:
            cursor.close()
            conn.close()
            return error_response("Managers can only view attendance stats for their own team", 403)
        target_ids = [employee_id] if employee_id else managed_employee_ids
        placeholders = ",".join(["%s"] * len(target_ids))
        query += f" AND employee_id IN ({placeholders})"
        params.extend(target_ids)
    elif employee_id:
        query += " AND employee_id=%s"
        params.append(employee_id)

    cursor.execute(query, tuple(params))
    stats = cursor.fetchone()

    cursor.close()
    conn.close()

    if not stats or not stats["total_days"]:
        return jsonify({
            "total_days": 0,
            "present_days": 0,
            "absent_days": 0,
            "half_days": 0,
            "leave_days": 0,
            "attendance_rate": 0,
        })

    attendance_rate = round((stats["present_days"] / stats["total_days"]) * 100) if stats["total_days"] > 0 else 0

    return jsonify({
        "total_days": stats["total_days"],
        "present_days": stats["present_days"] or 0,
        "absent_days": stats["absent_days"] or 0,
        "half_days": stats["half_days"] or 0,
        "leave_days": stats["leave_days"] or 0,
        "attendance_rate": attendance_rate,
    })


# =============================
# LEAVE BALANCE TRACKING
# =============================

@app.route("/leave-balance/<int:employee_id>", methods=["GET"])
def get_leave_balance(employee_id):
    request_user, error = require_authenticated_user()
    if error:
        return error

    if request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        if not employee or employee["id"] != employee_id:
            return error_response("Cannot view others' leave balance", 403)
    elif request_user["role"] == "manager" and not can_access_employee(request_user, employee_id):
        return error_response("Managers can only view leave balance for their own team", 403)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    year = request.args.get("year", type=int) or datetime.now().year

    cursor.execute(
        """
        SELECT
            leave_type,
            SUM(DATEDIFF(end_date, start_date) + 1) as used_days
        FROM leave_requests
        WHERE employee_id=%s
        AND status='approved'
        AND YEAR(start_date)=%s
        GROUP BY leave_type
        """,
        (employee_id, year),
    )
    leave_usage = cursor.fetchall()

    cursor.close()
    conn.close()

    leave_balance = {
        "vacation": {"allocated": 20, "used": 0},
        "sick": {"allocated": 10, "used": 0},
        "personal": {"allocated": 5, "used": 0},
        "unpaid": {"allocated": 0, "used": 0},
        "emergency": {"allocated": 3, "used": 0},
    }

    for usage in leave_usage:
        leave_type = usage["leave_type"]
        if leave_type in leave_balance:
            leave_balance[leave_type]["used"] = int(usage["used_days"] or 0)

    for leave_type in leave_balance:
        leave_balance[leave_type]["remaining"] = int(max(
            0,
            leave_balance[leave_type]["allocated"] - leave_balance[leave_type]["used"]
        ))

    return jsonify(leave_balance)


# =============================
# PAYROLL MANAGEMENT
# =============================

@app.route("/payroll", methods=["GET"])
def get_payroll():
    request_user, error = require_authenticated_user()
    if error:
        return error

    if request_user["role"] == "manager":
        return error_response("Payroll access is restricted to admins and the employee themself", 403)

    employee_id = request.args.get("employee_id", type=int)
    status_filter = (request.args.get("status") or "").lower().strip()

    if status_filter and status_filter not in PAYROLL_STATUSES:
        return error_response("Invalid payroll status filter", 400)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
    SELECT
        p.id,
        p.employee_id,
        p.pay_period_start,
        p.pay_period_end,
        p.base_salary,
        p.bonus,
        p.deductions,
        p.net_pay,
        p.status,
        p.paid_at,
        p.created_at,
        p.updated_at,
        e.name AS employee_name,
        e.email AS employee_email,
        e.department AS employee_department
    FROM payroll p
    LEFT JOIN employees e ON p.employee_id = e.id
    WHERE 1=1
    """
    params = []

    if request_user["role"] == "employee":
        employee = get_employee_for_user(request_user)
        if not employee:
            cursor.close()
            conn.close()
            return error_response("Employee profile not found", 404)
        query += " AND p.employee_id=%s"
        params.append(employee["id"])
    elif employee_id:
        query += " AND p.employee_id=%s"
        params.append(employee_id)

    if status_filter:
        query += " AND p.status=%s"
        params.append(status_filter)

    query += " ORDER BY p.pay_period_end DESC, p.id DESC"
    cursor.execute(query, tuple(params))
    records = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(records)


@app.route("/payroll", methods=["POST"])
def create_payroll():
    request_user, error = require_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    try:
        employee_id = parse_int_id(data.get("employee_id"), "Employee ID", required=True)
        pay_period_start = parse_date_value(data.get("pay_period_start"), "Pay period start", required=True)
        pay_period_end = parse_date_value(data.get("pay_period_end"), "Pay period end", required=True)
        base_salary = parse_decimal_value(data.get("base_salary"), "Base salary", required=True, minimum=0)
        bonus = parse_decimal_value(data.get("bonus"), "Bonus", minimum=0) or Decimal("0.00")
        deductions = parse_decimal_value(data.get("deductions"), "Deductions", minimum=0) or Decimal("0.00")
        supplied_net_pay = parse_decimal_value(data.get("net_pay"), "Net pay", minimum=0)
    except ValueError as exc:
        return error_response(str(exc), 400)

    status = (data.get("status") or "pending").lower().strip()
    if status not in PAYROLL_STATUSES:
        return error_response("Invalid payroll status", 400)
    if pay_period_start > pay_period_end:
        return error_response("Pay period start cannot be after pay period end", 400)
    if not employee_exists(employee_id):
        return error_response("Employee record not found", 404)

    calculated_net_pay = (base_salary + bonus - deductions).quantize(Decimal("0.01"))
    net_pay = supplied_net_pay if supplied_net_pay is not None else calculated_net_pay
    if net_pay != calculated_net_pay:
        return error_response("Net pay must equal base salary + bonus - deductions", 400)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT id
        FROM payroll
        WHERE employee_id=%s AND pay_period_start=%s AND pay_period_end=%s
        LIMIT 1
        """,
        (employee_id, pay_period_start, pay_period_end),
    )
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return error_response("Payroll already exists for this employee and pay period", 409)

    paid_at = datetime.now() if status == "paid" else None
    cursor.execute(
        """
        INSERT INTO payroll (
            employee_id, pay_period_start, pay_period_end, base_salary, bonus,
            deductions, net_pay, status, paid_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            employee_id,
            pay_period_start,
            pay_period_end,
            base_salary,
            bonus,
            deductions,
            net_pay,
            status,
            paid_at,
        ),
    )
    payroll_id = cursor.lastrowid
    conn.commit()

    employee_record = get_employee_by_id(employee_id)
    if employee_record and employee_record.get("user_id"):
        create_notification(
            employee_record["user_id"],
            "Payroll generated",
            f"Payroll for {pay_period_start.isoformat()} to {pay_period_end.isoformat()} is now available.",
            "info",
            conn=conn,
        )
        conn.commit()

    create_audit_log(
        request_user["id"],
        "payroll_created",
        "payroll",
        payroll_id,
        {
            "employee_id": employee_id,
            "pay_period_start": pay_period_start.isoformat(),
            "pay_period_end": pay_period_end.isoformat(),
            "status": status,
        },
    )

    cursor.close()
    conn.close()

    return jsonify({"message": "Payroll created", "payroll_id": payroll_id}), 201


@app.route("/payroll/<int:payroll_id>", methods=["PUT"])
def update_payroll(payroll_id):
    request_user, error = require_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM payroll WHERE id=%s", (payroll_id,))
    payroll_record = cursor.fetchone()
    if not payroll_record:
        cursor.close()
        conn.close()
        return error_response("Payroll record not found", 404)

    try:
        pay_period_start = (
            parse_date_value(data.get("pay_period_start"), "Pay period start")
            if "pay_period_start" in data
            else payroll_record["pay_period_start"]
        )
        pay_period_end = (
            parse_date_value(data.get("pay_period_end"), "Pay period end")
            if "pay_period_end" in data
            else payroll_record["pay_period_end"]
        )
        base_salary = (
            parse_decimal_value(data.get("base_salary"), "Base salary", minimum=0)
            if "base_salary" in data
            else Decimal(str(payroll_record["base_salary"]))
        )
        bonus = (
            parse_decimal_value(data.get("bonus"), "Bonus", minimum=0)
            if "bonus" in data
            else Decimal(str(payroll_record["bonus"]))
        )
        deductions = (
            parse_decimal_value(data.get("deductions"), "Deductions", minimum=0)
            if "deductions" in data
            else Decimal(str(payroll_record["deductions"]))
        )
        supplied_net_pay = (
            parse_decimal_value(data.get("net_pay"), "Net pay", minimum=0)
            if "net_pay" in data
            else Decimal(str(payroll_record["net_pay"]))
        )
    except ValueError as exc:
        cursor.close()
        conn.close()
        return error_response(str(exc), 400)

    status = (data.get("status") or payroll_record["status"]).lower().strip()
    if status not in PAYROLL_STATUSES:
        cursor.close()
        conn.close()
        return error_response("Invalid payroll status", 400)
    if pay_period_start > pay_period_end:
        cursor.close()
        conn.close()
        return error_response("Pay period start cannot be after pay period end", 400)

    calculated_net_pay = (base_salary + bonus - deductions).quantize(Decimal("0.01"))
    if supplied_net_pay != calculated_net_pay:
        cursor.close()
        conn.close()
        return error_response("Net pay must equal base salary + bonus - deductions", 400)

    cursor.execute(
        """
        SELECT id
        FROM payroll
        WHERE employee_id=%s
          AND pay_period_start=%s
          AND pay_period_end=%s
          AND id<>%s
        LIMIT 1
        """,
        (payroll_record["employee_id"], pay_period_start, pay_period_end, payroll_id),
    )
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return error_response("Another payroll already exists for this pay period", 409)

    paid_at = payroll_record["paid_at"]
    if status == "paid" and not paid_at:
        paid_at = datetime.now()
    elif status != "paid":
        paid_at = None

    cursor.execute(
        """
        UPDATE payroll
        SET pay_period_start=%s,
            pay_period_end=%s,
            base_salary=%s,
            bonus=%s,
            deductions=%s,
            net_pay=%s,
            status=%s,
            paid_at=%s
        WHERE id=%s
        """,
        (
            pay_period_start,
            pay_period_end,
            base_salary,
            bonus,
            deductions,
            calculated_net_pay,
            status,
            paid_at,
            payroll_id,
        ),
    )
    conn.commit()

    employee_record = get_employee_by_id(payroll_record["employee_id"])
    if employee_record and employee_record.get("user_id"):
        create_notification(
            employee_record["user_id"],
            "Payroll updated",
            f"Your payroll record for {pay_period_end.isoformat()} was updated.",
            "info",
            conn=conn,
        )
        conn.commit()

    create_audit_log(
        request_user["id"],
        "payroll_updated",
        "payroll",
        payroll_id,
        {"employee_id": payroll_record["employee_id"], "status": status},
    )

    cursor.close()
    conn.close()

    return jsonify({"message": "Payroll updated"})


# =============================
# NOTIFICATIONS
# =============================

@app.route("/notifications", methods=["GET"])
def get_notifications():
    request_user, error = require_authenticated_user()
    if error:
        return error

    unread_only = request.args.get("unread") == "true"

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
    SELECT id, title, body, notification_type, is_read, created_at, read_at
    FROM notifications
    WHERE user_id=%s
    """
    params = [request_user["id"]]

    if unread_only:
        query += " AND is_read=FALSE"

    query += " ORDER BY created_at DESC, id DESC"
    cursor.execute(query, tuple(params))
    notifications = cursor.fetchall()
    cursor.close()
    conn.close()

    unread_count = sum(1 for notification in notifications if not notification["is_read"])
    return jsonify({"notifications": notifications, "unread_count": unread_count})


@app.route("/notifications/read-all", methods=["PUT"])
def read_all_notifications():
    request_user, error = require_authenticated_user()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE notifications
        SET is_read=TRUE, read_at=COALESCE(read_at, NOW())
        WHERE user_id=%s AND is_read=FALSE
        """,
        (request_user["id"],),
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Notifications marked as read"})


@app.route("/notifications/<int:notification_id>/read", methods=["PUT"])
def read_notification(notification_id):
    request_user, error = require_authenticated_user()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE notifications
        SET is_read=TRUE, read_at=COALESCE(read_at, NOW())
        WHERE id=%s AND user_id=%s
        """,
        (notification_id, request_user["id"]),
    )
    conn.commit()
    updated_rows = cursor.rowcount
    cursor.close()
    conn.close()

    if updated_rows == 0:
        return error_response("Notification not found", 404)

    return jsonify({"message": "Notification marked as read"})


@app.route("/notifications/<int:notification_id>", methods=["DELETE"])
def delete_notification(notification_id):
    request_user, error = require_authenticated_user()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM notifications WHERE id=%s AND user_id=%s",
        (notification_id, request_user["id"]),
    )
    conn.commit()
    deleted_rows = cursor.rowcount
    cursor.close()
    conn.close()

    if deleted_rows == 0:
        return error_response("Notification not found", 404)

    return jsonify({"message": "Notification deleted"})


# =============================
# PROFILE OVERVIEW
# =============================

@app.route("/profile/overview", methods=["GET"])
def get_profile_overview():
    request_user, error = require_authenticated_user()
    if error:
        return error

    user = get_user_by_id(request_user["id"])
    employee = get_employee_for_user(request_user)
    tasks = get_tasks_for_scope(request_user)
    attendance_records = get_attendance_records_for_scope(request_user)
    leave_requests = get_leave_requests_for_scope(request_user)
    payroll_records = get_payroll_records_for_scope(request_user)

    stats = {
        "tasks_done": sum(1 for task in tasks if task["status"] == "DONE"),
        "tasks_in_progress": sum(1 for task in tasks if task["status"] == "IN_PROGRESS"),
        "attendance_records": len(attendance_records),
        "leave_requests": len(leave_requests),
        "payroll_records": len(payroll_records),
    }

    completion_denominator = len(tasks) or 1
    stats["performance"] = round((stats["tasks_done"] / completion_denominator) * 100) if tasks else 0

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT id, title, body, notification_type, created_at
        FROM notifications
        WHERE user_id=%s
        ORDER BY created_at DESC, id DESC
        LIMIT 6
        """,
        (request_user["id"],),
    )
    activity = cursor.fetchall()
    cursor.close()
    conn.close()

    recent_activity = [
        {
            "id": item["id"],
            "title": item["title"],
            "body": item["body"],
            "type": item["notification_type"],
            "created_at": serialize_date(item["created_at"]),
        }
        for item in activity
    ]

    return jsonify({
        "user": build_user_payload(user) if user else None,
        "employee": employee,
        "stats": stats,
        "recent_activity": recent_activity,
    })


# =============================
# Run Server
# =============================
if __name__ == "__main__":
    app.run(debug=True)
