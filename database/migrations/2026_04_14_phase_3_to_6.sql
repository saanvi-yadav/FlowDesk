-- Phase 3-6 migration for FlowDesk
-- Run this against the same MySQL database your Flask app uses.
-- Default app DB name in backend/.env or backend/db.py is usually `company_management_system`.
-- If your active DB is `flowdesk`, run `USE flowdesk;` instead.

USE company_management_system;

CREATE TABLE IF NOT EXISTS `auth_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(64) NOT NULL,
  `user_id` INT NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  `revoked_at` DATETIME,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `auth_sessions_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `users`
  MODIFY COLUMN `name` VARCHAR(100) NOT NULL,
  MODIFY COLUMN `email` VARCHAR(150) NOT NULL,
  MODIFY COLUMN `role` ENUM('admin','manager','employee') NOT NULL DEFAULT 'employee';

ALTER TABLE `employees`
  ADD COLUMN IF NOT EXISTS `user_id` INT NULL,
  MODIFY COLUMN `name` VARCHAR(100) NOT NULL,
  MODIFY COLUMN `email` VARCHAR(150) NOT NULL,
  MODIFY COLUMN `role` VARCHAR(50) NULL,
  MODIFY COLUMN `department` VARCHAR(50) NULL;

UPDATE `employees` e
JOIN `users` u
  ON LOWER(e.email) = LOWER(u.email)
SET e.`user_id` = u.`id`
WHERE e.`user_id` IS NULL;

DELIMITER $$

DROP PROCEDURE IF EXISTS `ensure_unique_index_if_missing`$$
CREATE PROCEDURE `ensure_unique_index_if_missing`(
  IN p_table_name VARCHAR(64),
  IN p_index_name VARCHAR(64),
  IN p_index_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = p_table_name
      AND index_name = p_index_name
  ) THEN
    SET @sql_stmt = p_index_sql;
    PREPARE stmt FROM @sql_stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS `drop_index_if_exists`$$
CREATE PROCEDURE `drop_index_if_exists`(
  IN p_table_name VARCHAR(64),
  IN p_index_name VARCHAR(64)
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = p_table_name
      AND index_name = p_index_name
  ) THEN
    SET @sql_stmt = CONCAT('ALTER TABLE `', p_table_name, '` DROP INDEX `', p_index_name, '`');
    PREPARE stmt FROM @sql_stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS `add_fk_if_missing`$$
CREATE PROCEDURE `add_fk_if_missing`(
  IN p_table_name VARCHAR(64),
  IN p_constraint_name VARCHAR(64),
  IN p_constraint_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = DATABASE()
      AND table_name = p_table_name
      AND constraint_name = p_constraint_name
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    SET @sql_stmt = p_constraint_sql;
    PREPARE stmt FROM @sql_stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DELIMITER ;

CALL `ensure_unique_index_if_missing`(
  'employees',
  'uniq_employees_user_id',
  'ALTER TABLE `employees` ADD UNIQUE KEY `uniq_employees_user_id` (`user_id`)'
);

CALL `ensure_unique_index_if_missing`(
  'employees',
  'uniq_employees_email',
  'ALTER TABLE `employees` ADD UNIQUE KEY `uniq_employees_email` (`email`)'
);

CALL `ensure_unique_index_if_missing`(
  'employees',
  'idx_employees_name',
  'ALTER TABLE `employees` ADD KEY `idx_employees_name` (`name`)'
);

CALL `ensure_unique_index_if_missing`(
  'employees',
  'idx_employees_email',
  'ALTER TABLE `employees` ADD KEY `idx_employees_email` (`email`)'
);

CALL `add_fk_if_missing`(
  'employees',
  'fk_employees_user_id',
  'ALTER TABLE `employees` ADD CONSTRAINT `fk_employees_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE'
);

ALTER TABLE `projects`
  ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP;

CALL `ensure_unique_index_if_missing`(
  'users',
  'email',
  'ALTER TABLE `users` ADD UNIQUE KEY `email` (`email`)'
);

CALL `ensure_unique_index_if_missing`(
  'users',
  'idx_users_name',
  'ALTER TABLE `users` ADD KEY `idx_users_name` (`name`)'
);

CALL `ensure_unique_index_if_missing`(
  'projects',
  'created_by',
  'ALTER TABLE `projects` ADD KEY `created_by` (`created_by`)'
);

CALL `add_fk_if_missing`(
  'projects',
  'projects_ibfk_1',
  'ALTER TABLE `projects` ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL'
);

ALTER TABLE `tasks`
  ADD COLUMN IF NOT EXISTS `description` TEXT NULL,
  MODIFY COLUMN `title` VARCHAR(150) NULL,
  MODIFY COLUMN `status` VARCHAR(50) NULL,
  MODIFY COLUMN `assigned_to` INT NULL,
  MODIFY COLUMN `project_id` INT NULL,
  MODIFY COLUMN `deadline` DATE NULL,
  MODIFY COLUMN `priority` VARCHAR(20) NULL;

CALL `ensure_unique_index_if_missing`(
  'tasks',
  'assigned_to',
  'ALTER TABLE `tasks` ADD KEY `assigned_to` (`assigned_to`)'
);

CALL `ensure_unique_index_if_missing`(
  'tasks',
  'project_id',
  'ALTER TABLE `tasks` ADD KEY `project_id` (`project_id`)'
);

CALL `add_fk_if_missing`(
  'tasks',
  'tasks_ibfk_1',
  'ALTER TABLE `tasks` ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `employees` (`id`) ON DELETE SET NULL'
);

CALL `add_fk_if_missing`(
  'tasks',
  'tasks_ibfk_2',
  'ALTER TABLE `tasks` ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL'
);

CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `check_in` TIME,
  `check_out` TIME,
  `status` ENUM('present','absent','half_day','leave') NOT NULL DEFAULT 'present',
  `notes` TEXT,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_date` (`employee_id`,`date`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `attendance_ibfk_1`
    FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_id` INT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `leave_type` ENUM('sick','vacation','personal','unpaid','emergency') NOT NULL DEFAULT 'vacation',
  `reason` TEXT,
  `status` ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `reviewed_by` INT,
  `review_notes` TEXT,
  `reviewed_at` DATETIME,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `leave_requests_ibfk_1`
    FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_2`
    FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `payroll` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_id` INT NOT NULL,
  `pay_period_start` DATE NOT NULL,
  `pay_period_end` DATE NOT NULL,
  `base_salary` DECIMAL(12,2) NOT NULL,
  `bonus` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `deductions` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `net_pay` DECIMAL(12,2) NOT NULL,
  `status` ENUM('pending','paid','failed') NOT NULL DEFAULT 'pending',
  `paid_at` DATETIME,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `payroll_ibfk_1`
    FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CALL `drop_index_if_exists`('payroll', 'pay_period');
CALL `ensure_unique_index_if_missing`(
  'payroll',
  'uniq_employee_pay_period',
  'ALTER TABLE `payroll` ADD UNIQUE KEY `uniq_employee_pay_period` (`employee_id`,`pay_period_start`,`pay_period_end`)'
);

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `body` TEXT NOT NULL,
  `notification_type` ENUM('task','employee','warning','info','system') NOT NULL DEFAULT 'info',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` DATETIME,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `actor_user_id` INT,
  `action_type` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(100) NOT NULL,
  `entity_id` INT,
  `details` JSON,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_actor` (`actor_user_id`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `audit_logs_ibfk_1`
    FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP PROCEDURE IF EXISTS `ensure_unique_index_if_missing`;
DROP PROCEDURE IF EXISTS `drop_index_if_exists`;
DROP PROCEDURE IF EXISTS `add_fk_if_missing`;
