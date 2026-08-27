-- =====================================================
-- 002_create_employees_table.sql
-- 방문 대상 직원 목록을 저장하는 테이블을 생성합니다.
-- Supabase SQL Editor에서 이 쿼리를 실행해 주세요.
-- =====================================================

CREATE TABLE IF NOT EXISTS employees (
  -- 각 직원의 고유 번호 (자동 생성)
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 직원 이름 (같은 이름은 두 번 등록 안 됩니다)
  name TEXT NOT NULL UNIQUE,

  -- 부서명 (선택)
  department TEXT,

  -- 이 직원 정보가 등록된 시각 (자동 기록)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 테이블에 설명(코멘트)을 답니다.
COMMENT ON TABLE employees IS '방문 대상 직원 목록 테이블';
COMMENT ON COLUMN employees.name IS '직원 이름';
COMMENT ON COLUMN employees.department IS '소속 부서';
