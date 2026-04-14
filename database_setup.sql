-- ===========================================
-- FlowDesk Database Setup Script
-- Company Management System
-- ===========================================
-- This script sets up the complete database for the FlowDesk application
-- Run this script in MySQL to create the database and all tables
--
-- Prerequisites:
-- 1. MySQL Server installed and running
-- 2. MySQL client or MySQL Workbench
-- 3. User with database creation privileges
--
-- Usage:
-- mysql -u root -p < database_setup.sql
-- ===========================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS company_management_system;
USE company_management_system;

-- ===========================================
-- TABLE CREATION
-- ===========================================

-- Users table (authentication and user management)
CREATE TABLE IF NOT EXISTS `users` (
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

-- Authentication sessions table
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
  CONSTRAINT `auth_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Departments table
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `manager_user_id` INT,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `manager_user_id` (`manager_user_id`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Employees table
CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `role` VARCHAR(50),
  `department_id` INT,
  `department` VARCHAR(50),
  `hire_date` DATE,
  `salary` DECIMAL(12,2),
  `status` ENUM('active','inactive','terminated') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_employees_user_id` (`user_id`),
  UNIQUE KEY `uniq_employees_email` (`email`),
  KEY `department_id` (`department_id`),
  KEY `idx_employees_name` (`name`),
  KEY `idx_employees_email` (`email`),
  CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_employees_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Projects table
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `project_name` VARCHAR(150),
  `description` TEXT,
  `department_id` INT,
  `manager_user_id` INT,
  `created_by` INT,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `department_id` (`department_id`),
  KEY `manager_user_id` (`manager_user_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_3` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Project team members table
CREATE TABLE IF NOT EXISTS `project_team_members` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `project_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `assigned_by` INT,
  `assigned_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_project_employee` (`project_id`,`employee_id`),
  KEY `employee_id` (`employee_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `project_team_members_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_team_members_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_team_members_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tasks table
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(150),
  `description` TEXT,
  `status` VARCHAR(50),
  `manager_user_id` INT,
  `assigned_by_admin_user_id` INT,
  `assigned_to` INT,
  `project_id` INT,
  `deadline` DATE,
  `priority` VARCHAR(20),
  PRIMARY KEY (`id`),
  KEY `manager_user_id` (`manager_user_id`),
  KEY `assigned_by_admin_user_id` (`assigned_by_admin_user_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `tasks_ibfk_3` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tasks_ibfk_4` FOREIGN KEY (`assigned_by_admin_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Task assignments table
CREATE TABLE IF NOT EXISTS `task_assignments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `task_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `assigned_by_manager` INT NOT NULL,
  `assigned_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_task_employee_assignment` (`task_id`,`employee_id`),
  KEY `employee_id` (`employee_id`),
  KEY `assigned_by_manager` (`assigned_by_manager`),
  CONSTRAINT `task_assignments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_assignments_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_assignments_ibfk_3` FOREIGN KEY (`assigned_by_manager`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Attendance table
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
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Leave requests table
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
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Payroll table
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
  UNIQUE KEY `uniq_employee_pay_period` (`employee_id`,`pay_period_start`,`pay_period_end`),
  CONSTRAINT `payroll_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Notifications table
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
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Audit logs table
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
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===========================================
-- SAMPLE DATA INSERTION
-- ===========================================

-- Insert sample users (passwords are hashed - these are demo values)
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(1, 'Admin User', 'admin@flowdesk.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYLC7Tkz5W', 'admin'),
(2, 'Manager User', 'manager@flowdesk.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYLC7Tkz5W', 'manager'),
(3, 'Employee User', 'employee@flowdesk.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYLC7Tkz5W', 'employee');

-- Insert sample departments
INSERT IGNORE INTO `departments` (`id`, `name`, `description`, `manager_user_id`) VALUES
(1, 'Engineering', 'Software development and technical operations', 2),
(2, 'UI/UX Design', 'User interface and user experience design', 2),
(3, 'Operations', 'Business operations and management', 2);

-- Insert sample employees
INSERT IGNORE INTO `employees` (`id`, `user_id`, `name`, `email`, `role`, `department_id`, `department`, `hire_date`, `salary`, `status`) VALUES
(1, 1, 'Admin User', 'admin@flowdesk.com', 'Administrator', 1, 'Engineering', '2024-01-01', 75000.00, 'active'),
(2, 2, 'Manager User', 'manager@flowdesk.com', 'Manager', 1, 'Engineering', '2024-01-01', 65000.00, 'active'),
(3, 3, 'Employee User', 'employee@flowdesk.com', 'Developer', 1, 'Engineering', '2024-01-01', 55000.00, 'active'),
(4, NULL, 'Rahul Sharma', 'rahul@flowdesk.com', 'Developer', 1, 'Engineering', '2024-02-01', 60000.00, 'active'),
(5, NULL, 'Priya Patel', 'priya@flowdesk.com', 'Designer', 2, 'UI/UX Design', '2024-02-01', 58000.00, 'active'),
(6, NULL, 'Arjun Nair', 'arjun@flowdesk.com', 'Manager', 3, 'Operations', '2024-02-01', 62000.00, 'active');

-- Insert sample projects
INSERT IGNORE INTO `projects` (`id`, `project_name`, `description`, `department_id`, `manager_user_id`, `created_by`) VALUES
(1, 'FlowDesk Web App', 'Main company management web application', 1, 2, 1),
(2, 'Mobile App Development', 'Native mobile application for employee access', 1, 2, 1),
(3, 'UI Redesign', 'Complete redesign of user interface', 2, 2, 1);

-- Insert sample tasks
INSERT IGNORE INTO `tasks` (`id`, `title`, `description`, `status`, `manager_user_id`, `assigned_to`, `project_id`, `deadline`, `priority`) VALUES
(1, 'Setup Database Schema', 'Create and configure database tables', 'completed', 2, 3, 1, '2024-12-31', 'high'),
(2, 'Implement Authentication', 'Build login and registration system', 'in_progress', 2, 3, 1, '2024-12-31', 'high'),
(3, 'Design Dashboard UI', 'Create main dashboard interface', 'pending', 2, 5, 3, '2024-12-31', 'medium');

-- ===========================================
-- SETUP COMPLETE MESSAGE
-- ===========================================

SELECT 'FlowDesk Database Setup Complete!' as Status;
SELECT 'Default login credentials:' as Info;
SELECT 'Admin: admin@flowdesk.com / password123' as Credentials;
SELECT 'Manager: manager@flowdesk.com / password123' as Credentials;
SELECT 'Employee: employee@flowdesk.com / password123' as Credentials;