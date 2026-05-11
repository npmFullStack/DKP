-- src/config/database.sql
-- Create database
-- CREATE DATABASE dakop_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notification_new_checkpoint BOOLEAN DEFAULT true,
    notification_checkpoint_expired BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Checkpoints table
CREATE TABLE IF NOT EXISTS checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    province VARCHAR(100),
    municipality VARCHAR(100),
    barangay VARCHAR(100),
    street VARCHAR(255),
    full_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_urls TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspicious', 'removed')),
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for checkpoints
CREATE INDEX IF NOT EXISTS idx_checkpoints_coords ON checkpoints (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_checkpoints_status ON checkpoints (status);
CREATE INDEX IF NOT EXISTS idx_checkpoints_expires ON checkpoints (expires_at);
CREATE INDEX IF NOT EXISTS idx_checkpoints_reported_by ON checkpoints (reported_by);
CREATE INDEX IF NOT EXISTS idx_checkpoints_created_at ON checkpoints (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkpoints_location ON checkpoints (province, municipality, barangay);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkpoint_id UUID REFERENCES checkpoints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_checkpoint ON comments (checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at DESC);

-- User checkpoint reactions (likes/dislikes)
CREATE TABLE IF NOT EXISTS checkpoint_reactions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    checkpoint_id UUID REFERENCES checkpoints(id) ON DELETE CASCADE,
    reaction_type VARCHAR(10) CHECK (reaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, checkpoint_id)
);

-- Checkpoint reports table (for reporting fake/suspicious checkpoints)
CREATE TABLE IF NOT EXISTS checkpoint_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkpoint_id UUID REFERENCES checkpoints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(checkpoint_id, user_id)
);

-- Create indexes for checkpoint_reports
CREATE INDEX IF NOT EXISTS idx_checkpoint_reports_checkpoint ON checkpoint_reports (checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_checkpoint_reports_user ON checkpoint_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_checkpoint_reports_created_at ON checkpoint_reports (created_at DESC);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    checkpoint_id UUID REFERENCES checkpoints(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);

-- Sessions table for token blacklist
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_checkpoints_updated_at ON checkpoints;
CREATE TRIGGER update_checkpoints_updated_at BEFORE UPDATE ON checkpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire old checkpoints (runs every hour via cron/pgAgent)
-- Or you can keep the Node.js setInterval as backup
CREATE OR REPLACE FUNCTION expire_old_checkpoints()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE checkpoints 
    SET status = 'expired' 
    WHERE status = 'active' AND expires_at < NOW()
    RETURNING COUNT(*) INTO expired_count;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- View for active checkpoints with distance calculation helper
CREATE OR REPLACE VIEW active_checkpoints AS
SELECT 
    c.*,
    u.username as reporter_name,
    u.avatar as reporter_avatar
FROM checkpoints c
LEFT JOIN users u ON c.reported_by = u.id
WHERE c.status = 'active' AND c.expires_at > NOW();

-- View for checkpoint statistics by location
CREATE OR REPLACE VIEW checkpoint_stats_by_location AS
SELECT 
    province,
    municipality,
    barangay,
    COUNT(*) as total_checkpoints,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_checkpoints,
    AVG(likes) as avg_likes,
    AVG(dislikes) as avg_dislikes
FROM checkpoints
GROUP BY province, municipality, barangay
ORDER BY total_checkpoints DESC;

-- Function to get checkpoints within radius (PostGIS alternative without PostGIS)
CREATE OR REPLACE FUNCTION get_checkpoints_within_radius(
    center_lat DECIMAL,
    center_lng DECIMAL,
    radius_km DECIMAL
)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    full_address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    status VARCHAR,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.full_address,
        c.latitude,
        c.longitude,
        c.status,
        (6371 * acos(
            cos(radians(center_lat)) * cos(radians(c.latitude)) * 
            cos(radians(c.longitude) - radians(center_lng)) + 
            sin(radians(center_lat)) * sin(radians(c.latitude))
        )) AS distance_km
    FROM checkpoints c
    WHERE c.status = 'active'
    HAVING (6371 * acos(
        cos(radians(center_lat)) * cos(radians(c.latitude)) * 
        cos(radians(c.longitude) - radians(center_lng)) + 
        sin(radians(center_lat)) * sin(radians(c.latitude))
    )) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO CURRENT_USER;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO CURRENT_USER;