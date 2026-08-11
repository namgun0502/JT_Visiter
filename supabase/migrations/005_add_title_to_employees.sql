-- ================================================================
-- 005_add_title_to_employees.sql
-- employees 테이블에 '직함(title)' 컬럼 추가
-- ================================================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS title TEXT;
