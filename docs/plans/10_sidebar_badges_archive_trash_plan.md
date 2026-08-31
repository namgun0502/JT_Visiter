# 사이드바 보관함 및 휴지통 실시간 숫자 뱃지 구현 계획서

## 1. 개요
기존의 '결재 승인' 메뉴에만 존재하던 숫자 뱃지를 **'보관함'**과 **'휴지통'** 메뉴에도 동일하게 적용하여, 현재 보관된 문서 건수와 휴지통에 보관된 문서 건수를 한눈에 실시간으로 확인할 수 있도록 개선합니다.

---

## 2. 세부 구현 내용
1. **HTML 마크업 추가 (index.html)**:
   - 보관함 버튼 (#tab-archive-btn): <span class="nav-badge" id="archive-badge">0</span>
   - 휴지통 버튼 (#tab-trash-btn): <span class="nav-badge" id="trash-badge">0</span>
2. **뱃지 일괄 갱신 함수 구현 (updateAllBadgeCounts)**:
   - **결재 승인 건수**: pproval_status = '대기' AND deleted_at IS NULL
   - **보관함 건수**: pproval_status IN ('승인', '반려') AND deleted_at IS NULL
   - **휴지통 건수**: deleted_at IS NOT NULL
3. **실시간 및 주기적 자동 갱신 연동**:
   - DOMContentLoaded 시 초기 1회 실행
   - 10초 주기 자동 갱신 (setInterval)
   - 방문자 등록, 결재(승인/반려), 삭제, 복구, 영구삭제 시 즉시 실행

---

## 3. 진행 단계
1. **1단계**: 계획서 파일 저장
2. **2단계**: index.html 마크업에 뱃지 요소 추가
3. **3단계**: pp.js에 updateAllBadgeCounts() 로직 구현 및 모든 이벤트 연동
4. **4단계**: 테스트 및 완료 확인