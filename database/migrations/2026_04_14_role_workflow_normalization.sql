USE company_management_system;

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS department_id INT NULL,
  ADD KEY IF NOT EXISTS department_id (department_id);

ALTER TABLE employees
  ADD CONSTRAINT employees_ibfk_2
  FOREIGN KEY (department_id) REFERENCES departments(id)
  ON DELETE SET NULL;

UPDATE employees e
LEFT JOIN departments d ON e.department = d.name
SET e.department_id = d.id
WHERE e.department IS NOT NULL
  AND e.department_id IS NULL;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS manager_user_id INT NULL,
  ADD COLUMN IF NOT EXISTS assigned_by_admin_user_id INT NULL,
  ADD KEY IF NOT EXISTS manager_user_id (manager_user_id),
  ADD KEY IF NOT EXISTS assigned_by_admin_user_id (assigned_by_admin_user_id);

ALTER TABLE tasks
  ADD CONSTRAINT tasks_ibfk_3
  FOREIGN KEY (manager_user_id) REFERENCES users(id)
  ON DELETE SET NULL;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_ibfk_4
  FOREIGN KEY (assigned_by_admin_user_id) REFERENCES users(id)
  ON DELETE SET NULL;

UPDATE tasks t
LEFT JOIN projects p ON t.project_id = p.id
SET t.manager_user_id = p.manager_user_id
WHERE t.manager_user_id IS NULL;

CREATE TABLE IF NOT EXISTS task_assignments (
  id INT NOT NULL AUTO_INCREMENT,
  task_id INT NOT NULL,
  employee_id INT NOT NULL,
  assigned_by_manager INT NOT NULL,
  assigned_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_task_employee_assignment (task_id, employee_id),
  KEY employee_id (employee_id),
  KEY assigned_by_manager (assigned_by_manager),
  CONSTRAINT task_assignments_ibfk_1 FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT task_assignments_ibfk_2 FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT task_assignments_ibfk_3 FOREIGN KEY (assigned_by_manager) REFERENCES users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO task_assignments (task_id, employee_id, assigned_by_manager)
SELECT t.id, t.assigned_to, COALESCE(t.manager_user_id, p.manager_user_id)
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.assigned_to IS NOT NULL
  AND COALESCE(t.manager_user_id, p.manager_user_id) IS NOT NULL;
