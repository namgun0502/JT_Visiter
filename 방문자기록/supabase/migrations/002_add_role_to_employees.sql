-- ================================================================
-- 002_add_role_to_employees.sql
-- employees 테이블에 역할(role) 컬럼 추가
-- 역할 값: '안내자', '승인자', '안내자+승인자'
-- ================================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT '안내자';

-- 기존 데이터에 기본값 적용
UPDATE employees SET role = '안내자' WHERE role IS NULL;
