-- ================================================================
-- 006_add_update_policy_to_employees.sql
-- employees 테이블 정보 수정(Update) 권한 추가
-- ================================================================

-- 기존에 UPDATE 권한(Policy)이 없어 직원 정보 수정이 불가능했습니다.
-- 누구나 직원 정보를 수정할 수 있도록 권한을 추가합니다.
CREATE POLICY "employees_update" ON employees
  FOR UPDATE USING (true);
