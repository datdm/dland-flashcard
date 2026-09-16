-- ============================================================
-- DLAND LANGUAGE - POSTGRESQL FULL DATABASE SCHEMA
-- File: server/schema.sql
-- Last Updated: 2026-09-16
-- Note: Whenever PostgreSQL database structure is updated, update this file.
-- ============================================================

-- Bật extension hỗ trợ sinh mã UUID tự động
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. BẢNG NGƯỜI DÙNG (users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sync_at TIMESTAMP
);

-- Index tăng tốc tìm kiếm tài khoản
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);


-- ------------------------------------------------------------
-- 2. BẢNG DỮ LIỆU ĐỒNG BỘ NGƯỜI DÙNG (user_data)
-- Lưu trữ Sổ tay, Tiến độ, Lịch sử học tập dưới dạng JSONB
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_key VARCHAR(100) NOT NULL,
  data_value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_key UNIQUE(user_id, data_key)
);

-- Index tối ưu tốc độ truy vấn theo user_id và data_key
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_updated_at ON user_data(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_data_key ON user_data(data_key);


-- ------------------------------------------------------------
-- 3. BẢNG LỊCH SỬ SAO LƯU (backup_history)
-- Lưu bản chụp dữ liệu tự động phòng ngừa rủi ro
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  backup_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  backup_type VARCHAR(20) DEFAULT 'auto',
  data_keys TEXT[] DEFAULT '{}',
  note TEXT
);

-- Index phục vụ truy vấn lịch sử sao lưu
CREATE INDEX IF NOT EXISTS idx_backup_history_user_id ON backup_history(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_created_at ON backup_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_history_user_created ON backup_history(user_id, created_at DESC);


-- ============================================================
-- 4. BẢNG GIÁO TRÌNH & BÀI HỌC (Tùy chọn mô hình Quan hệ)
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculums (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  lang VARCHAR(10) DEFAULT 'ja',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR(100) PRIMARY KEY,
  curriculum_id VARCHAR(100) REFERENCES curriculums(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  level VARCHAR(20),
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vocabularies (
  id VARCHAR(100) PRIMARY KEY,
  lesson_id VARCHAR(100) REFERENCES lessons(id) ON DELETE SET NULL,
  kanji VARCHAR(255),
  hiragana VARCHAR(255),
  onyomi VARCHAR(255),
  meaning TEXT NOT NULL,
  phonetic VARCHAR(255),
  word_type VARCHAR(50),
  source_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vocabularies_kanji ON vocabularies(kanji);
CREATE INDEX IF NOT EXISTS idx_vocabularies_hiragana ON vocabularies(hiragana);
