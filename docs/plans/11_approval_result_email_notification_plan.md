# 11. 결재 승인/반려 시 등록자(안내자) 이메일 알림 구현 계획서

## 1. 개요
결재자가 방문자 기록을 '승인' 또는 '반려' 처리했을 때, 해당 방문자를 등록/안내한 직원(안내자)에게 결과 이메일을 자동으로 발송합니다.

## 2. 작업 내용
1. app.js에 새 EmailJS 결재 결과 통보 템플릿 ID 상수 EMAILJS_RESULT_TEMPLATE_ID 추가
2. 결재 처리 함수(handleApprovalDecision)에서 승인/반려 시 sendApprovalResultNotification(record, decision) 호출
3. sendApprovalResultNotification 함수 구현:
   - 해당 기록의 guide_name으로 employees 테이블에서 이메일 조회
   - 안내자 이메일로 결과(승인/반려, 방문자명, 결재자명 등) 전송
4. EmailJS 새 템플릿 문구 가이드 제공
