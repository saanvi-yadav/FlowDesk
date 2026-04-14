UPDATE projects p
LEFT JOIN departments d ON p.department_id = d.id
SET p.manager_user_id = d.manager_user_id
WHERE p.department_id IS NOT NULL;

DELETE ptm
FROM project_team_members ptm
LEFT JOIN projects p ON ptm.project_id = p.id
LEFT JOIN departments d ON p.department_id = d.id
LEFT JOIN employees e ON ptm.employee_id = e.id
WHERE p.id IS NULL
   OR d.id IS NULL
   OR e.id IS NULL
   OR e.department <> d.name;

UPDATE tasks t
LEFT JOIN project_team_members ptm
  ON ptm.project_id = t.project_id
 AND ptm.employee_id = t.assigned_to
SET t.assigned_to = NULL
WHERE t.project_id IS NOT NULL
  AND t.assigned_to IS NOT NULL
  AND ptm.id IS NULL;
