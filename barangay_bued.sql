-- ============================================
-- Barangay Bued Digital Certificate System
-- Import this in phpMyAdmin
-- ============================================

CREATE DATABASE IF NOT EXISTS barangay_bued CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE barangay_bued;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'resident') DEFAULT 'resident',
  phone VARCHAR(20),
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CERTIFICATE TYPES
CREATE TABLE IF NOT EXISTS certificate_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  fee DECIMAL(10,2) DEFAULT 0,
  processing_days INT DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1
);

-- CERTIFICATE REQUESTS
CREATE TABLE IF NOT EXISTS certificate_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_code VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  certificate_type_id INT NOT NULL,
  purpose TEXT,
  priority ENUM('normal', 'urgent') DEFAULT 'normal',
  notes TEXT,
  status ENUM('pending', 'under_review', 'approved', 'released', 'rejected') DEFAULT 'pending',
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  released_at DATETIME,
  qr_code_data TEXT,
  admin_remarks TEXT,
  approved_by INT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255),
  message TEXT,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  is_read TINYINT(1) DEFAULT 0,
  related_request_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100),
  entity_type VARCHAR(100),
  entity_id INT,
  new_value TEXT,
  ip_address VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO users (id, full_name, email, password, role, phone, address) VALUES
(1, 'Super Admin', 'admin@barangaybued.gov.ph', 'Admin@2025', 'super_admin', '09171234567', 'Barangay Hall, Bued, Calasiao, Pangasinan')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO certificate_types (id, name, description, requirements, fee, processing_days, is_active) VALUES
(1, 'Barangay Clearance', 'Official clearance certifying good standing in the barangay.', 'Valid ID, Community Tax Certificate', 50, 1, 1),
(2, 'Certificate of Residency', 'Certifies that the applicant is a resident of Barangay Bued.', 'Valid ID, Proof of Address', 30, 1, 1),
(3, 'Certificate of Indigency', 'Certifies that the applicant belongs to the indigent sector.', 'Valid ID, Sworn Affidavit', 0, 1, 1),
(4, 'Business Clearance', 'Clearance required for business permit applications.', 'Valid ID, Business Documents', 200, 3, 1),
(5, 'Certificate of Good Moral Character', 'Certifies the moral standing of the applicant.', 'Valid ID, 2 Character References', 30, 2, 1)
ON DUPLICATE KEY UPDATE id=id;
