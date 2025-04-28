-- MySQL database migration script

-- Create roles table
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `module` VARCHAR(255) NOT NULL,
  `is_encoder` BOOLEAN DEFAULT FALSE,
  `is_approver` BOOLEAN DEFAULT FALSE,
  `is_enabled` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
);

-- Planning Module Tables
CREATE TABLE `annual_investment_plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fiscal_year` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) DEFAULT 'draft',
  `total_amount` DECIMAL(15,2) DEFAULT 0,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_by` INT NULL,
  `approved_at` TIMESTAMP NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`)
);

CREATE TABLE `aip_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `aip_id` INT NOT NULL,
  `project_name` VARCHAR(255) NOT NULL,
  `project_code` VARCHAR(100),
  `description` TEXT,
  `estimated_amount` DECIMAL(15,2) NOT NULL,
  `sector` VARCHAR(100),
  `funding_source` VARCHAR(100),
  `implementation_status` VARCHAR(50) DEFAULT 'not_started',
  `start_date` DATE,
  `end_date` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`aip_id`) REFERENCES `annual_investment_plans`(`id`)
);

-- Budget Module Tables
CREATE TABLE `budget_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fiscal_year` INT NOT NULL,
  `aip_item_id` INT,
  `account_code` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `balance` DECIMAL(15,2) NOT NULL,
  `category` VARCHAR(100),
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`aip_item_id`) REFERENCES `aip_items`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

CREATE TABLE `budget_obligations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `budget_item_id` INT NOT NULL,
  `obligation_number` VARCHAR(100) NOT NULL,
  `payee` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `amount` DECIMAL(15,2) NOT NULL,
  `obligation_date` DATE NOT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_by` INT NULL,
  `approved_at` TIMESTAMP NULL,
  FOREIGN KEY (`budget_item_id`) REFERENCES `budget_items`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`)
);

-- Accounting Module Tables
CREATE TABLE `journal_entries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `entry_number` VARCHAR(100) NOT NULL,
  `obligation_id` INT,
  `entry_date` DATE NOT NULL,
  `description` TEXT,
  `total_debit` DECIMAL(15,2) NOT NULL,
  `total_credit` DECIMAL(15,2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_by` INT NULL,
  `approved_at` TIMESTAMP NULL,
  FOREIGN KEY (`obligation_id`) REFERENCES `budget_obligations`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`)
);

CREATE TABLE `journal_entry_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `journal_entry_id` INT NOT NULL,
  `account_code` VARCHAR(100) NOT NULL,
  `account_name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `debit_amount` DECIMAL(15,2) DEFAULT 0,
  `credit_amount` DECIMAL(15,2) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`)
);

CREATE TABLE `vouchers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `voucher_number` VARCHAR(100) NOT NULL,
  `journal_entry_id` INT NOT NULL,
  `voucher_date` DATE NOT NULL,
  `payee` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `amount` DECIMAL(15,2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_by` INT NULL,
  `approved_at` TIMESTAMP NULL,
  FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`)
);

-- Treasury Module Tables
CREATE TABLE `disbursements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `disbursement_number` VARCHAR(100) NOT NULL,
  `voucher_id` INT NOT NULL,
  `disbursement_date` DATE NOT NULL,
  `payee` VARCHAR(255) NOT NULL,
  `check_number` VARCHAR(100),
  `amount` DECIMAL(15,2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_by` INT NULL,
  `approved_at` TIMESTAMP NULL,
  FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`)
);

CREATE TABLE `collections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `collection_number` VARCHAR(100) NOT NULL,
  `collection_date` DATE NOT NULL,
  `collection_type` VARCHAR(100) NOT NULL,
  `payer` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `amount` DECIMAL(15,2) NOT NULL,
  `receipt_number` VARCHAR(100),
  `status` VARCHAR(50) DEFAULT 'pending',
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_by` INT NULL,
  `approved_at` TIMESTAMP NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`)
);

-- HRIS Module Tables
CREATE TABLE `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` VARCHAR(100) NOT NULL UNIQUE,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `middle_name` VARCHAR(100),
  `birth_date` DATE,
  `gender` VARCHAR(20),
  `address` TEXT,
  `contact_number` VARCHAR(50),
  `email` VARCHAR(255),
  `position` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `employment_status` VARCHAR(50) NOT NULL,
  `date_hired` DATE NOT NULL,
  `basic_salary` DECIMAL(15,2) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

CREATE TABLE `payrolls` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payroll_period` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_amount` DECIMAL(15,2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'draft',
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_by` INT NULL,
  `approved_at` TIMESTAMP NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`)
);

CREATE TABLE `payroll_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `payroll_id` INT NOT NULL,
  `basic_pay` DECIMAL(15,2) NOT NULL,
  `allowances` DECIMAL(15,2),
  `deductions` DECIMAL(15,2),
  `net_pay` DECIMAL(15,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`),
  FOREIGN KEY (`payroll_id`) REFERENCES `payrolls`(`id`)
);

-- Insert default admin role
INSERT INTO `roles` (`name`, `module`, `is_encoder`, `is_approver`, `is_enabled`)
VALUES ('Administrator', 'admin', TRUE, TRUE, TRUE);

-- Insert default module-specific roles
INSERT INTO `roles` (`name`, `module`, `is_encoder`, `is_approver`, `is_enabled`)
VALUES 
('Planning Officer', 'planning', TRUE, FALSE, TRUE),
('Planning Approver', 'planning', FALSE, TRUE, TRUE),
('Budget Officer', 'budget', TRUE, FALSE, TRUE),
('Budget Approver', 'budget', FALSE, TRUE, TRUE),
('Accounting Officer', 'accounting', TRUE, FALSE, TRUE),
('Accounting Approver', 'accounting', FALSE, TRUE, TRUE),
('Treasury Officer', 'treasury', TRUE, FALSE, TRUE),
('Treasury Approver', 'treasury', FALSE, TRUE, TRUE),
('HRIS Officer', 'hris', TRUE, FALSE, TRUE),
('HRIS Approver', 'hris', FALSE, TRUE, TRUE);