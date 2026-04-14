# Phase 3-6 Manual Test Checklist

## Before testing

1. Back up the active MySQL database.
2. Confirm the app is pointed at the correct DB in `backend/.env`.
3. Run the migration in [migrations/2026_04_14_phase_3_to_6.sql](/abs/path/c:/Users/dell/Documents/Projects/FlowDesk/Flowdesk/database/migrations/2026_04_14_phase_3_to_6.sql).
4. Restart the Flask backend after the migration.

## Phase 3: Tasks

1. Log in as `admin`.
2. Create a project if needed.
3. Create a task with valid title, project, assignee, priority, and deadline.
4. Confirm the task appears on the task board after refresh.
5. Log in as the assigned employee and move it from `To Do` to `In Progress` and then `Done`.
6. Refresh and confirm the status persisted.
7. Log in as another employee and confirm task status update is rejected.
8. Log in as the manager who owns the project and confirm they can see only tasks for their projects.
9. Edit the task and then delete it as admin or allowed manager.
10. Try invalid payloads:
    - missing project
    - invalid priority
    - invalid status
    - fake assignee
    - malformed deadline 

## Phase 4: Attendance and Leave (all errors)

1. Log in as an employee.
2. Open Attendance and confirm the employee is preselected for self-marking.
3. Mark attendance for today.
4. Refresh and confirm the record persists.
5. Try marking attendance for another employee through the API or UI and confirm rejection.
6. Submit a leave request as the employee.
7. Try invalid dates where `start_date > end_date` and confirm rejection.
8. Log in as admin or the relevant manager.
9. Review attendance and update status or notes.
10. Approve a pending leave request.
11. Refresh employee Leave Requests and confirm status and leave balance updated.
12. Reject another pending request and confirm the status transition is enforced.
13. Cancel an approved or pending request as the employee and confirm allowed cases only.

## Phase 5: Payroll

1. Log in as admin.
2. Open Payroll.
3. Generate a payroll record for an employee and pay period.
4. Refresh and confirm the record persists.
5. Update payroll status from `pending` to `paid`.
6. Try creating a duplicate payroll for the same employee and pay period and confirm rejection.
7 #. Try invalid salary math where `net_pay` does not match `base_salary + bonus - deductions` and confirm rejection. 
8. Log in as the employee and confirm only their payroll records are visible.
9. Log in as a manager and confirm payroll access is denied or hidden.

## Phase 6: Notifications, Reports, Auditability

1. Assign a task and confirm the assignee receives a notification.
2. Complete a task and confirm the project owner receives a notification.
3. Approve or reject leave and confirm the employee receives a notification.
4. Generate or update payroll and confirm the employee receives a notification.
5. Open Notifications and confirm mark-read and delete persist after refresh.
6. Open Profile and confirm stats/activity are not dummy values.
7. Open Dashboard and Reports and confirm attendance, leave, and payroll summary numbers look current.
8. Check `audit_logs` in MySQL for task, attendance, leave, and payroll actions.

## Final regression

1. Test login/logout for admin, manager, and employee.
2. Refresh each major page after create/update/delete actions.
3. Verify no page crashes on empty states.
4. Verify mobile and narrow-width layouts for Tasks, Attendance, Leave Requests, Payroll, Notifications, Reports, and Profile.
