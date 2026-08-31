-- =====================================================================
-- 009_add_exit_time_to_visitors.sql
-- visitors 테이블에 방문자 퇴실(나간 시각) 관련 컬럼 추가
-- Supabase SQL Editor에서 이 쿼리를 실행해 주세요.
-- =====================================================================

-- 1. 퇴실 시간(exit_time), 퇴실 날짜(exit_date), 퇴실 확인자(exit_checked_by) 컬럼 추가
ALTER TABLE visitors
  ADD COLUMN IF NOT EXISTS exit_date DATE,
  ADD COLUMN IF NOT EXISTS exit_time TIME,
  ADD COLUMN IF NOT EXISTS exit_checked_by TEXT;

-- 2. 컬럼 코멘트 추가
COMMENT ON COLUMN visitors.exit_date IS '방문자 퇴실(나간 날짜)';
COMMENT ON COLUMN visitors.exit_time IS '방문자 퇴실(나간 시각)';
COMMENT ON COLUMN visitors.exit_checked_by IS '퇴실 처리/확인자 이름';