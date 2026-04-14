from db import get_db_connection


def get_department_manager_assignment(department_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT
            departments.id,
            departments.name,
            departments.manager_user_id,
            users.name AS manager_name,
            users.email AS manager_email,
            users.role AS manager_role
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
