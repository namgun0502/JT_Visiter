# 제니트리 통합 디자인 시스템 — MASTER v3.0

> 여러 개발자가 각 분야(ISO22716 기록·회계·HR·생산·견적·교육·PLM 등)에서 서로 다른 앱/웹을
> 바이브 코딩으로 만들고, 그 앱들이 각종 문서(전성분보고서·MSDS·효능보고서·NDA·견적서 등)를
> 발행하는 환경에서, 모든 산출물이 "같은 제니트리가 만든 것"으로 보이게 하는 단일 기준.
>
> v3.0은 Ant Design의 토큰 아키텍처(Seed → Map → Alias)를 채택해 재설계했습니다.

---

## 0. 왜 Ant Design 방식인가

기존 v2.0은 값을 "MUST/SHOULD/REFERENCE" 강제 수준으로만 나눴습니다. 좋은 출발점이었지만,
**앱이 계속 늘어나는 환경(성장성)** 에서는 "값을 어떻게 파생시키는가"라는 규칙이 없으면
앱마다 색·간격이 조금씩 어긋나기 시작합니다.

Ant Design은 이 문제를 **3계층 파생 구조**로 풉니다. 이걸 그대로 가져옵니다.

```
Seed Token  (디렉터가 정하는 '씨앗' — 최소한의 원점)
    │  ▼ 정해진 규칙으로 자동 파생
Map Token   (씨앗에서 계산된 '계단' — 색 팔레트·크기·간격 스케일)
    │  ▼ 용도 이름을 붙임
Alias Token (개발자가 실제로 쓰는 '의미 있는 이름' — 본문색·테두리색·배경색 등)
    │  ▼
Component   (버튼·표·탭 등 — Alias를 참조. 꼭 필요할 때만 개별 조정)
```

- **씨앗(Seed) 하나만 바꾸면 아래가 전부 따라 바뀝니다.** 예: 앱의 대표색(colorPrimary)
  하나만 지정하면 그 앱의 버튼·링크·강조·배경 계열이 규칙대로 전부 생성됩니다.
- 개발자는 계단 값을 외울 필요 없이 **의미 있는 이름(Alias)** 만 씁니다. "이 텍스트는
  `colorText`, 보조 텍스트는 `colorTextSecondary`" 식으로요.

**이 문서의 원칙은 v2.0과 동일합니다: 값(어떻게 보이는가)만 정하고, 구조·필수요소(무엇이
들어가는가)는 각 앱 소관.** 달라진 건 값을 "파생 규칙"으로 체계화했다는 점입니다.

---

## 1. 설계 가치 (브랜드 스토리에서 도출)

> "개발부터 스마트 생산, 완제품 납품까지 전 과정을 자체 제어하는 앰플 스페셜리스트.
>  피부 과학 기반의 정밀한 R&D. ISO 22716(CGMP) 시스템. 파트너의 리스크를 낮추는 기술 자본."

| 가치 | 뜻 | UI에서의 실천 |
|---|---|---|
| **확실성** | 정밀한 R&D처럼, 예측 가능한 화면 | 같은 동작은 어느 앱에서나 같은 모습·같은 위치 |
| **신뢰성** | 규제 문서가 곧 대외 신뢰 | 문서 발행물은 정확·정연·검증 가능한 레이아웃 우선 |
| **성장성** | 앱이 계속 늘어남 | 씨앗 하나 바꾸면 파생되는 토큰 구조로 확장에 대응 |
| **효율성** | 소수 인원 · 바이브 코딩 | 개발자는 Alias 이름만 쓰면 됨. 값 판단은 시스템이 대신 |

---

## 2. Seed Token — 디렉터가 정하는 원점 (앱당 극소수만)

앱을 새로 만들 때 이 몇 개만 정하면 나머지는 규칙으로 파생됩니다.

```css
/* ── 색 씨앗 ── */
--seed-color-primary: #1F2328;   /* 회사 대표색 = 로고색 = Neutral Charcoal. 전 앱 동일 */
--seed-color-neutral: #1F2328;   /* 뉴트럴 스케일의 기준(=neutral-900=로고색). primary와 동일 */
--seed-color-accent:  #305CDE;   /* 상호작용 강조(링크·포커스·선택) = 9색 blue-500. charcoal은 링크로 부적합해 분리 */
--seed-color-success:  #14A870;  /* 성공·승인·정상 = green-500 */
--seed-color-warning:  #F0B01C;  /* 주의·경고 = yellow-500 (표현: yellow-50 배경+yellow-900 글자) */
--seed-color-error:    #E14B4B;  /* 오류·반려·규격초과 = red-500 */
--seed-color-info:     #305CDE;  /* 정보·안내 (accent=blue-500와 동일값) */

/* ── 크기 씨앗 ── */
--seed-font-size: 14px;   /* 본문 기준. 여기서 타입 스케일 파생 */
--seed-radius:    8px;    /* 기준 모서리. 여기서 라운드 스케일 파생 */
--seed-unit:      4px;    /* 간격 그리드 기본 단위 */

/* ── 폰트 씨앗 — v1.0 브랜드 스택 (다국어 자동 폴백) ── */
/* 한 스택 안에서 글자별 커버리지에 따라 자동 선택됨:
   KR → Pretendard · EN/숫자 → Figtree · 简体 → Noto Sans SC · 繁體 → Noto Sans TC */
--seed-font-base:
  "Pretendard Variable", Pretendard, "Figtree",
  "Noto Sans SC", "Noto Sans TC",
  -apple-system, BlinkMacSystemFont, sans-serif;
--seed-font-num:
  "Figtree", "Pretendard Variable", sans-serif;  /* 숫자·문서번호·코드값 단독 구간 */
```

**웹폰트 로드** (앱 `<head>` 또는 globals.css):
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css">
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;900&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
```

| 언어 | 폰트 | 렌더 예시 |
|---|---|---|
| 한국어 (KR) | Pretendard | 화장품 효능 |
| 영문·숫자 (EN/num) | Figtree | Efficacy 0.04% |
| 简体中文 | Noto Sans SC | 化妆品功效 |
| 繁體中文 | Noto Sans TC | 化粧品功效 |

> 수출 시장(EU·대만·중국·ASEAN) 대응상 简体/繁體가 실제로 필요하므로 스택에 상시 포함합니다.
> 제목·강조는 별도 세리프 없이 **Pretendard의 굵기(600~900)** 로 표현합니다(v1.0 원칙 유지).

> **단일 primary 원칙 + 2톤 상호작용 모델**: 모든 앱이 같은 대표색(**Charcoal `#1F2328`**) + 같은
> 뉴트럴 톤으로 레이아웃을 구성합니다. 앱을 구별하는 건 **런처 아이콘 색상뿐**(§7)이며, 앱 안으로
> 들어가면 버튼·헤더·강조·표는 전 앱 공통 charcoal을 씁니다.
>
> charcoal은 링크·포커스처럼 "상호작용" 표시에는 부적합(눈에 안 띔)하므로, v1.0 원칙대로
> **Blue `#305CDE`(9색 blue-500)를 상호작용 accent**로 분리해 씁니다:
> - **Charcoal(primary)** = 솔리드 버튼·헤더·본문 텍스트·주요 데이터 강조
> - **Info Blue(accent)** = 링크·포커스 링·활성 탭/네비 표시·선택된 행
>
> 이 2톤 구성이 "정밀·신뢰"라는 브랜드 톤을 만듭니다(모노톤 먹색 + 최소한의 파란 상호작용).

---

## 3. Map Token — 씨앗에서 파생되는 계단

디렉터가 값을 일일이 안 정합니다. 아래 **파생 규칙**대로 자동 생성됩니다.
(antd/React면 알고리즘이 자동 계산. Tailwind면 대응 shade 단계 사용. 순수 CSS면 아래 값을 명시.)

### 3-A. 색 팔레트 (모든 색상은 하나의 씨앗에서 6단으로)

임의의 색 씨앗 X에 대해 항상 같은 6단을 만듭니다.

| 단계 | 이름 | 용도 | 밝기 기준 |
|---|---|---|---|
| 1 | `X-bg` | 아주 옅은 배경(선택된 행, 태그 배경) | 가장 밝음 |
| 2 | `X-border` | 테두리·구분선 | 밝음 |
| 3 | `X-hover` | 호버 상태 | 약간 밝음 |
| 4 | `X` (=씨앗) | 기본(버튼·강조) | 기준 |
| 5 | `X-active` | 눌림·활성 | 어두움 |
| 6 | `X-text` | 옅은 배경 위 글자 | 가장 어두움 |

예 — primary(charcoal)는 뉴트럴 스케일에서 파생됩니다:
```css
--color-primary-bg:     #EEF0F2;  /* = neutral-100 */
--color-primary-border:  #DEE2E6;  /* = neutral-200 */
--color-primary-hover:   #2E343B;  /* = neutral-800 */
--color-primary:         #1F2328;  /* = neutral-900 = 로고색 */
--color-primary-active:  #14171A;  /* = neutral-950 */
--color-primary-text:    #1F2328;  /* = neutral-900 */
```
상호작용 accent(info blue)는 별도 6단:
```css
--color-accent-bg:     #EEF3FE;  /* = blue-50 */
--color-accent-border:  #D6E1FC;  /* = blue-100 */
--color-accent-hover:   #5578E8;  /* = blue-400 */
--color-accent:         #305CDE;  /* = blue-500 = 링크·포커스 */
--color-accent-active:  #2A4EC0;  /* = blue-600 */
--color-accent-text:    #24419E;  /* = blue-700 */
```
success/warning/error/info도 동일한 6단 규칙을 적용합니다.

### 3-B. 중립(Neutral) 계단 — 텍스트·배경·테두리의 뼈대 (v1.0 정본 12단)

`neutral-0`(흰색)이 스케일의 **시작점**입니다 — 배경·카드가 이 값을 참조하도록 반드시 포함합니다.
가장 어두운 `neutral-900`이 **로고색이자 primary**입니다(별도 색이 아니라 뉴트럴의 최심층).

```css
--neutral-0:  #FFFFFF;  /* 흰색 — 카드·표면 배경의 기준 (필수) */
--neutral-50: #F7F8F9;
--neutral-100:#EEF0F2;
--neutral-200:#DEE2E6;
--neutral-300:#C5CBD1;
--neutral-400:#9DA5AF;
--neutral-500:#757F8A;
--neutral-600:#5A6470;
--neutral-700:#434B55;
--neutral-800:#2E343B;
--neutral-900:#1F2328;  /* ★ 로고색 = primary */
--neutral-950:#14171A;
```

> 동일 색상각(H≈213°)에서 명도만 이동해 파생 — 어떤 명도에서도 "같은 브랜드"로 인지됩니다.

### 3-C. 타입 스케일 (씨앗 14px 기준 파생)

```css
--fs-2xs:10px; --fs-xs:11px; --fs-sm:12px; --fs-base:14px;
--fs-lg:16px;  --fs-xl:18px; --fs-2xl:22px; --fs-3xl:26px; --fs-4xl:30px;
--lh-tight:1.35; --lh-snug:1.45; --lh-normal:1.6; --lh-relaxed:1.75;
```

### 3-D. 간격 스케일 (씨앗 4px 그리드 파생)

```css
--space-1:4px;  --space-2:8px;  --space-3:12px; --space-4:16px;
--space-5:20px; --space-6:24px; --space-7:32px; --space-8:40px;
--space-9:48px; --space-10:56px; --space-11:64px; --space-12:72px;
```

### 3-E. 라운드 스케일 (씨앗 8px 파생) · 그림자 · 모션

```css
--r-sm:4px; --r-md:8px; --r-lg:16px; --r-xl:24px; --r-full:9999px;

--shadow-xs:0 4px 12px rgba(18,21,26,.08);
--shadow-sm:0 4px 16px rgba(18,21,26,.06);
--shadow-lg:0 20px 40px rgba(18,21,26,.15);

--dur-fast:.2s; --dur-base:.5s; --ease-standard:cubic-bezier(.4,0,.2,1);
```

---

## 4. Alias Token — 개발자가 실제로 쓰는 의미 이름

컴포넌트는 Map 값을 직접 쓰지 않고 **이 의미 이름**을 씁니다. 라이트/다크가 여기서 갈립니다.

```css
/* 텍스트 */
--color-text:            var(--neutral-900);  /* 본문 */
--color-text-secondary:  var(--neutral-500);  /* 보조 설명 */
--color-text-tertiary:   var(--neutral-400);  /* 힌트·placeholder */
--color-text-disabled:   var(--neutral-300);

/* 배경 (표면 고도) */
--color-bg-layout:     var(--neutral-50);   /* 페이지 바탕 */
--color-bg-container:  var(--neutral-0);    /* 카드·패널·표 (=흰색) */
--color-bg-elevated:   var(--neutral-0);    /* 모달·드롭다운(그림자 동반) */

/* 테두리·구분 */
--color-border:        var(--neutral-200);
--color-split:         var(--neutral-100);  /* 표 행 구분선 */

/* 링크·상호작용 — charcoal이 아니라 accent(info blue) */
--color-link:          var(--color-accent);
--color-link-hover:    var(--color-accent-hover);
--color-focus-ring:    var(--color-accent);  /* 포커스 링·활성 탭/네비 표시 */

/* 컨트롤 기본 높이 (입력·버튼·셀렉트 통일) */
--control-height:      36px;
--control-height-sm:   28px;
--control-height-lg:   44px;
```

### 다크 테마 (PLM·PKG 포털처럼 다크가 기본인 앱)

**Alias만 재정의**하면 됩니다. Seed/Map 파생 규칙은 그대로 두고 매핑만 뒤집습니다.
캡처의 PLM/포털이 슬레이트(#0f172a) 계열이므로 이를 기준값으로 둡니다.

```css
[data-theme="dark"]{
  --color-text:           rgba(255,255,255,.88);
  --color-text-secondary: rgba(255,255,255,.55);
  --color-text-tertiary:  rgba(255,255,255,.38);
  --color-bg-layout:      #0F172A;   /* slate-900 */
  --color-bg-container:   #1E293B;   /* slate-800 */
  --color-bg-elevated:    #273449;
  --color-border:         rgba(255,255,255,.14);
  --color-split:          rgba(255,255,255,.08);
  /* charcoal primary는 어두운 배경에서 안 보이므로 '먹색'을 밝게 반전(inverted ink):
     솔리드 버튼 = 밝은 표면 + 어두운 글자 */
  --color-primary:        var(--neutral-50);   /* 밝은 버튼 표면 */
  --color-primary-text:   var(--neutral-900);  /* 그 위 글자는 어둡게 */
  /* accent(파랑)는 다크 위 대비 확보용으로 밝게 */
  --color-accent:         #7E9DF1;  /* = blue-300, 다크 대비 5.56 */
  --color-link:           #7E9DF1;
  --color-focus-ring:     #7E9DF1;
}
```

> 라이트/다크에서 **의미 이름은 동일**하므로, 컴포넌트 코드는 한 번만 짜면 두 테마에서 다 돕니다.
> 이것이 Alias 계층의 핵심 이득입니다.

---

## 5. 테마 알고리즘 (조합 가능)

Ant Design처럼 3개 알고리즘을 두고, 필요하면 조합합니다.

| 알고리즘 | 언제 | 무엇을 바꾸나 |
|---|---|---|
| **기본(Light)** | 대부분의 앱 | 위 Alias 라이트값 |
| **다크(Dark)** | PLM·PKG 포털 등 | §4 다크 블록으로 Alias 재정의 |
| **컴팩트(Compact)** | 데이터 밀집 화면(전성분 편집테이블, 견적 품목표) | `--control-height` −4px, 세로 패딩 한 단계 축소, `--fs-base` 유지 |

예: PLM의 전성분 편집테이블 = **다크 + 컴팩트** 조합.

> Table 헤더 배경은 라이트에서 `--neutral-50`, 다크에서 `--color-bg-elevated`를 씁니다.

---

## 6. 컴포넌트 카탈로그 (필수 세트)

디자인 시스템 마스터가 **반드시 갖춰야 하는 컴포넌트**를 Ant Design의 6대 분류로 정리했습니다.
◆ = 필수 코어(전 앱 공통, 우선 구축) · ○ = 필요 시. 모두 Alias만 참조하므로 라이트/다크/컴팩트
자동 대응. 컴포넌트 토큰은 "꼭 필요할 때만" 개별 조정.

**① General(기본)**
| ◆/○ | 컴포넌트 | 규칙 |
|---|---|---|
| ◆ | **Button** | Primary(채움)=charcoal / Default(선)=border+text / Text=글자만 / Link=accent. 높이 `--control-height`. 위험 동작은 danger(error색) |
| ◆ | **Typography** | 제목=Pretendard 굵기(600~900), 본문 14px, 숫자=Figtree. 제목/본문/캡션 레벨 고정 |
| ◆ | **Icon** | **Google Material Symbols (Rounded)**. `stroke` 대신 폰트 아이콘, `currentColor` 상속, 20/24px, 선택 시에만 채움(FILL 1). 이모지·혼용 금지. 상세는 Foundation §6 |

**② Layout(레이아웃)**
| ◆/○ | 컴포넌트 | 규칙 |
|---|---|---|
| ◆ | **App Shell** (Sider+Header+Content) | 좌측 고정 사이더 + 상단 헤더 + 본문. PLM 구조 |
| ◆ | **Grid / Space** | 4px 그리드. 요소 간격은 `--space-*`만 |
| ○ | **Divider** | 구분선 `--color-split` |

**③ Navigation(내비게이션)**
| ◆/○ | 컴포넌트 | 규칙 |
|---|---|---|
| ◆ | **Menu / Nav** | 활성=accent 텍스트+좌측 바, 비활성=`--color-text-secondary` |
| ◆ | **Tabs** | 활성 탭 밑줄=`--color-accent` |
| ◆ | **Breadcrumb** | 깊은 계층(PLM·문서) 경로. 구분자 `/`, 현재=text, 상위=link |
| ◆ | **Dropdown** | 런처·행의 ⋮ 케밥 메뉴, 계정 메뉴. 배경 elevated+shadow |
| ◆ | **Pagination** | 대량 표(전성분 76품목 등). 현재 페이지=accent |
| ○ | **Steps** | 발행 이력·승인 흐름. 완료/현재=accent, 대기=tertiary |

**④ Data Entry(입력)**
| ◆/○ | 컴포넌트 | 규칙 |
|---|---|---|
| ◆ | **Form** | 라벨=secondary, 필수 표시=error, 검증 메시지=상태색. 필드 세로 리듬 통일 |
| ◆ | **Input / InputNumber** | 높이 `--control-height`, 포커스 링 `--color-focus-ring`, placeholder=tertiary |
| ◆ | **Select** | 입력과 동일 높이·포커스. 드롭다운=elevated |
| ◆ | **Checkbox / Radio** | 선택 상태=accent |
| ◆ | **Switch** | on=accent, off=neutral-300. 설정 토글 |
| ◆ | **DatePicker** | 발행일자 등. 입력과 동일 규격 |
| ◆ | **Upload** | 자료업로드·MSDS 첨부. 점선 테두리 `--color-border`, 호버 accent, 진행률 동반 |

**⑤ Data Display(표시)**
| ◆/○ | 컴포넌트 | 규칙 |
|---|---|---|
| ◆ | **Table** (Data Grid) | 헤더 `--neutral-50`/elevated, 행 구분 `--color-split`, 호버 `--color-accent-bg`, 숫자열 우측정렬+`--seed-font-num`(tabular-nums). 정렬·고정열 지원 |
| ◆ | **Card** | 배경 container, radius `--r-lg`. 런처 타일=아이콘만 §7 색, 그 외 공통 |
| ◆ | **Tag / Badge** | 상태색 6단(success/warning/error/info). 버전·라벨 |
| ◆ | **Descriptions** | 품목 기본정보 등 라벨-값 표. 라벨=secondary |
| ◆ | **Tooltip / Popover** | 도움말·힌트. 배경 elevated |
| ◆ | **Empty** | 데이터 없음 상태. 안내 문구+행동 유도(빈 화면은 '할 일'을 제시) |
| ◆ | **Statistic** | 대시보드 KPI 숫자. 숫자=Figtree, 큰 크기 |
| ○ | **Avatar** | 사용자(HR·계정). 이니셜 fallback |
| ○ | **List / Timeline** | 단순 목록·발행 이력 타임라인 |

**⑥ Feedback(피드백)**
| ◆/○ | 컴포넌트 | 규칙 |
|---|---|---|
| ◆ | **Alert** | 인라인 경고. success/warning/error/info 6단 |
| ◆ | **Modal / Drawer** | 편집 팝업. 배경 elevated+`--shadow-lg`, 딤 오버레이 |
| ◆ | **Message / Toast** | 저장·복사 등 짧은 피드백. 3초 자동 소멸 |
| ◆ | **Notification** | 우측 상단 알림(발행 완료 등) |
| ◆ | **Progress** | 업로드·생산 진행률. 바/원형. 완료=success |
| ◆ | **Spin / Skeleton** | 로딩 상태. 데이터 도착 전 골격 표시 |
| ◆ | **Popconfirm** | 삭제 등 되돌릴 수 없는 동작의 인라인 확인 |
| ○ | **Result** | 발행 성공/실패 전체화면 결과 |

> **문구 원칙(UX Writing)**: 버튼은 결과를 말한다("저장" not "제출"). 에러는 사과하지 말고 무엇이
> 잘못됐고 어떻게 고치는지 알려준다. 빈 화면은 다음 행동을 안내한다. 한 흐름에서 같은 동작은 같은 이름.

---

## 7. 앱 아이콘 색상 레지스트리 (런처 구별용 — primary 아님)

**중요**: 아래 색은 **런처 아이콘을 구별하기 위한 색일 뿐**입니다. 앱 UI 자체(버튼·헤더·강조·표)는
전 앱이 §2의 **공통 primary(Charcoal) + 뉴트럴 톤**을 씁니다. 즉 아이콘만 색이 다르고, 앱 안은
전부 같은 톤입니다.

기존 아이콘 색은 무시하고, **분야(도메인)별로 묶어** 색을 재배정했습니다. 색값은 v1.0 디자인
시스템의 **Product Accent 팔레트(12색군)** 에서 가져왔습니다 — 별도 팔레트를 새로 만들지 않고
이미 검증된 브랜드 색을 재사용해, 마케팅 제품색과 런처 아이콘색이 한 팔레트를 공유합니다.
같은 도메인은 인접 색상군을 써서 런처에서 "무리(그룹)"로 읽히게 했습니다.

**🔬 R&D · 품질 · 규제** (차가운 녹·청 계열 = 과학·정밀)
| 앱 | 분야 | 색군 | hex |
|---|---|---|---|
| JANYTREE PLM | R&D · 문서발행 | Teal | `#2E8E76` |
| 신제품테스트 | 신제품 테스트 | Lime | `#7C9A3E` |
| JT_SOP | 표준작업지침(품질) | Cyan | `#2C8AA6` |

**🏭 생산 · 물류** (산업·안정 계열)
| 앱 | 분야 | 색군 | hex |
|---|---|---|---|
| JT_Factory | 생산 · 물류 · 보고서 | Indigo | `#5B5FB8` |

**💼 영업 · 견적 · 파트너** (따뜻한 금·주황 계열 = 상업)
| 앱 | 분야 | 색군 | hex |
|---|---|---|---|
| JT_Estimate | 제품원가 · 견적 | Gold | `#B98A22` |
| JT_Partner_Portal | 발주 · 수주 · 자료업로드 | Coral | `#C0603A` |

**👥 인사 · 교육** (보라 계열 = 사람·성장)
| 앱 | 분야 | 색군 | hex |
|---|---|---|---|
| JT_HR | 출퇴근 · 연차 · 출장 | Violet | `#7F4FAE` |
| JT_Edu | 직원교육(신입/직무) | Purple | `#9846AC` |

**💻 개발 · 앱 허브** (자홍 계열 = 기술)
| 앱 | 분야 | 색군 | hex |
|---|---|---|---|
| JT_Coding | 앱개발 · 발표공유 | Orchid | `#AD4592` |
| JT_App | 개발앱 허브(생산/영업/교육/복지) | Rose | `#B5486B` |

**📁 공통 · 오피스** (브랜드 먹색)
| 앱 | 분야 | 색군 | hex |
|---|---|---|---|
| JT_Office | 프로젝트 · 보고서(전사 공통) | Charcoal(브랜드) | `#1F2328` |

> 예비색(미배정 — 시맨틱 역할 없음, 아이콘 구별용): **orange `#EF7519`**(9색 팔레트에서 이관) ·
> Pink `#BC4B7C` · Berry `#A83E4D`. 신규 앱 추가 시 도메인에 맞춰 배정.
>
> **규칙**: 신규 앱은 이 표에 아이콘 색만 도메인에 맞춰 추가합니다. **primary는 고르지 않습니다** —
> 회사 공통 Charcoal을 그대로 씁니다(§2). 아이콘 색을 앱 내부 강조로 쓰고 싶다면 primary를
> 덮지 말고 `--icon-accent` 변수로만 국소 사용하고, 버튼·링크·포커스는 공통 primary/accent를 유지.

---

## 8. 문서 발행 패턴 (전성분보고서·MSDS·효능보고서·NDA·견적서 등)

앱의 핵심 산출물이 "발행 문서"이므로 별도 패턴으로 둡니다. **화면 편집 UI ≠ 최종 출력물**을
구분하는 게 핵심입니다.

- **화면 편집 UI**: §6 컴포넌트(Table·Form·Tabs)로 구성 — 라이트/다크/컴팩트 알고리즘 적용
- **최종 출력물(PDF/인쇄)**: 별도 출력 규격 적용 — A4 레터헤드·격식 타이포(pt)·표·서명란
- 화면 전용 효과(그림자·backdrop-filter·애니메이션)는 PDF에서 깨지므로 `@media print`에서 제거

문서 유형별 필수 구성요소·인쇄 규격의 상세는 **강제가 아닌 참고 자료**로 분리:
→ `JT_문서규격_참고문서.md` (견적서엔 유효기간·품목표, 성적서엔 시험조건·판정 등)

이 참고 자료는 회계·HR·ISO 같은 일반 업무 앱에는 적용하지 않습니다. 정형 문서를 출력하는
앱을 만들 때만 꺼내 씁니다.

---

## 9. 스택별 적용 (개발자마다 도구가 다름)

| 스택 | Seed | Map | Alias |
|---|---|---|---|
| **antd / React** | `ConfigProvider`의 `theme.token`에 colorPrimary 등 | 알고리즘이 자동 파생(darkAlgorithm·compactAlgorithm 조합) | 자동. 필요 시 `token`으로 override |
| **Tailwind (Vercel/Next)** | `tailwind.config`의 `theme.extend.colors.primary` | 대응 shade 단계(50~900)로 매핑 | `globals.css`의 `:root`/`[data-theme=dark]`에 CSS 변수로 |
| **순수 HTML/CSS** | `:root`에 seed 변수 | §3 값을 명시 | §4 값을 명시 |
| **Google Sheet/AppSheet** | 앱 테마에 primary·폰트만 수동 | — | 표 서식에 §6 Table 규칙 수동 반영 |
| **AI 에이전트(Antigravity/Claude Code)** | 이 문서를 루트에 두고 플레이북 프롬프트 사용 | | |

---

## 10. 거버넌스

- 문서 변경 시 버전(v3.0 → v3.1) + 사유 한 줄
- **Seed·Map 값 변경은 디렉터 승인** (전 앱 파급). Alias 재정의(테마)는 앱 단위 자유
- 신규 토큰은 이 문서에 먼저 추가 후 앱에 반영 (역순 금지)
- 신규 앱은 §7에 아이콘 구별색만 등록 (primary는 공통값 사용)

### 채택(Adoption) 레벨 — 기존 앱이 안 깨지게

| 레벨 | 무엇 적용 | 강제 | 비고 |
|---|---|---|---|
| **L1** | Seed(primary·neutral·font) + 핵심 Alias(text/bg/border) | 모든 앱 | 이것만 해도 "통합됨" |
| **L2** | Map/Alias 전체 + 컴포넌트 규칙 | 권장 | 화면 단위 점진 |
| **L3** | 문서 발행 패턴(§8) | 문서 출력 앱만 | 일반 업무 앱 제외 |

기존 앱은 L1부터. 적용 방법은 아래 플레이북 참조.

## 함께 쓰는 문서
- **`JT_디자인시스템_Foundation_v1.0.md`** — 색상(9색)·타이포(다국어)·반응형·모션·아이콘(구글)·일러스트·템플릿 등 기본기 전체 (이 마스터의 Foundation 상세판)
- `JT_작업지시서_신규앱.md` — 새 앱 개발자용 실행 지시서(복붙 프롬프트 포함)
- `JT_작업지시서_기존앱.md` — 기존 앱 마이그레이션 지시서(백업·단계별 안전 절차)
- `JT_토큰뷰어_v3.0.html` — 색상·컴포넌트를 브라우저에서 눈으로 확인하는 시각 자료
- `JT_목업_AppShell_Dashboard.html` — 규칙대로 조립된 참조 구현(App Shell + Dashboard)
- `brand/` — 로고 파일 12종 + 사용 가이드(README)
- `JT_문서규격_참고문서.md` — 문서 발행 패턴 상세(참고용)

### Figma 원본 (디자인 도구 측 source of truth)
`JT_디자인시스템_Pro` — https://www.figma.com/design/y4rPLkvB8BOtyuz7Md8bCk

3개 컬렉션으로 구성:
| 컬렉션 | 모드 | 역할 |
|---|---|---|
| 1. Primitives | Value | 원시 팔레트(9색 체계 전체 + 다크 표면 계단) |
| 2. Semantic (Light/Dark) | **Light · Dark** | 의미 토큰. Primitive를 별칭 참조, 모드로 라이트/다크 전환 |
| 3. Scale (Density) | Comfortable · Compact | 간격·라운드·폰트크기·컨트롤 높이(밀도 연동) |

> 디자이너는 Figma에서, 개발자는 이 md/CSS 토큰에서 작업합니다. **양쪽 값이 어긋나지 않도록**,
> Figma에서 색을 조정하면 반드시 마스터 문서와 목업 HTML의 해당 토큰도 같이 갱신하십시오.
