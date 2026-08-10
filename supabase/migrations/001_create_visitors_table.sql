-- =====================================================
-- 001_create_visitors_table.sql
-- 방문자 기록을 저장하는 테이블을 생성합니다.
-- Supabase SQL Editor에서 이 쿼리를 실행해 주세요.
-- =====================================================

CREATE TABLE IF NOT EXISTS visitors (
  -- 각 방문 기록의 고유 번호 (자동 생성)
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 방문자 이름
  name TEXT NOT NULL,

  -- 방문자 연락처 (선택)
  phone TEXT,

  -- 방문자 소속 회사 (선택)
  company TEXT,

  -- 방문 목적 (선택)
  purpose TEXT,

  -- 방문 대상 직원 이름
  target_employee TEXT,

  -- 방문 일시 (날짜+시간)
  visit_date TIMESTAMPTZ NOT NULL,

  -- 이 기록이 시스템에 등록된 시각 (자동 기록)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 테이블에 설명(코멘트)을 답니다.
COMMENT ON TABLE visitors IS '회사 방문자 기록 테이블';
COMMENT ON COLUMN visitors.name IS '방문자 이름';
COMMENT ON COLUMN visitors.phone IS '방문자 연락처';
COMMENT ON COLUMN visitors.company IS '방문자 소속 회사';
COMMENT ON COLUMN visitors.purpose IS '방문 목적';
COMMENT ON COLUMN visitors.target_employee IS '방문 대상 직원';
COMMENT ON COLUMN visitors.visit_date IS '방문 일시';
