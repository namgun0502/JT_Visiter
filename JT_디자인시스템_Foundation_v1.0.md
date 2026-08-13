# 제니트리 디자인 시스템 — Foundation v1.0

> 이 문서는 디자인 "툴"이 아니라 **제품을 구성하는 언어(Product Language)** 입니다.
> 개발과 곧바로 연결되어, 재사용 가능한 기본기(색·글자·간격·모션·아이콘·일러스트·템플릿)로
> UI 개발을 효율화하고 제품 완성도를 업계 최고 수준으로 끌어올리는 것이 목표입니다.
>
> 마스터(`JT_디자인시스템_MASTER_v3.0.md`)의 Seed→Map→Alias 아키텍처 위에서 동작합니다.

---

## 0. 디자인 철학 — 더마 브랜드의 3축

제니트리 UI가 말해야 하는 것: **전문성(Professionalism) · 신뢰감(Trust) · 피부 과학(Skin Science)**.

| 원칙 | 뜻 | 화면에서 |
|---|---|---|
| **깔끔함(Clean)** | 여백이 정보다. 요소를 덜어낸다 | 넉넉한 여백, 얇은 구분선, 낮은 채도 배경 |
| **세련됨(Refined)** | 과장 없는 정밀함 | 절제된 색, 미세한 그림자, 정연한 그리드 |
| **섬세함(Delicate)** | 임상적 신뢰의 디테일 | 부드러운 모션, 정확한 정렬, tabular 숫자 |

색을 남발하지 않습니다. **뉴트럴(먹색·회색)이 화면의 90%**, 색은 의미가 있을 때만 씁니다.

---

## 1. 색상 — 9색 체계 (Toss 방식: 색상별 50~900 스케일)

### 1-1. 앵커

| 역할 | 색 | 값 | 비고 |
|---|---|---|---|
| **Primary(브랜드)** | neutral | `#1F2328` (=neutral-900) | 로고색. 솔리드 주버튼·헤더·주요 강조 |
| **상호작용 accent** | blue | `#305CDE` (=blue-500) | 링크·포커스·활성 탭/네비·선택 |
| **보조 강조** | purple | `#6C3BAA` (=purple-500) | 특수 강조·차트·카테고리 |

> **2톤 규칙**: charcoal(브랜드) = "이것이 제니트리다", blue(상호작용) = "여기를 누를 수 있다".
> 이 둘의 분리가 더마 UI의 신뢰 톤을 만듭니다.

### 1-2. neutral (브랜드 잉크) — 12단

주요 텍스트·주버튼·헤더. 로고에서 온 살짝 차가운 먹색.

```
neutral-0  #FFFFFF   neutral-50 #F7F8F9   neutral-100 #EEF0F2  neutral-200 #DEE2E6
neutral-300 #C5CBD1  neutral-400 #9DA5AF  neutral-500 #757F8A  neutral-600 #5A6470
neutral-700 #434B55  neutral-800 #2E343B  neutral-900 #1F2328★ neutral-950 #14171A
```

### 1-3. gray (클린 UI 그레이) — 10단

배경·테두리·구분선·보조 텍스트·비활성. 뉴트럴보다 가볍고 시원한 회색(에어리한 더마 느낌).

```
gray-50 #F9FAFB   gray-100 #F2F4F6  gray-200 #E5E8EB  gray-300 #D1D6DB  gray-400 #B0B8C1
gray-500 #8B95A1  gray-600 #6B7684  gray-700 #4E5968  gray-800 #333D4B  gray-900 #191F28
```

> neutral과 gray는 같은 차가운 먹색 DNA라 자연스럽게 섞입니다. neutral = "브랜드 액션",
> gray = "UI 구조"로 역할만 다릅니다.

### 1-4. 컬러 스케일 — 각 50~900, **역할이 정의된 것만 팔레트에 둔다**

> **원칙**: 시맨틱 역할이 없는 색은 팔레트(기초 자산)에 두지 않습니다. 모든 색은 아래 셋 중
> 하나에 반드시 속합니다 — **Core(핵심 시맨틱) · Extended(데이터 시각화) · Reserve(아이콘 예비)**.
> orange는 warning이 yellow로 확정되며 시맨틱 역할을 잃어, 팔레트에서 빼 §7 아이콘 예비색으로 이관했습니다.

**Core — 핵심 시맨틱 (역할 고정)**

| 색 | 역할 | 50 (bg) | 100 (border) | **500 (base)** | 600 (solid) | 700 (text) | 900 |
|---|---|---|---|---|---|---|---|
| **blue** | accent·info·상호작용 | `#EEF3FE` | `#D6E1FC` | **`#305CDE`** | `#2A4EC0` | `#24419E` | `#1B2F66` |
| **green** | success | `#E7F7F0` | `#C2ECD9` | **`#14A870`** | `#0F8E5F` | `#0C744E` | `#074A32` |
| **yellow** | **warning** | `#FEF6E4` | `#FBE8B4` | **`#F0B01C`** | `#D2960F` | `#A9760C` | `#6B4A0C` |
| **red** | error | `#FDECEC` | `#FAD3D3` | **`#E14B4B`** | `#C93A3F` | `#A82F35` | `#6B1F23` |

**Extended — 데이터 시각화·특수 강조 (역할 있음)**

| 색 | 역할 | 50 | 100 | **500** | 600 | 700 |
|---|---|---|---|---|---|---|
| **purple** | 특수 강조·프리미엄·차트 시리즈 | `#F4EFFB` | `#E6D8F5` | **`#6C3BAA`** | `#5C3092` | `#4B2777` |
| **teal** | 피부과학·임상 데이터·차트 시리즈 | `#E6F6F6` | `#BEE8E8` | **`#12A3A3`** | `#0D8A8A` | `#0B7070` |

> 전체 10단(200~950)은 500 기준 명도 이동으로 파생. **Reserve 색(orange/pink/berry)** 은
> 팔레트가 아니라 §7(마스터) 아이콘 레지스트리 예비 그룹에만 존재합니다.

### 1-5. 시맨틱 매핑 (완결 — 미배정 색 없음)

| 의미 | 색 | 표현 방식 |
|---|---|---|
| 성공·승인·정상 | green | 50 배경 + 700 글자 / 솔리드는 600 |
| **주의·경고** | **yellow** | **50 배경 + 900 글자** (yellow는 흰 글자 불가) |
| 오류·반려·위험 | red | 50 배경 + 700 글자 / 위험버튼은 600 |
| 정보·링크·포커스 | blue | 링크·인포 알림·활성 |
| 특수·프리미엄 | purple | 배지·차트 |
| 과학·임상 데이터 | teal | 성분·임상 시각화·차트 |
| 브랜드·주요 액션 | neutral | 주버튼·헤더·본문 |
| UI 구조 | gray | 배경·테두리·보조텍스트 |

### 1-6. ⚠️ 텍스트-온-컬러 규칙 (대비 검증됨)

- ✅ **흰 글자 OK**: neutral(15.8) · blue(5.66) · purple(7.38)
- ⚠️ **500은 흰 글자 부족** → 솔리드 채움은 **600단계**: red600·green600·teal600
- 🚫 **yellow는 흰 글자 금지** → warning은 **yellow-50 배경 + yellow-900 글자** 조합으로 고정
- 대부분의 상태 표현이 **50 배경 + 700(또는 900) 글자**라 이 문제를 자연히 피합니다

### 1-7. 다크 테마 매핑

Alias만 재정의(마스터 §4). 핵심:
- 배경: slate `#0F172A`(layout) / `#1E293B`(container) / `#273449`(elevated)
- 텍스트: `rgba(255,255,255,.88 / .55 / .38)`
- **primary(charcoal) 반전**: 밝은 표면(neutral-50)+어두운 글자 = "밝은 버튼"
- **accent(blue) 밝게**: `#7E9DF1`(blue-300, 다크 위 대비 5.56) — 링크·포커스
- 컬러 태그: 배경 투명 + 컬러 테두리·글자(다크에서 채도 낮춤)

---

## 2. 타이포그래피 — 한글 기반 · 영어 필수 · 중국어 안정

### 2-1. 폰트 역할

| 역할 | 폰트 | 용도 |
|---|---|---|
| 한글·기본 | **Pretendard** | 본문·제목 전부(굵기 400~900로 위계) |
| 영문·숫자 | **Figtree** | 가격·코드·문서번호·영문 UI |
| 简体中文 | **Noto Sans SC** | 중국 수출 문서·UI |
| 繁體中文 | **Noto Sans TC** | 대만 수출 문서·UI |

세리프 없이 Pretendard 굵기로 제목을 표현합니다(v1.0 원칙).

### 2-2. 폰트 스택 — 크로스브라우저·크로스언어 폴백 (핵심)

웹폰트가 아직 안 떴거나 실패해도 **각 OS의 기본 폰트로 안정적으로** 보이도록 폴백을 겹칩니다.

```css
--font-base:
  "Pretendard Variable", Pretendard,          /* 한글 웹폰트 */
  "Figtree",                                   /* 영문·숫자 */
  "Noto Sans SC", "Noto Sans TC",              /* 중문 */
  -apple-system, BlinkMacSystemFont,           /* macOS/iOS Safari */
  "Apple SD Gothic Neo",                       /* macOS/iOS 한글 */
  "Malgun Gothic",                             /* Windows 한글 */
  "Segoe UI",                                  /* Windows 영문 */
  "PingFang SC", "Microsoft YaHei",            /* macOS/Win 简体 폴백 */
  "PingFang TC", "Microsoft JhengHei",         /* macOS/Win 繁體 폴백 */
  "Helvetica Neue", Arial, sans-serif;         /* 최종 */
--font-num: "Figtree", "Pretendard Variable", ui-monospace, sans-serif;
```

웹폰트 로드 시 **`font-display: swap`** 을 지정해, 폰트가 늦게 떠도 글자가 즉시 폴백으로 보이게 합니다.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css">
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;900&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
```

### 2-3. 타입 스케일 (14px 기준)

| 토큰 | 크기 | 굵기 | 용도 |
|---|---|---|---|
| display | 30px | 800 | 랜딩 히어로 |
| h1 | 26px | 800 | 페이지 제목 |
| h2 | 22px | 700 | 섹션 |
| h3 | 18px | 700 | 서브섹션 |
| body-lg | 16px | 400 | 강조 본문 |
| **body** | **14px** | **400** | 기본 본문 |
| sm | 12px | 400 | 보조·캡션 |
| caption | 11px | 400 | 메타·문서번호(Figtree) |

### 2-4. 언어별 안정화 규칙

- **최소 글자 크기 12px** — 어떤 언어·기기에서도 그 이하로 내려가지 않게(가독성·중문 획 뭉침 방지)
- **중문 행간을 한글보다 약간 넓게**: CJK는 `line-height` 1.6~1.7 권장(획이 많아 답답함 방지)
- **숫자는 `font-variant-numeric: tabular-nums`** — 표·금액 세로 정렬 흔들림 방지
- **줄바꿈**: 한글/중문 본문은 `word-break: keep-all`(단어 단위 줄바꿈), 긴 코드·URL은 `break-all`
- **폰트 크기 단위 rem** 권장(사용자 브라우저 확대 대응). 고정 px는 아이콘·보더 등 미세요소만

---

## 3. 레이아웃 & 반응형 — 데스크탑 · 태블릿 · 모바일

### 3-1. 브레이크포인트

| 이름 | 범위 | 대상 | 레이아웃 |
|---|---|---|---|
| `mobile` | ~ 639px | 폰 | 1열, 사이더 → 하단탭/햄버거 |
| `tablet` | 640 ~ 1023px | 태블릿 | 2열, 사이더 접힘(아이콘만) |
| `desktop` | 1024 ~ 1439px | 노트북 | 사이더 고정 + 본문 |
| `wide` | 1440px ~ | 대형 모니터 | 본문 최대폭 제한(가독성) |

```css
--bp-mobile:  639px;
--bp-tablet:  1023px;
--bp-desktop: 1439px;
--container-max: 1200px;   /* 본문 최대폭 — 넘으면 좌우 여백 */
--sider-width: 236px;
--sider-collapsed: 64px;    /* 태블릿에서 아이콘만 */
```

### 3-2. 그리드 & 컨테이너

- **12컬럼** 그리드, 거터 24px(desktop)/16px(tablet)/12px(mobile)
- 본문 최대폭 `--container-max`(1200px), 초과 시 가운데 정렬 + 좌우 여백
- 좌우 페이지 여백: desktop 40px / tablet 24px / mobile 16px

### 3-3. 안정성 규칙 (어느 브라우저·기기에서도)

- **모바일 안전영역**: `padding: env(safe-area-inset-*)` — 노치·홈바 대응
- **터치 타깃 최소 44×44px** — 모바일 버튼·아이콘
- **가로 스크롤 금지**: 표는 컨테이너 안에서 `overflow-x:auto`로 감싸기
- **flex/grid 폴백**: 구형 브라우저 대비 핵심 레이아웃은 `gap` 미지원 시 margin 폴백 고려
- **이미지 반응형**: `max-width:100%; height:auto`
- **뷰포트 메타** 필수: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`

---

## 4. 간격 · 라운드 · 엘리베이션

### 4-1. 간격 (4px 그리드)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 56 · 64 · 72px` (space-1~12)

### 4-2. 라운드
`sm 4 · md 8 · lg 16 · xl 24 · full`. 기본 카드/입력 = md(8), 큰 컨테이너 = lg(16).
더마 톤은 **너무 둥글지 않게** — 각지지도 과하게 둥글지도 않은 md가 기본.

### 4-3. 엘리베이션(그림자) — 라이트: 섬세하게

더마 = 부드럽고 옅은 그림자. 짙은 드롭섀도 지양. 2겹(ambient+key)으로 자연스럽게.

```css
--shadow-1: 0 1px 2px rgba(25,31,40,.06), 0 1px 3px rgba(25,31,40,.04);  /* 카드 */
--shadow-2: 0 2px 8px rgba(25,31,40,.06), 0 1px 3px rgba(25,31,40,.05);  /* 드롭다운 */
--shadow-3: 0 8px 24px rgba(25,31,40,.10), 0 2px 6px rgba(25,31,40,.06); /* 모달 */
--shadow-4: 0 20px 40px rgba(25,31,40,.14), 0 4px 10px rgba(25,31,40,.08); /* 팝오버 큰 것 */
```

### 4-4. 엘리베이션 — 다크: **그림자가 아니라 '표면 밝기 계단'**

어두운 배경에선 그림자가 거의 안 보입니다. 그래서 **고도가 올라갈수록 표면을 한 단계씩 밝게**
하고, 위쪽 모서리에 아주 옅은 흰 테두리(빛 반사)를 더해 층을 구분합니다.

```css
[data-theme="dark"]{
  --elev-0: #0F172A;   /* 페이지 바탕 (가장 어두움) */
  --elev-1: #1E293B;   /* 카드·패널 */
  --elev-2: #273449;   /* 드롭다운·팝오버·떠 있는 표면 */
  --elev-3: #2E3C52;   /* 모달·시트 */
  --elev-4: #35435B;   /* 최상위(모달 위 팝오버 등) */
  /* 층 구분용 상단 하이라이트(선택) */
  --elev-hairline: inset 0 1px 0 rgba(255,255,255,.06);
  /* 다크 그림자는 더 짙고 은은하게, 보조 수단으로만 */
  --shadow-dark: 0 8px 24px rgba(0,0,0,.36);
}
```

**규칙**
1. **인접한 두 층은 반드시 한 단계 이상 밝기 차이**를 둔다(같은 색 표면을 겹치지 않기).
   예: elev-1 카드 위의 드롭다운은 elev-2, 그 위 모달은 elev-3.
2. 고도가 오르면 `--elev-hairline`(상단 흰 실선)을 더해 "빛을 받는 윗면"을 암시.
3. 다크에서 그림자(`--shadow-dark`)는 **분리 보조**로만. 주 신호는 표면 밝기.
4. 라이트/다크에서 컴포넌트는 `--color-bg-elevated` 같은 **의미 이름만** 참조 →
   라이트는 그림자, 다크는 밝기 계단으로 자동 표현(코드는 한 벌).

| 표면 | 라이트 | 다크 |
|---|---|---|
| 페이지 | gray-50 | elev-0 `#0F172A` |
| 카드 | white + shadow-1 | elev-1 `#1E293B` + hairline |
| 드롭다운 | white + shadow-2 | elev-2 `#273449` + hairline |
| 모달 | white + shadow-3 | elev-3 `#2E3C52` + hairline |

---

## 4.5 밀도(Density) & 컴팩트 — 폰트까지 유기적으로

데이터 밀집 화면(전성분 편집테이블·견적 품목표)을 위한 **컴팩트 모드**는 높이만 줄이면
글자가 셀 테두리에 닿아 답답해집니다. 그래서 **폰트·행간·셀 여백을 함께**, 그리고 **바닥값(floor)** 을
두어 가독성이 무너지지 않게 정의합니다.

### 4.5-1. 밀도 토큰 (기본 vs 컴팩트)

```css
:root{                          /* 기본(comfortable) */
  --control-height: 36px;
  --density-fs-base: 14px;
  --density-fs-sm:   12px;
  --cell-pad-x: 12px;
  --cell-pad-y: 8px;
  --density-lh: 1.6;
}
[data-density="compact"]{
  --control-height: 30px;       /* 28 아님 — 28은 글자 여백이 부족 */
  --density-fs-base: 13px;      /* 14 → 13 (한 스텝만) */
  --density-fs-sm:   12px;      /* 그대로 — 12px가 본문 최소 바닥 */
  --cell-pad-x: 10px;           /* 좌우 여백 바닥 = 8px, 그 위 */
  --cell-pad-y: 5px;            /* 상하 여백 바닥 = 4px, 그 위 */
  --density-lh: 1.5;            /* 1.45 미만으로 내리지 않음 */
}
```

### 4.5-2. 바닥값(floor) — 절대 넘지 않는 선

| 항목 | 바닥값 | 이유 |
|---|---|---|
| 본문 글자 | **12px** | 이하로 내리면 한글·중문 가독성 급락 |
| 캡션 글자 | **11px** | 메타/문서번호 최소 |
| 셀 좌우 여백 | **8px** | 글자가 테두리에 닿는 답답함 방지 |
| 셀 상하 여백 | **4px** | 행 붙음 방지 |
| 행간 | **1.45** | 이하면 줄이 서로 붙음 |

> 컴팩트는 "한 스텝만" 줄입니다. 두 스텝 이상 줄이거나 바닥값을 깨면 컴팩트가 아니라 "깨진 화면"입니다.

### 4.5-3. 컴포넌트 커스터마이징 스펙 (밀도-폰트 연동 규칙)

컴포넌트가 자체 밀도를 조정할 때 지켜야 하는 계약(contract). 폰트 변수가 밀도에 **유기적으로**
연동되도록 다음 형식으로 스펙을 선언합니다.

```
Component: Table (Data Grid)
├─ inherits: --control-height, --cell-pad-*, --density-fs-*, --density-lh
├─ compact 허용: yes  (data-density="compact")
├─ 오버라이드 가능: --cell-pad-x, --cell-pad-y  (단, floor 이상)
├─ 오버라이드 금지: --density-fs-base < 12px, --density-lh < 1.45
└─ 숫자열: 항상 --font-num + tabular-nums (밀도 무관)
```

- 컴포넌트는 px를 직접 쓰지 않고 **밀도 토큰(--density-*, --cell-pad-*)** 만 참조
- 자체 조밀화가 필요하면 위 "오버라이드 가능" 항목만, **floor 이내**에서 조정
- 이 계약을 지키면: 한 곳(밀도 토큰)만 바꿔도 전 컴포넌트 밀도가 일관되게 움직이고,
  어떤 컴포넌트도 floor를 깨지 못해 "가독성 붕괴/테두리 닿음"이 구조적으로 예방됨

---

## 5. 모션 — 일관된 인터랙션 & 애니메이션

### 5-1. 시간(duration)
```css
--dur-instant: 100ms;  /* 상태 즉시(체크·토글) */
--dur-fast:    160ms;  /* 호버·포커스 */
--dur-base:    240ms;  /* 대부분의 전환(드롭다운·탭) */
--dur-slow:    360ms;  /* 모달·시트 진입 */
--dur-page:    480ms;  /* 페이지·큰 레이어 */
```

### 5-2. 이징(easing)
```css
--ease-standard:   cubic-bezier(.4, 0, .2, 1);   /* 기본(감속 진입) */
--ease-decelerate: cubic-bezier(0, 0, .2, 1);    /* 진입(들어옴) */
--ease-accelerate: cubic-bezier(.4, 0, 1, 1);    /* 이탈(나감) */
--ease-emphasized: cubic-bezier(.2, 0, 0, 1);    /* 강조 전환 */
```

### 5-3. 원칙
- **의미 있는 모션만**: 상태 변화·위치 변화·관계를 설명할 때만. 장식적 애니메이션 지양(AI 티 남)
- **빠르고 짧게**: UI 피드백은 160~240ms. 느린 모션은 답답함
- **한 화면에 하나의 주인공**: 여러 요소가 동시에 튀지 않게
- **진입은 감속(부드럽게 등장), 이탈은 가속(빠르게 사라짐)**
- **접근성**: `@media (prefers-reduced-motion: reduce){ * { animation:none!important; transition:none!important; } }` 필수

### 5-4. 표준 패턴
| 상황 | 모션 |
|---|---|
| 호버 | 배경·색 `--dur-fast` 페이드 |
| 버튼 누름 | `transform: scale(.98)` `--dur-instant` |
| 드롭다운·툴팁 | opacity+`translateY(-4px→0)` `--dur-base` `--ease-decelerate` |
| 모달 | 오버레이 페이드 + 카드 `scale(.98→1)` `--dur-slow` |
| 토스트 | 아래에서 `translateY` 진입, 3초 후 페이드 아웃 |
| 스켈레톤 | 좌→우 shimmer 1.2s 무한(로딩) |

---

## 6. 아이코노그래피 — Google Material Symbols

아이콘은 **Google Material Symbols**로 통일합니다. 자체 제작·혼용 금지(일관성).

### 6-1. 스타일 지정
- **Rounded** 스타일 사용 — 더마의 부드럽고 깔끔한 톤과 맞음(Outlined/Sharp보다 친근)
- **라인(비채움)** 기본, 선택·활성 상태만 **채움(fill 1)**
- 축(variable font axes): `weight 400`(기본)/`500`(강조), `grade 0`, `optical size`는 크기와 일치

### 6-2. 크기 & 색
- 크기: **20px**(조밀한 곳)·**24px**(기본)·**40px**(빈 상태 일러스트 대체)
- 색: `currentColor` 상속 — 텍스트 색을 따라감. 강조 시에만 accent(blue)
- 터치 타깃은 아이콘 20/24라도 클릭영역 **44px** 확보

### 6-3. 로드 (웹)
```html
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..24,400,0..1,0">
```
```html
<span class="material-symbols-rounded">science</span>   <!-- 성분/과학 -->
<span class="material-symbols-rounded">description</span> <!-- 문서 -->
<span class="material-symbols-rounded">verified</span>    <!-- 인증/승인 -->
```
React면 `@mui/icons-material`(동일 Material 세트)도 가능.

### 6-4. 자주 쓰는 매핑(예시)
| 용도 | 아이콘명 |
|---|---|
| 성분·연구 | `science` `experiment` `biotech` |
| 문서·발행 | `description` `article` `draft` `upload_file` |
| 품질·인증 | `verified` `verified_user` `fact_check` |
| 규제·경고 | `gavel` `warning` `report` |
| 대시보드 | `dashboard` `monitoring` `insights` |
| 사용자·HR | `person` `badge` `groups` |
| 생산·물류 | `factory` `inventory_2` `local_shipping` |

---

### 6-5. 도메인 커스텀 SVG 확장 — Contribution L2.5 (디렉터 승인)

구글 Material Symbols에 **피부과학·임상 의학 전용 메타포**가 없을 때가 있습니다(예: 특정 연구실
기구, 전성분 파동/분자 시그니처, 임상 계측기, 앰플 단면). 이런 현업 특수 아이콘을 위해
**통제된 확장 경로**를 엽니다. 이름은 **Contribution L2.5** — 컴포넌트(L2)와 문서 패턴(L3) 사이의
"자산 기여" 계층입니다.

**언제**: Material Symbols(및 그 확장 세트)에 해당 메타포가 없고, 텍스트·기존 아이콘으로
대체가 부자연스러울 때에 한함. (있으면 무조건 Material 우선 — 임의 증식 금지)

**제작 규격 (Material과 시각적으로 섞이도록)**
- 24×24 그리드, `viewBox="0 0 24 24"`
- **단색**, `fill="currentColor"` 또는 `stroke="currentColor"`(텍스트 색 상속)
- 라인은 Material Rounded와 맞춰 **stroke-width 2, 둥근 캡/조인**
- 광학 정렬: 실제 형상이 20~22px 안에 들어오게(가장자리 여백 확보)
- 파일명 접두사 **`jt-`** (예: `jt-ampoule.svg`, `jt-molecule-wave.svg`)

**승인 프로세스 (거버넌스)**
1. 제안: 메타포 + "왜 Google에 없는지" 1줄 + 초안 SVG
2. **디렉터 승인** (브랜드 일관성·중복 여부 검토)
3. 등록: `brand/icons-custom/` 스프라이트에 추가 + 아래 리스트에 한 줄
4. 이후 신규 앱은 Material Symbols처럼 동일하게 참조

**커스텀 아이콘 리스트 (예시 — 승인 시 채움)**
| 이름 | 메타포 | 상태 |
|---|---|---|
| `jt-ampoule` | 앰플 단면 | (예시) |
| `jt-molecule-wave` | 성분 파동 시그니처 | (예시) |
| `jt-patch-test` | 첩포(패치) 시험 | (예시) |

> 원칙: **Material이 1순위, 커스텀은 승인된 예외.** 커스텀도 "구글 아이콘과 한 세트로 보이게"가 목표.

---

## 7. 일러스트레이션 — 피부 과학 톤

빈 상태·온보딩·안내에 쓰는 일러스트의 **일관된 스타일 규칙**.

- **스타일**: 얇은 라인(1.5~2px) + 옅은 단색 면(뉴트럴+accent 1색). 그림자·그라디언트 최소
- **팔레트**: gray + 한 가지 컬러(대개 teal=과학 또는 blue=신뢰). 무지개색 금지
- **모티프**: 분자·성분 구조, 물방울·앰플, 파형(피부 결), 현미경·비커 — 추상적·기하학적으로
- **금지**: 사실적 인체·피부 묘사, 스톡 클립아트, 이모지, 캐릭터 남용
- **비율**: 빈 상태 일러스트는 120~160px 정사각, 중앙 배치. 아이콘(40px)으로 대체 가능
- 톤: 임상적이되 차갑지 않게. 여백을 살려 "깨끗한 실험실" 느낌

---

## 8. 템플릿 — 재사용 페이지 레이아웃

반복되는 화면을 **틀(template)** 로 고정해, 신규 앱이 백지에서 시작하지 않게 합니다.

| 템플릿 | 구조 | 쓰는 앱 |
|---|---|---|
| **App Shell** | 좌측 사이더 + 상단 헤더 + 본문. 반응형(태블릿 접힘/모바일 하단탭) | 전 앱 공통 |
| **Document Editor** | 좌: 품목/버전 목록 · 중앙: 편집 폼 · 우: 데이터 테이블(탭 전환) | PLM 문서발행 |
| **Form Page** | 섹션별 카드 + 라벨-필드 세로 리듬 + 하단 고정 액션바 | 발행정보·견적 입력 |
| **Dashboard** | KPI Statistic 카드 그리드 + 차트 + 최근 활동 리스트 | 대시보드·규제 대시보드 |
| **List / Table** | 필터바 + 데이터 테이블 + 페이지네이션 + 행 액션(케밥) | 품목·거래처 목록 |
| **Detail** | 헤더(제목+상태+액션) + Descriptions + 탭 콘텐츠 | 품목 상세 |
| **Empty / Result** | 중앙 일러스트/아이콘 + 안내문 + 주 액션 1개 | 빈 상태·발행 결과 |
| **Auth** | 중앙 카드(로고 + 폼) + 최소 여백 | 로그인 |

각 템플릿은 §6 컴포넌트(마스터)와 위 Foundation 토큰만으로 조립됩니다.

---

## 9. 로고 & 브랜드 자산

### 9-1. 자산 폴더 (그대로 프로젝트에 투입)

`brand/logo/`를 Next.js는 `public/` 아래, 순수 HTML은 `public/`·`assets/` 아래에 둡니다.
브라우저 경로 예: `/brand/logo/logo-h.svg`.

명명 규칙: **`logo-{형태}[-light].{확장자}`** — `-light`=흰색 로고=**어두운 배경용**, 무접미사=먹색=밝은 배경용.

| 형태 | 밝은 배경(먹색) | 어두운 배경(흰색) |
|---|---|---|
| mark (심볼 J⁺) | `logo-mark.svg` | `logo-mark-light.svg` |
| **h (가로·기본 권장)** | `logo-h.svg` | `logo-h-light.svg` |
| v (세로) | `logo-v.svg` | `logo-v-light.svg` |
| wordmark (글자) | `logo-wordmark.svg` | `logo-wordmark-light.svg` |
| favicon | `favicon.svg` (=mark) | |

> 전 파일 **하이픈 통일**(업로드본 `logo_v-light.svg`는 `logo-v-light.svg`로 교정). SVG 기본, PNG는 폴백.

### 9-2. 라이트/다크 자동 교체

```html
<span class="jt-logo">
  <img src="/brand/logo/logo-h.svg"       alt="Janytree" class="on-light">
  <img src="/brand/logo/logo-h-light.svg" alt="" aria-hidden="true" class="on-dark">
</span>
```
```css
.jt-logo img{height:28px;width:auto;display:block}
.jt-logo .on-dark{display:none}
[data-theme="dark"] .jt-logo .on-light{display:none}
[data-theme="dark"] .jt-logo .on-dark{display:block}
```
React·picture 방식과 파비콘 설정은 `brand/README.md` 참조.

### 9-3. 사용 규칙
- 최소 여백 = 심볼 높이의 50%. 다른 요소 침범 금지.
- 색 변경·비율 왜곡·그림자 금지. 제공된 먹색/흰색 2종만.
- 앱 상단바 = h·mark **28~32px** / 문서 레터헤드 = h **30~34px** / 로그인·스플래시 = v **52~64px** / SNS = mark.
  (세로형 v는 2단 구성이라 가로형보다 1.8배 이상 크게 잡아야 심볼이 제대로 보입니다)
- 복잡한 배경엔 흰색 또는 `#1F2328` 단색 배지 위에 배치.

---

## 10. 크로스브라우저 · 크로스언어 안정성 체크리스트

신규/기존 앱 배포 전 최소 점검:

- [ ] 뷰포트 메타 + `viewport-fit=cover`
- [ ] 폰트 폴백 스택 전체 지정 + `font-display:swap`
- [ ] 한글/영문/中文(简·繁) 실제 렌더 확인(웹폰트 실패 시 폴백도)
- [ ] 최소 글자 12px, 본문 rem 단위
- [ ] 모바일(≤639)/태블릿/데스크탑 3폭 확인, 가로 스크롤 없음
- [ ] 표는 `overflow-x:auto`로 감쌈
- [ ] 터치 타깃 44px
- [ ] 안전영역 `env(safe-area-inset-*)`
- [ ] `prefers-reduced-motion` 대응
- [ ] 라이트/다크 대비(텍스트 4.5:1) 통과
- [ ] Chrome·Safari·Edge·모바일 Safari·삼성인터넷에서 확인
