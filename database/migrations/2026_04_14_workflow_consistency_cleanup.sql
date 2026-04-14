USE company_management_system;

UPDATE employees e
LEFT JOIN departments d ON e.department = d.name
SET e.department_id = COALESCE(e.department_id, d.id)
WHERE e.department_id IS NULL
  AND e.department IS NOT NULL;

UPDATE projects p
INNER JOIN departments d ON p.department_id = d.id
SET p.manager_user_id = d.manager_user_id
WHERE p.department_id IS NOT NULL
  AND (
    p.manager_user_id IS NULL
    OR p.manager_user_id <> d.manager_user_id
  );

UPDATE tasks t
INNER JOIN projects p ON t.project_id = p.id
SET t.manager_user_id = p.manager_user_id
WHERE t.project_id IS NOT NULL
  AND (
    t.manager_user_id IS NULL
    OR t.manager_user_id <> p.manager_user_id
  );

UPDATE tasks t
LEFT JOIN project_team_members ptm
  ON ptm.project_id = t.project_id
 AND ptm.employee_id = t.assigned_to
SET t.assigned_to = NULL
WHERE t.project_id IS NOT NULL
  AND t.assigned_to IS NOT NULL
  AND ptm.id IS NULL;

DELETE ta
FROM task_assignments ta
LEFT JOIN tasks t ON ta.task_id = t.id
LEFT JOIN project_team_members ptm
  ON ptm.project_id = t.project_id
 AND ptm.employee_id = ta.employee_id
WHERE t.id IS NULL
   OR (t.project_id IS NOT NULL AND ptm.id IS NULL);
