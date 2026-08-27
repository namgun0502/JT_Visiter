-- =====================================================================
-- 008_add_timeline_and_trash.sql
-- 휴지통 처리(Soft Delete)를 위한 컬럼 추가 및 
-- 문서 타임라인 이력을 기록하는 visitor_logs 테이블 생성
-- =====================================================================

-- 1. visitors 테이블에 휴지통 관련 컬럼 및 승인 관련 기존 미비 컬럼 추가
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- updated_at 자동 갱신 트리거 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_visitors_updated_at ON visitors;
CREATE TRIGGER trg_visitors_updated_at
  BEFORE UPDATE ON visitors
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- 2. visitor_logs (타임라인 감사 로그) 테이블 생성
CREATE TABLE visitor_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  action TEXT NOT NULL,       -- 예: 'CREATED', 'APPROVED', 'REJECTED', 'DELETED', 'RESTORED'
  actor_name TEXT NOT NULL,   -- 예: '홍길동 (작성)', '김관리 (승인)'
  remarks TEXT,               -- 반려 사유, 특이사항 등 메모
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE visitor_logs IS '방문자 기록의 변경 이력(타임라인)을 기록하는 감사 로그 테이블';

-- RLS 활성화 및 정책 설정
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visitor_logs_select_all"
  ON visitor_logs FOR SELECT USING (true);

CREATE POLICY "visitor_logs_insert_all"
  ON visitor_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "visitor_logs_delete_all"
  ON visitor_logs FOR DELETE USING (true);
