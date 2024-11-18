-- Initialize database schema for pension management system

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    nib_number VARCHAR(15) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    employee_type VARCHAR(50) NOT NULL, -- management, line staff, etc.
    company VARCHAR(100) NOT NULL,
    contribution_percentage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payroll table
CREATE TABLE IF NOT EXISTS payroll (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    gross_salary DECIMAL(12,2) NOT NULL,
    net_salary DECIMAL(12,2) NOT NULL,
    contribution_amount DECIMAL(12,2) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create pension_contributions table
CREATE TABLE IF NOT EXISTS pension_contributions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    payroll_id INTEGER REFERENCES payroll(id),
    contribution_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_employees_nib ON employees(nib_number);
CREATE INDEX idx_employees_type_company ON employees(employee_type, company);
CREATE INDEX idx_payroll_employee_date ON payroll(employee_id, pay_period_start, pay_period_end);
CREATE INDEX idx_contributions_employee_date ON pension_contributions(employee_id, contribution_date);

-- Create roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id INTEGER REFERENCES roles(id),
    employee_id INTEGER REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Create audit_logs table for tracking sensitive operations
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'System administrator with full access'),
    ('manager', 'Department manager with employee management access'),
    ('employee', 'Regular employee with limited access');

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
    ('view_employees', 'Can view employee list'),
    ('manage_employees', 'Can create, update, and delete employees'),
    ('view_payroll', 'Can view payroll information'),
    ('manage_payroll', 'Can manage payroll processing'),
    ('view_reports', 'Can view reports'),
    ('manage_reports', 'Can create and export reports'),
    ('view_dashboard', 'Can view dashboard'),
    ('manage_users', 'Can manage user accounts'),
    ('manage_roles', 'Can manage roles and permissions');

-- Assign permissions to roles
-- Admin role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

-- Manager role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
AND p.name IN (
    'view_employees',
    'manage_employees',
    'view_payroll',
    'manage_payroll',
    'view_reports',
    'manage_reports',
    'view_dashboard'
);

-- Employee role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'employee'
AND p.name IN (
    'view_employees',
    'view_payroll',
    'view_reports',
    'view_dashboard'
);

-- Add encryption key for sensitive data
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Modify employees table to encrypt sensitive data
ALTER TABLE employees
ADD COLUMN encrypted_nib_number BYTEA,
ADD COLUMN encrypted_bank_account BYTEA;

-- Create function to automatically encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nib_number IS NOT NULL THEN
        NEW.encrypted_nib_number = pgp_sym_encrypt(NEW.nib_number::text, current_setting('app.encryption_key'));
        NEW.nib_number = NULL;
    END IF;
    IF NEW.bank_account IS NOT NULL THEN
        NEW.encrypted_bank_account = pgp_sym_encrypt(NEW.bank_account::text, current_setting('app.encryption_key'));
        NEW.bank_account = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for encrypting sensitive data
CREATE TRIGGER encrypt_employee_data
BEFORE INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION encrypt_sensitive_data();

-- Create function to decrypt sensitive data (only accessible to authorized users)
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data BYTEA)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, current_setting('app.encryption_key'))::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for authorized access to employee data
CREATE VIEW employee_data_secure AS
SELECT 
    e.*,
    CASE 
        WHEN has_permission('view_sensitive_data') 
        THEN decrypt_sensitive_data(e.encrypted_nib_number)
        ELSE NULL 
    END as nib_number,
    CASE 
        WHEN has_permission('view_sensitive_data') 
        THEN decrypt_sensitive_data(e.encrypted_bank_account)
        ELSE NULL 
    END as bank_account
FROM employees e;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users u
        JOIN role_permissions rp ON u.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = current_setting('app.current_user_id')::INTEGER
        AND p.name = permission_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
