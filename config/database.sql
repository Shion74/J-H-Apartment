-- Drop database if exists and create a new one
DROP DATABASE IF EXISTS jh_apartment;
CREATE DATABASE IF NOT EXISTS jh_apartment;

-- Use the database
USE jh_apartment;

-- Drop tables if they exist (in reverse order due to foreign key constraints)
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS tenants;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;

-- Settings table for configurable rates
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table for authentication
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager') NOT NULL DEFAULT 'manager',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Branches table
CREATE TABLE branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL,
  branch_id INT NOT NULL,
  status ENUM('occupied', 'vacant', 'maintenance') NOT NULL DEFAULT 'vacant',
  monthly_rent DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_room_per_branch (room_number, branch_id)
);

-- Tenants table
CREATE TABLE tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  room_id INT,
  rent_start DATE NOT NULL,
  initial_electric_reading DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

-- Bills table
CREATE TABLE bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  room_id INT NOT NULL,
  bill_date DATE NOT NULL,
  -- Rent Details
  rent_from DATE NOT NULL,
  rent_to DATE NOT NULL,
  rent_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  -- Electric Details
  electric_present_reading DECIMAL(10, 2) DEFAULT 0.00,
  electric_previous_reading DECIMAL(10, 2) DEFAULT 0.00,
  electric_consumption DECIMAL(10, 2) DEFAULT 0.00,
  electric_rate_per_kwh DECIMAL(10, 2) DEFAULT 12.00,
  electric_amount DECIMAL(10, 2) DEFAULT 0.00,
  electric_reading_date DATE,
  electric_previous_date DATE,
  -- Water Details (Fixed amount per room)
  water_amount DECIMAL(10, 2) DEFAULT 200.00,
  -- Extra Fee Details (Maintenance, etc.)
  extra_fee_amount DECIMAL(10, 2) DEFAULT 0.00,
  extra_fee_description VARCHAR(255) DEFAULT NULL,
  -- Total and Status
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('paid', 'unpaid', 'partial') NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  prepared_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  -- Prevent duplicate bills for same tenant in same period
  UNIQUE KEY unique_tenant_period (tenant_id, rent_from, rent_to)
);

-- Payments table
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method ENUM('cash', 'bank_transfer', 'check', 'other') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

-- Insert admin user (password: admin123)
INSERT INTO users (username, password, role) VALUES 
('admin', '$2b$10$Wt1CpSBjeAklSj03qTvN6.GZIAbtxwWNbgfeX2aLlBbtz9HvM3I5i', 'admin');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description) VALUES 
('electric_rate_per_kwh', '12.00', 'Electricity rate per kilowatt hour (₱)'),
('water_fixed_amount', '200.00', 'Fixed water amount per room per month (₱)'),
('default_room_rate', '3500.00', 'Default monthly rent for new rooms (₱)');

-- Insert default main branch
INSERT INTO branches (name, address) VALUES 
('J & H apartment', 'Patin-ay, Prosperidad, Agusan Del Sur');

-- Insert rooms for the main branch (numbered 1, 2, 3, etc. with rent 3500)
INSERT INTO rooms (room_number, branch_id, status, monthly_rent) VALUES 
('1', 1, 'vacant', 3500.00),
('2', 1, 'vacant', 3500.00),
('3', 1, 'vacant', 3500.00),
('4', 1, 'vacant', 3500.00),
('5', 1, 'vacant', 3500.00),
('6', 1, 'vacant', 3500.00),
('7', 1, 'vacant', 3500.00);