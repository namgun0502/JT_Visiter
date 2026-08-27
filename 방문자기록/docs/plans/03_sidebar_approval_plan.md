# 좌측 사이드바 도입 및 결재 승인 탭 신설 기획안

## 1. 개요
* **목표**: 안내자의 '적합 여부' 판단 권한을 '결재 승인자'에게 이관하고, 사이드바를 통해 앱의 관리/사용 기능을 분리함.
* **구성 탭**: [방문자 등록] (4단계 위자드), [결재 승인] (승인 대기자 목록)
* **모바일 대응**: 모바일(작은 화면)에서는 좌측 사이드바를 하단 고정 탭(Bottom Navigation) 형태로 변형하여 화면 공간을 확보함.

## 2. 세부 구현 계획

### 2.1 `index.html` (레이아웃 변경)
1. **사이드바(`<aside>`) 구조 추가**: `<div class="app-wrapper">` 내부에 좌측 사이드바 구조를 추가. (데스크탑: 좌측, 모바일: 하단 고정)
2. **탭 컨테이너 분리**: 
   * `<section id="tab-register" class="tab-panel active">`: 기존 4단계 위자드 영역
   * `<section id="tab-approval" class="tab-panel">`: 신규 결재 승인 대기열 리스트 및 승인 패널 영역
3. **Step 4 화면 변경**: '적합 여부' 선택 UI 제거.

### 2.2 `style.css` (스타일링)
1. **전체 레이아웃(Grid/Flex)**: `.app-wrapper`를 Flex/Grid row 기반으로 확장 (기존 최대 900px -> 1200px 이상).
2. **사이드바/바텀네비게이션 CSS**: 
   * 데스크탑: 좌측 고정 폭 메뉴.
   * 모바일(`@media (max-width: 768px)`): 하단 고정 탭 형태로 디자인 변경.
3. **결재 승인 리스트 디자인**: 미결재 건들이 한눈에 보이는 리스트(또는 카드형) UI 및 상세 모달 창.

### 2.3 `app.js` (기능 구현)
1. **탭 스크립트 복구**: `switchTab()` 함수 재구현.
2. **방문자 등록 시 상태값 변경**: 기본값 `fitness_status: '대기'`로 저장되도록 폼 데이터 수정.
3. **결재 승인 로직 구현**:
   * `loadPendingApprovals()`: `approval_status = '대기'`인 방문자만 호출.
   * `showApprovalDetail(id)`: 방문자의 건강체크 답변과 서명을 보여주는 패널.
   * `submitApproval(id, result)`: '승인(적합)' 또는 '반려(부적합)' 버튼 클릭 시 DB의 `approval_status`, `fitness_status` 업데이트.
