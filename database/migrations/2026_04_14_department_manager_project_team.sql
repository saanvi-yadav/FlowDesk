USE company_management_system;

ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS manager_user_id INT NULL,
  ADD KEY IF NOT EXISTS manager_user_id (manager_user_id);

ALTER TABLE departments
  ADD CONSTRAINT departments_ibfk_1
  FOREIGN KEY (manager_user_id) REFERENCES users(id)
  ON DELETE SET NULL;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS department_id INT NULL,
  ADD COLUMN IF NOT EXISTS manager_user_id INT NULL,
  ADD KEY IF NOT EXISTS department_id (department_id),
  ADD KEY IF NOT EXISTS manager_user_id (manager_user_id);

ALTER TABLE projects
  ADD CONSTRAINT projects_ibfk_2
  FOREIGN KEY (department_id) REFERENCES departments(id)
  ON DELETE SET NULL;

ALTER TABLE projects
  ADD CONSTRAINT projects_ibfk_3
  FOREIGN KEY (manager_user_id) REFERENCES users(id)
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS project_team_members (
  id INT NOT NULL AUTO_INCREMENT,
  project_id INT NOT NULL,
  employee_id INT NOT NULL,
  assigned_by INT NULL,
  assigned_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_project_employee (project_id, employee_id),
  KEY employee_id (employee_id),
  KEY assigned_by (assigned_by),
  CONSTRAINT project_team_members_ibfk_1 FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT project_team_members_ibfk_2 FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT project_team_members_ibfk_3 FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);
