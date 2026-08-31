# 결재 권한자의 방문 날짜 및 시간 수정 기능 구현 계획서

## 1. 개요
결재 권한자(승인자, 안내자+승인자, 관리자)가 결재하기(pprove) 또는 상태 변경(edit) 모달에서 방문자의 **입실 날짜(visit_date) 및 입실 시간(visit_time)**을 직접 수정하고 저장할 수 있도록 기능을 확장합니다.

---

## 2. 세부 구현 내용
1. **상세/결재/상태변경 모달 UI 개선**:
   - 결재 권한이 있는 사용자가 모달을 열었을 때, 입실 일시 항목에 날짜 선택기(input[type="date"])와 시간 선택기(input[type="time"]) 및 [입실 일시 저장] 버튼 제공.
   - 결재 권한이 없는 일반 사용자에게는 기존과 동일하게 텍스트로만 표시.
2. **입실 일시 업데이트 함수 saveDetailVisitDateTime(id) 구현**:
   - 변경된 isit_date 및 isit_time을 Supabase isitors 테이블에 업데이트.
   - 타임라인 이력(isitor_logs)에 UPDATED 액션으로 "방문 일시 수정됨 (기존 -> 변경)" 기록.
   - 모달 및 백그라운드 목록(결재승인/보관함/관리대장) 즉시 새로고침.

---

## 3. 진행 단계
1. **1단계**: docs/plans/05_edit_visit_datetime_by_approver_plan.md 계획 문서 저장
2. **2단계**: pp.js 내 모달 렌더링 및 saveDetailVisitDateTime 로직 구현
3. **3단계**: 테스트 및 사용자 피드백 확인