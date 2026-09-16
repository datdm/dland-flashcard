-- Migration 004: Global app settings table  
-- Used to store system-wide settings (e.g., admin nav-menu dev overrides)  
CREATE TABLE IF NOT EXISTS app_settings (  
  key VARCHAR(255) PRIMARY KEY,  
  value JSONB NOT NULL DEFAULT '{}',  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
); 
