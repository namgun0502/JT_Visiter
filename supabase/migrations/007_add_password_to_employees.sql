-- ================================================================
-- 007_add_password_to_employees.sql
-- employees 테이블에 '비밀번호(password_hash)' 컬럼 추가
-- ================================================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 기존 UPDATE 권한이 회원가입(자신의 비밀번호 설정)을 위해 모든 필드 변경을 허용하도록 유지합니다.
-- (006 마이그레이션에서 이미 UPDATE 권한을 주었으므로 별도 수정 불필요)
