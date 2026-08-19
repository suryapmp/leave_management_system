-- ==========================================================
-- LeaveEase – Employee Leave Management System
-- Complete MySQL Database Schema & Seed Data
-- ==========================================================

CREATE DATABASE IF NOT EXISTS leaveease;
USE leaveease;

-- Drop tables if they exist to allow clean re-import
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS leave_balance_adjustments;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS holidays;
DROP TABLE IF EXISTS leave_approval_history;
DROP TABLE IF EXISTS leave_request_days;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS leave_balances;
DROP TABLE IF EXISTS leave_types;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS designations;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS users;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `avatar` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `departments`
-- --------------------------------------------------------
CREATE TABLE `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `department_name` VARCHAR(100) NOT NULL,
  `department_code` VARCHAR(20) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `manager_id` INT NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `designations`
-- --------------------------------------------------------
CREATE TABLE `designations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `department_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `employees`
-- --------------------------------------------------------
CREATE TABLE `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_code` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT NOT NULL UNIQUE,
  `department_id` INT NULL,
  `designation_id` INT NULL,
  `manager_id` INT NULL,
  `phone` VARCHAR(30) NULL,
  `emergency_contact` VARCHAR(30) NULL,
  `gender` ENUM('MALE', 'FEMALE', 'OTHER') DEFAULT 'OTHER',
  `joining_date` DATE NOT NULL,
  `employment_type` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN') NOT NULL DEFAULT 'FULL_TIME',
  `status` ENUM('ACTIVE', 'INACTIVE', 'PROBATION', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  `address` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`designation_id`) REFERENCES `designations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`manager_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `leave_types`
-- --------------------------------------------------------
CREATE TABLE `leave_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `annual_limit` DECIMAL(5,1) NOT NULL DEFAULT 12.0,
  `carry_forward_allowed` TINYINT(1) NOT NULL DEFAULT 0,
  `max_carry_forward` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `document_required` TINYINT(1) NOT NULL DEFAULT 0,
  `minimum_days` DECIMAL(3,1) NOT NULL DEFAULT 0.5,
  `maximum_days` DECIMAL(5,1) NOT NULL DEFAULT 30.0,
  `color_code` VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
  `is_paid` TINYINT(1) NOT NULL DEFAULT 1,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `leave_balances`
-- --------------------------------------------------------
CREATE TABLE `leave_balances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `leave_type_id` INT NOT NULL,
  `year` INT NOT NULL,
  `allocated` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `used` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `pending` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `remaining` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `carried_forward` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_employee_leave_year` (`employee_id`, `leave_type_id`, `year`),
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `leave_requests`
-- --------------------------------------------------------
CREATE TABLE `leave_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_number` VARCHAR(50) NOT NULL UNIQUE,
  `employee_id` INT NOT NULL,
  `leave_type_id` INT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `start_session` ENUM('FULL_DAY', 'FIRST_HALF', 'SECOND_HALF') NOT NULL DEFAULT 'FULL_DAY',
  `end_session` ENUM('FULL_DAY', 'FIRST_HALF', 'SECOND_HALF') NOT NULL DEFAULT 'FULL_DAY',
  `total_days` DECIMAL(5,1) NOT NULL,
  `reason` TEXT NOT NULL,
  `document` VARCHAR(255) NULL,
  `document_name` VARCHAR(255) NULL,
  `status` ENUM('DRAFT', 'PENDING', 'MANAGER_APPROVED', 'HR_APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `current_approver_id` INT NULL,
  `rejection_reason` TEXT NULL,
  `cancellation_reason` TEXT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `approved_at` TIMESTAMP NULL,
  `rejected_at` TIMESTAMP NULL,
  `cancelled_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`current_approver_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `leave_request_days`
-- --------------------------------------------------------
CREATE TABLE `leave_request_days` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `leave_request_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `day_type` ENUM('FULL_DAY', 'FIRST_HALF', 'SECOND_HALF') NOT NULL DEFAULT 'FULL_DAY',
  `day_count` DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  `is_weekend` TINYINT(1) NOT NULL DEFAULT 0,
  `is_holiday` TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `leave_approval_history`
-- --------------------------------------------------------
CREATE TABLE `leave_approval_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `leave_request_id` INT NOT NULL,
  `approver_id` INT NOT NULL,
  `action` ENUM('SUBMITTED', 'MANAGER_APPROVED', 'HR_APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL,
  `comments` TEXT NULL,
  `action_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `holidays`
-- --------------------------------------------------------
CREATE TABLE `holidays` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `holiday_name` VARCHAR(150) NOT NULL,
  `holiday_date` DATE NOT NULL UNIQUE,
  `description` TEXT NULL,
  `holiday_type` ENUM('MANDATORY', 'OPTIONAL', 'REGIONAL') NOT NULL DEFAULT 'MANDATORY',
  `year` INT NOT NULL,
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `notifications`
-- --------------------------------------------------------
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('LEAVE_SUBMITTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_CANCELLED', 'BALANCE_ADJUSTED', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `reference_type` VARCHAR(50) NULL,
  `reference_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `leave_balance_adjustments`
-- --------------------------------------------------------
CREATE TABLE `leave_balance_adjustments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `leave_type_id` INT NOT NULL,
  `adjusted_by` INT NOT NULL,
  `adjustment_type` ENUM('ADD', 'DEDUCT', 'OVERRIDE') NOT NULL,
  `amount` DECIMAL(5,1) NOT NULL,
  `previous_balance` DECIMAL(5,1) NOT NULL,
  `new_balance` DECIMAL(5,1) NOT NULL,
  `reason` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`adjusted_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `system_settings`
-- --------------------------------------------------------
CREATE TABLE `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `audit_logs`
-- --------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `user_email` VARCHAR(150) NULL,
  `action` VARCHAR(100) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `record_id` VARCHAR(50) NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================
-- SEED DATA
-- ==========================================================

-- System Settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('company_name', 'LeaveEase Enterprise Inc.', 'Organization display name'),
('exclude_weekends', 'true', 'Exclude Saturdays & Sundays from leave day calculations'),
('exclude_holidays', 'true', 'Exclude designated holidays from leave count'),
('two_tier_approval', 'false', 'Require both Manager and HR approval if enabled'),
('allow_negative_balance', 'false', 'Allow employees to take leave beyond available balance'),
('fiscal_year_start', '01-01', 'Start of leave fiscal year (MM-DD)'),
('auto_notify_email', 'true', 'Simulate email notifications along with in-app alerts');

-- Leave Types
INSERT INTO `leave_types` (`id`, `name`, `code`, `description`, `annual_limit`, `carry_forward_allowed`, `max_carry_forward`, `document_required`, `minimum_days`, `maximum_days`, `color_code`, `is_paid`, `status`) VALUES
(1, 'Casual Leave', 'CL', 'For personal emergencies, urgent personal affairs, and short breaks', 12.0, 0, 0.0, 0, 0.5, 3.0, '#3B82F6', 1, 'ACTIVE'),
(2, 'Sick Leave', 'SL', 'For illness, health checkups, medical recovery', 10.0, 1, 5.0, 1, 0.5, 10.0, '#EF4444', 1, 'ACTIVE'),
(3, 'Earned Leave / Annual Leave', 'EL', 'Accrued annual vacation and leisure leave', 18.0, 1, 15.0, 0, 1.0, 15.0, '#10B981', 1, 'ACTIVE'),
(4, 'Maternity Leave', 'ML', 'Mandatory statutory maternity benefit leave for eligible mothers', 90.0, 0, 0.0, 1, 30.0, 90.0, '#EC4899', 1, 'ACTIVE'),
(5, 'Paternity Leave', 'PL', 'Leave granted to new fathers following childbirth or adoption', 10.0, 0, 0.0, 1, 1.0, 10.0, '#8B5CF6', 1, 'ACTIVE'),
(6, 'Compensatory Off', 'COMP', 'Leave granted in lieu of overtime or weekend duty worked', 5.0, 0, 0.0, 0, 0.5, 3.0, '#F59E0B', 1, 'ACTIVE'),
(7, 'Loss of Pay', 'LOP', 'Unpaid leave when paid leave balances are exhausted', 30.0, 0, 0.0, 0, 0.5, 30.0, '#6B7280', 0, 'ACTIVE');

-- Departments
INSERT INTO `departments` (`id`, `department_name`, `department_code`, `description`, `manager_id`, `status`) VALUES
(1, 'Engineering & Technology', 'ENG', 'Software Engineering, DevOps, Cloud Infrastructure, and QA', NULL, 'ACTIVE'),
(2, 'Human Resources & Talent', 'HR', 'People Operations, Recruitment, Payroll, and Compliance', NULL, 'ACTIVE'),
(3, 'Sales & Marketing', 'MKT', 'Global Enterprise Sales, Brand Strategy, and Growth', NULL, 'ACTIVE'),
(4, 'Finance & Legal', 'FIN', 'Corporate Financial Planning, Accounting, and Legal Affairs', NULL, 'ACTIVE');

-- Designations
INSERT INTO `designations` (`id`, `title`, `code`, `department_id`) VALUES
(1, 'VP of Engineering', 'VP-ENG', 1),
(2, 'Lead Software Architect', 'LEAD-ARCH', 1),
(3, 'Senior Full-Stack Engineer', 'SR-ENG', 1),
(4, 'Frontend Developer', 'FE-DEV', 1),
(5, 'HR Director', 'HR-DIR', 2),
(6, 'HR Operations Specialist', 'HR-SPEC', 2),
(7, 'Head of Sales', 'SALES-HEAD', 3),
(8, 'Senior Account Executive', 'SR-AE', 3),
(9, 'Financial Controller', 'FIN-CTRL', 4);

-- Holidays (Current and upcoming)
INSERT INTO `holidays` (`id`, `holiday_name`, `holiday_date`, `description`, `holiday_type`, `year`) VALUES
(1, 'New Year\'s Day', '2026-01-01', 'First day of the year national celebration', 'MANDATORY', 2026),
(2, 'Martin Luther King Jr. Day', '2026-01-19', 'Federal holiday commemorating civil rights leadership', 'MANDATORY', 2026),
(3, 'Presidents\' Day', '2026-02-16', 'Washington\'s Birthday remembrance', 'MANDATORY', 2026),
(4, 'Memorial Day', '2026-05-25', 'Honoring military personnel', 'MANDATORY', 2026),
(5, 'Independence Day', '2026-07-04', 'National holiday celebrating freedom', 'MANDATORY', 2026),
(6, 'Labor Day', '2026-09-07', 'Honoring worker contributions', 'MANDATORY', 2026),
(7, 'Thanksgiving Day', '2026-11-26', 'Traditional national holiday of harvest and gratitude', 'MANDATORY', 2026),
(8, 'Day After Thanksgiving', '2026-11-27', 'Company extended holiday weekend', 'OPTIONAL', 2026),
(9, 'Christmas Eve', '2026-12-24', 'Winter holiday eve', 'OPTIONAL', 2026),
(10, 'Christmas Day', '2026-12-25', 'Celebration of Christmas holiday', 'MANDATORY', 2026);

-- Passwords hashed with bcrypt:
-- Admin@123 -> $2a$10$7Z2vY1nU7.F0YF8/1oZpcuo4y2a4/c8Wk5o4o8bJ2m1N/4l1N3p5G (or runtime hash)
-- Manager@123 -> same
-- Employee@123 -> same
