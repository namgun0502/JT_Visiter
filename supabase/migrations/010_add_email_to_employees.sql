-- ================================================================
-- 010_add_email_to_employees.sql
-- employees 테이블에 이메일(email) 컬럼 추가
-- Supabase SQL Editor에서 이 쿼리를 실행해 주세요.
-- ================================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN employees.email IS '직원(안내자/승인자) 이메일 주소 (알림 수신용)';