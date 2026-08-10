-- =====================================================
-- 003_rls_policy.sql
-- RLS(행 수준 보안) 정책을 설정합니다.
-- 로그인 없이 누구나 데이터를 읽고 쓸 수 있도록 허용합니다.
-- (회사 내부망 사용 전제)
-- Supabase SQL Editor에서 이 쿼리를 실행해 주세요.
-- =====================================================

-- ① visitors 테이블 RLS 활성화
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- ② visitors 테이블: 누구나 조회 가능
CREATE POLICY "visitors_select_all"
  ON visitors FOR SELECT
  USING (true);

-- ③ visitors 테이블: 누구나 등록 가능
CREATE POLICY "visitors_insert_all"
  ON visitors FOR INSERT
  WITH CHECK (true);

-- ④ visitors 테이블: 누구나 삭제 가능
CREATE POLICY "visitors_delete_all"
  ON visitors FOR DELETE
  USING (true);

-- ⑤ employees 테이블 RLS 활성화
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- ⑥ employees 테이블: 누구나 조회 가능
CREATE POLICY "employees_select_all"
  ON employees FOR SELECT
  USING (true);

-- ⑦ employees 테이블: 누구나 등록 가능
CREATE POLICY "employees_insert_all"
  ON employees FOR INSERT
  WITH CHECK (true);

-- ⑧ employees 테이블: 누구나 삭제 가능
CREATE POLICY "employees_delete_all"
  ON employees FOR DELETE
  USING (true);
