-- ================================================================
-- 004_create_settings_table.sql
-- 앱 설정값(관리자 비밀번호 등)을 저장하는 settings 테이블 생성
-- ================================================================

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,   -- 설정 이름 (예: 'admin_password')
  value       TEXT NOT NULL,      -- 설정 값 (SHA-256 해시된 비밀번호)
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 읽기 허용
CREATE POLICY "settings_select" ON settings
  FOR SELECT USING (true);

-- 삽입 허용
CREATE POLICY "settings_insert" ON settings
  FOR INSERT WITH CHECK (true);

-- 수정 허용
CREATE POLICY "settings_update" ON settings
  FOR UPDATE USING (true);

-- 초기 비밀번호 'admin1234'를 SHA-256 해시값으로 삽입
-- SHA-256('admin1234') = a6b4cd1e9f29b18b5be042ce5b1cc3d09b8df8fb3e5d39e7e5e5e5e5e5e5e5e5 (예시)
-- 실제 해시는 앱에서 계산하여 저장하므로, 여기서는 초기값만 삽입합니다.
INSERT INTO settings (key, value)
VALUES ('admin_password_hash', 'init')
ON CONFLICT (key) DO NOTHING;
