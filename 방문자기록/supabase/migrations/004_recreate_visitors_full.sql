-- =====================================================================
-- 004_recreate_visitors_full.sql
-- 기존 visitors 테이블을 삭제하고 4단계 위자드 데이터를
-- 모두 저장할 수 있는 새 스키마로 재생성합니다.
-- !! 주의: 기존 기록이 있으면 모두 삭제됩니다 !!
-- Supabase SQL Editor에서 이 파일의 내용을 실행해 주세요.
-- =====================================================================

-- 기존 visitors 테이블과 관련 정책을 삭제합니다
DROP TABLE IF EXISTS visitors CASCADE;

-- 새 방문자 종합 기록 테이블 생성
CREATE TABLE visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Step 1: 기본 정보
  visit_date          DATE        NOT NULL,
  visit_time          TIME,
  visitor_name        TEXT        NOT NULL,
  visitor_company     TEXT,
  visit_purpose       TEXT,
  visit_purpose_other TEXT,

  -- Step 2: 위생/건강 자가점검 (true=예, false=아니오)
  health_q1  BOOLEAN,
  health_q2  BOOLEAN,
  health_q3  BOOLEAN,
  health_q4  BOOLEAN,
  health_q5  BOOLEAN,

  -- Step 3: 준수사항 및 보안 동의
  compliance_q1  BOOLEAN,
  compliance_q2  BOOLEAN,
  compliance_q3  BOOLEAN,
  compliance_q4  BOOLEAN,
  compliance_q5  BOOLEAN,
  visitor_signature  TEXT,

  -- Step 4: 안내자 확인
  fitness_status   TEXT,
  guide_name       TEXT,
  guide_signature  TEXT,
  remarks          TEXT,
  approval_status  TEXT DEFAULT '대기',
  approver_name    TEXT,

  created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE visitors IS 'JT 방문자 종합 출입 기록 (4단계 위자드)';

-- RLS 활성화 및 정책 설정
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visitors_select_all"
  ON visitors FOR SELECT USING (true);

CREATE POLICY "visitors_insert_all"
  ON visitors FOR INSERT WITH CHECK (true);

CREATE POLICY "visitors_delete_all"
  ON visitors FOR DELETE USING (true);

CREATE POLICY "visitors_update_all"
  ON visitors FOR UPDATE USING (true) WITH CHECK (true);
