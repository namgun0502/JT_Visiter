-- ============================================================
-- 004_recreate_visitors_full.sql
-- 기존 visitors 테이블을 삭제하고 4단계 위자드에 맞는
-- 새로운 스키마로 재생성합니다.
-- Supabase SQL Editor에서 이 파일의 내용을 복사하여 실행하세요.
-- ============================================================

-- 1. 기존 visitors 테이블 삭제 (있을 경우)
DROP TABLE IF EXISTS visitors CASCADE;

-- 2. 새 visitors 테이블 생성
CREATE TABLE visitors (
  -- 기본 키: 자동 증가 ID
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- [Step 1] 방문자 기본 정보
  visit_date         DATE        NOT NULL,                        -- 방문 일자
  visit_time         TIME        NOT NULL,                        -- 방문 시간
  visitor_name       TEXT        NOT NULL,                        -- 방문자 이름
  visitor_company    TEXT        DEFAULT '',                      -- 방문자 소속(회사)
  visit_purpose      TEXT        NOT NULL,                        -- 방문 목적 (시설견학/설비보수/업무협의/기타)
  visit_purpose_other TEXT       DEFAULT '',                      -- 기타 선택 시 사유

  -- [Step 2] 위생 및 건강상태 자가점검 (TRUE=예, FALSE=아니오)
  health_q1          BOOLEAN     DEFAULT FALSE,  -- Q1. 최근 1주일 내 감염병(감기, 장병 등) 걸린 적 있나요?
  health_q2          BOOLEAN     DEFAULT FALSE,  -- Q2. 현재 위화감 증상(설사, 복통 등) 있나요?
  health_q3          BOOLEAN     DEFAULT FALSE,  -- Q3. 피부 질환(고름, 심한 피진 등) 있나요?
  health_q4          BOOLEAN     DEFAULT FALSE,  -- Q4. 위화감 식재료·식품에 접하고 있나요?
  health_q5          BOOLEAN     DEFAULT FALSE,  -- Q5. 손락 상처가 있는 신체 부위를 반창고 또는 위생장갑 착용하고 있나요?

  -- [Step 3] 준수사항 및 보안동의 (TRUE=예, FALSE=아니오)
  compliance_q1      BOOLEAN     DEFAULT FALSE,  -- 준수사항 1번 동의
  compliance_q2      BOOLEAN     DEFAULT FALSE,  -- 준수사항 2번 동의
  compliance_q3      BOOLEAN     DEFAULT FALSE,  -- 준수사항 3번 동의
  compliance_q4      BOOLEAN     DEFAULT FALSE,  -- 준수사항 4번 동의
  compliance_q5      BOOLEAN     DEFAULT FALSE,  -- 준수사항 5번 동의
  visitor_signature  TEXT        DEFAULT '',     -- 방문자 서명 (Base64 이미지)

  -- [Step 4] 안내자 확인
  fitness_status     TEXT        DEFAULT '적합', -- 적합 여부 (적합/부적합)
  guide_name         TEXT        DEFAULT '',     -- 안내자 이름
  guide_signature    TEXT        DEFAULT '',     -- 안내자 서명 (Base64 이미지)
  remarks            TEXT        DEFAULT '',     -- 특이사항

  -- 결재 정보
  approval_status    TEXT        DEFAULT '대기', -- 결재 상태 (대기/승인/반려)
  approver_name      TEXT        DEFAULT '',     -- 결재 승인자 이름

  -- 자동 생성 타임스탬프
  created_at         TIMESTAMPTZ DEFAULT NOW()  -- 레코드 생성 시각
);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- 4. 모든 사용자(anon)가 조회/삽입/수정/삭제 가능하도록 정책 설정
--    (사내 전용 시스템이므로 인증 없이 허용)
CREATE POLICY "allow_all_visitors" ON visitors
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 완료 메시지
SELECT 'visitors 테이블이 성공적으로 재생성되었습니다.' AS message;
