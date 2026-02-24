-- FOIL Database Schema Initialization
-- This file creates all schemas and base tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS projects;
CREATE SCHEMA IF NOT EXISTS logs;
CREATE SCHEMA IF NOT EXISTS admin;
CREATE SCHEMA IF NOT EXISTS billing;

-- Set search path
SET search_path TO users, projects, logs, admin, billing, public;

-- =====================================================
-- USERS SCHEMA
-- =====================================================

-- User roles enum
CREATE TYPE users.user_role AS ENUM ('user', 'admin', 'superadmin');
CREATE TYPE users.subscription_tier AS ENUM ('free', 'pro', 'enterprise');

-- Main users table
CREATE TABLE users.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    github_username VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    role users.user_role DEFAULT 'user',
    subscription_tier users.subscription_tier DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',

    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Sessions table
CREATE TABLE users.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users.accounts(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- User preferences
CREATE TABLE users.preferences (
    user_id UUID PRIMARY KEY REFERENCES users.accounts(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'en',
    editor_settings JSONB DEFAULT '{}',
    notifications JSONB DEFAULT '{"email": true, "push": false}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PROJECTS SCHEMA
-- =====================================================

CREATE TABLE projects.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users.accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    webcontainer_state JSONB,
    file_tree JSONB,
    dependencies JSONB,
    environment_variables JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE,

    UNIQUE(user_id, slug)
);

-- Project deployments
CREATE TABLE projects.deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    url VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending',
    environment VARCHAR(20) DEFAULT 'production',
    deployment_config JSONB,
    error_message TEXT,
    deployed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project collaborators
CREATE TABLE projects.collaborators (
    project_id UUID REFERENCES projects.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users.accounts(id) ON DELETE CASCADE,
    permission VARCHAR(20) DEFAULT 'view',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (project_id, user_id)
);

-- =====================================================
-- LOGS SCHEMA
-- =====================================================

-- Error logs
CREATE TABLE logs.errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users.accounts(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects.projects(id) ON DELETE SET NULL,
    error_type VARCHAR(100),
    error_code VARCHAR(50),
    message TEXT,
    stack_trace TEXT,
    context JSONB,
    browser_info JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users.accounts(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API usage logs
CREATE TABLE logs.api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users.accounts(id) ON DELETE SET NULL,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    tokens_used INTEGER,
    cost_cents INTEGER,
    response_time_ms INTEGER,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User activity logs
CREATE TABLE logs.activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users.accounts(id) ON DELETE CASCADE,
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id UUID,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- BILLING SCHEMA
-- =====================================================

-- Subscriptions
CREATE TABLE billing.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users.accounts(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    tier users.subscription_tier DEFAULT 'free',
    status VARCHAR(50) DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE billing.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users.accounts(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255) UNIQUE,
    amount_cents INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50),
    paid BOOLEAN DEFAULT false,
    invoice_pdf TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Usage tracking
CREATE TABLE billing.usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users.accounts(id) ON DELETE CASCADE,
    metric_name VARCHAR(100),
    quantity INTEGER,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, metric_name, period_start)
);

-- =====================================================
-- ADMIN SCHEMA
-- =====================================================

-- Rate limits configuration
CREATE TABLE admin.rate_limits (
    tier users.subscription_tier PRIMARY KEY,
    requests_per_minute INTEGER,
    requests_per_hour INTEGER,
    requests_per_day INTEGER,
    ai_calls_per_day INTEGER,
    storage_mb INTEGER,
    deployment_slots INTEGER
);

-- Insert default rate limits
INSERT INTO admin.rate_limits VALUES
    ('free', 10, 100, 1000, 100, 100, 1),
    ('pro', 60, 1000, 10000, 1000, 1000, 5),
    ('enterprise', 600, 10000, 100000, 10000, 10000, 50);

-- System configuration
CREATE TABLE admin.config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users.accounts(id)
);

-- Announcements
CREATE TABLE admin.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    content TEXT,
    type VARCHAR(20) DEFAULT 'info',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users.accounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES
-- =====================================================

-- User indexes
CREATE INDEX idx_users_email ON users.accounts(email);
CREATE INDEX idx_users_google_id ON users.accounts(google_id);
CREATE INDEX idx_users_github_username ON users.accounts(github_username);
CREATE INDEX idx_sessions_user_id ON users.sessions(user_id);
CREATE INDEX idx_sessions_token ON users.sessions(token);
CREATE INDEX idx_sessions_expires_at ON users.sessions(expires_at);

-- Project indexes
CREATE INDEX idx_projects_user_id ON projects.projects(user_id);
CREATE INDEX idx_projects_slug ON projects.projects(slug);
CREATE INDEX idx_projects_public ON projects.projects(is_public) WHERE is_public = true;
CREATE INDEX idx_deployments_project_id ON projects.deployments(project_id);
CREATE INDEX idx_deployments_status ON projects.deployments(status);

-- Logs indexes
CREATE INDEX idx_errors_user_id ON logs.errors(user_id);
CREATE INDEX idx_errors_project_id ON logs.errors(project_id);
CREATE INDEX idx_errors_timestamp ON logs.errors(timestamp);
CREATE INDEX idx_errors_unresolved ON logs.errors(resolved) WHERE resolved = false;
CREATE INDEX idx_api_usage_user_id ON logs.api_usage(user_id);
CREATE INDEX idx_api_usage_timestamp ON logs.api_usage(timestamp);
CREATE INDEX idx_activity_user_id ON logs.activity(user_id);
CREATE INDEX idx_activity_timestamp ON logs.activity(timestamp);

-- Billing indexes
CREATE INDEX idx_subscriptions_user_id ON billing.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON billing.subscriptions(stripe_customer_id);
CREATE INDEX idx_invoices_user_id ON billing.invoices(user_id);
CREATE INDEX idx_usage_user_period ON billing.usage(user_id, period_start);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users.accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON billing.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SUPER ADMIN SETUP
-- =====================================================

-- Create super admin users for @Chopstiiiix and @leeakpareva
INSERT INTO users.accounts (email, github_username, name, role, subscription_tier)
VALUES
    ('admin@chopstiiiix.dev', 'Chopstiiiix', 'Chopstiiiix', 'superadmin', 'enterprise'),
    ('admin@leeakpareva.dev', 'leeakpareva', 'Lee Akpareva', 'superadmin', 'enterprise')
ON CONFLICT (email) DO NOTHING;

-- Grant full privileges to super admins
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA users TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA projects TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA logs TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA admin TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA billing TO postgres;

-- =====================================================
-- VIEWS
-- =====================================================

-- User statistics view
CREATE VIEW admin.user_stats AS
SELECT
    u.id,
    u.email,
    u.role,
    u.subscription_tier,
    COUNT(DISTINCT p.id) as project_count,
    COUNT(DISTINCT d.id) as deployment_count,
    COALESCE(SUM(l.tokens_used), 0) as total_tokens_used,
    u.created_at,
    u.last_login
FROM users.accounts u
LEFT JOIN projects.projects p ON u.id = p.user_id
LEFT JOIN projects.deployments d ON p.id = d.project_id
LEFT JOIN logs.api_usage l ON u.id = l.user_id
GROUP BY u.id;

COMMENT ON SCHEMA users IS 'User accounts and authentication';
COMMENT ON SCHEMA projects IS 'User projects and deployments';
COMMENT ON SCHEMA logs IS 'System logs and error tracking';
COMMENT ON SCHEMA admin IS 'Administrative configuration and controls';
COMMENT ON SCHEMA billing IS 'Subscription and payment management';