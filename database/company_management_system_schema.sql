CREATE DATABASE IF NOT EXISTS company_management_system;
USE company_management_system;

CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','manager','employee') NOT NULL DEFAULT 'employee',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `auth_sessions` (
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
  CONSTRAINT `auth_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `departments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `employees` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `role` VARCHAR(50),
  `department` VARCHAR(50),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_employees_user_id` (`user_id`),
  UNIQUE KEY `uniq_employees_email` (`email`),
  KEY `idx_employees_name` (`name`),
  KEY `idx_employees_email` (`email`),
  CONSTRAINT `fk_employees_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `projects` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `project_name` VARCHAR(150),
  `description` TEXT,
  `created_by` INT,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `tasks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(150),
  `description` TEXT,
  `status` VARCHAR(50),
  `assigned_to` INT,
  `project_id` INT,
  `deadline` DATE,
  `priority` VARCHAR(20),
  PRIMARY KEY (`id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `attendance` (
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
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `leave_requests` (
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
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `payroll` (
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
  UNIQUE KEY `uniq_employee_pay_period` (`employee_id`,`pay_period_start`,`pay_period_end`),
  CONSTRAINT `payroll_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `notifications` (
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
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `audit_logs` (
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
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
