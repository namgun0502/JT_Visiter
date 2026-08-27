-- ================================================================
-- 003_create_employees_table.sql
-- employees 테이블 신규 생성 (안내자/승인자 관리용)
-- ================================================================

-- employees 테이블 생성
CREATE TABLE IF NOT EXISTS employees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 고유 ID (자동 생성)
  name        TEXT NOT NULL,                               -- 직원 이름 (필수)
  department  TEXT,                                        -- 부서 (선택)
  role        TEXT NOT NULL DEFAULT '안내자',              -- 역할: 안내자 / 승인자 / 안내자+승인자
  created_at  TIMESTAMPTZ DEFAULT NOW()                    -- 등록일시 (자동)
);

-- 누구나 읽고 쓸 수 있도록 RLS(Row Level Security) 정책 설정
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 읽기 허용 (방문자 등록 시 드롭다운에서 사용)
CREATE POLICY "employees_select" ON employees
  FOR SELECT USING (true);

-- 삽입 허용 (관리자가 직원 추가)
CREATE POLICY "employees_insert" ON employees
  FOR INSERT WITH CHECK (true);

-- 삭제 허용 (관리자가 직원 삭제)
CREATE POLICY "employees_delete" ON employees
  FOR DELETE USING (true);
