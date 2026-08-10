# 방문자 출입기록 4단계 위자드 구현 계획

## 변경 범위
기존 단순 방문자 등록 폼 → **4단계(Step) 위자드 방식**으로 전면 교체

---

## 화면 구조

```
Tab 1: 방문자 출입기록 (4 Step 위자드)
├── [Progress Bar: 1 ─── 2 ─── 3 ─── 4]
│
├── Step 1. 방문자_기본정보
│   ├── 방문일자 (date), 방문시간 (time)
│   ├── 방문자_이름, 방문자_소속
│   ├── 방문목적 버튼 (시설견학/설비보수/업무협의/기타)
│   ├── 기타 선택시 → 사유 입력란 표시
│   └── [Cancel] [Next →]
│
├── Step 2. 방문자_위생 및 건강상태 자가점검
│   ├── Q1~Q5 각각 [예] [아니오] 버튼
│   └── [← Prev] [Cancel] [Next →]
│
├── Step 3. 방문자_준수사항 및 보안동의
│   ├── 준수사항 1~5번 각각 [예] [아니오] 버튼
│   ├── "본인은 위 수칙을 숙지하였으며..." 동의 문구
│   ├── 방문자 서명란 (캔버스)
│   └── [← Prev] [Cancel] [Next →]
│
└── Step 4. 안내자_확인
    ├── 적합여부 [적합] [부적합] 버튼
    ├── 안내자_이름 (직원 목록 드롭다운)
    ├── 안내자_서명란 (캔버스)
    ├── 특이사항 (텍스트 입력)
    ├── 결재 상태: [대기] 배지
    ├── 결재_승인자 (직원 목록 드롭다운)
    └── [← Prev] [Cancel] [💾 Save]

Tab 2: 방문 기록 (저장된 기록 조회)
Tab 3: 직원 관리 (안내자/승인자 목록 관리)
```

---

## Supabase 스키마 변경

> [!IMPORTANT]
> 기존 visitors 테이블을 새 스키마로 **교체**합니다.
> 새 SQL 파일(004번)을 Supabase SQL Editor에서 실행해 주셔야 합니다.

### 새 visitors 테이블 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| visit_date | DATE | 방문 일자 |
| visit_time | TIME | 방문 시간 |
| visitor_name | TEXT | 방문자 이름 |
| visitor_company | TEXT | 방문자 소속 |
| visit_purpose | TEXT | 방문 목적 |
| visit_purpose_other | TEXT | 기타 사유 |
| health_q1~q5 | BOOLEAN | 위생 자가점검 5문항 (문항 원문 적용) |
| compliance_q1~q5 | BOOLEAN | 준수사항 동의 5문항 (문항 원문 적용) |
| visitor_signature | TEXT | 방문자 서명 (이미지) |
| fitness_status | TEXT | 적합/부적합 |
| guide_name | TEXT | 안내자 이름 |
| guide_signature | TEXT | 안내자 서명 (이미지) |
| remarks | TEXT | 특이사항 |
| approval_status | TEXT | 결재상태 (기본: 대기) |
| approver_name | TEXT | 결재 승인자 |

---

## 변경 파일

### [NEW] supabase/migrations/004_recreate_visitors_full.sql
기존 visitors 테이블 삭제 후 새 스키마로 재생성

### [MODIFY] index.html
4단계 위자드 구조로 전면 교체 + SignaturePad CDN 추가

### [MODIFY] style.css
기존 스타일 유지 + 위자드 프로그레스바, 예/아니오 버튼, 서명란, 배지 스타일 추가

### [MODIFY] app.js
위자드 로직(단계 이동/검증), 서명패드 초기화, Supabase 저장 로직 전면 재작성

---

> [!NOTE]
> 서명란은 `SignaturePad` 오픈소스 라이브러리(CDN)를 사용합니다.
> 마우스 또는 터치로 서명 가능합니다.
