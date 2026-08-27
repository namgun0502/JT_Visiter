# 브랜드 로고 — 사용 가이드

이 `brand/` 폴더를 프로젝트에 그대로 넣으면 됩니다.

- **Next.js/Vercel**: 프로젝트의 `public/` 아래에 두세요 → `public/brand/logo/...`
  브라우저 경로는 `/brand/logo/logo-h.svg` 처럼 `public`을 뺀 절대경로입니다.
- **순수 HTML/Vite**: `public/brand/` 또는 `assets/brand/`에 두고 상대경로로 참조.

## 파일 명명 규칙 (일관성 = 경로 오류 방지)

`logo-{형태}[-light].{확장자}`

| 형태 | 파일 (다크 로고 · 밝은 배경용) | 파일 (흰색 로고 · 어두운 배경용) |
|---|---|---|
| **mark** (심볼 J⁺) | `logo-mark.svg` | `logo-mark-light.svg` |
| **h** (가로 조합·**기본 권장**) | `logo-h.svg` | `logo-h-light.svg` |
| **v** (세로 조합) | `logo-v.svg` | `logo-v-light.svg` |
| **wordmark** (글자만) | `logo-wordmark.svg` | `logo-wordmark-light.svg` |
| 파비콘 | `favicon.svg` (= mark) | — |

> ⚠️ **`-light` = 흰색 로고 = "어두운 배경"용**입니다("밝은 테마용"이 아님, 혼동 주의).
>   기본(접미사 없음) = 먹색 `#1F2328` = 밝은 배경용.
> ⚠️ 업로드본의 `logo_v-light.svg`(언더스코어)는 `logo-v-light.svg`(하이픈)로 **교정**했습니다.
>   전 파일이 하이픈으로 통일되어 있어야 코드에서 경로가 안 깨집니다.
> - SVG가 기본(무한 확대에도 선명). `.png`는 SVG 미지원 환경 폴백용으로만.

## 테마별 자동 교체 (라이트/다크)

### 방법 A — HTML/CSS (가장 단순, 바이브코딩 추천)
두 이미지를 겹쳐두고 테마에 따라 하나만 표시합니다.

```html
<span class="jt-logo">
  <img src="/brand/logo/logo-h.svg"       alt="Janytree" class="on-light">
  <img src="/brand/logo/logo-h-light.svg" alt=""          class="on-dark" aria-hidden="true">
</span>
```
```css
.jt-logo img{height:28px;width:auto;display:block}
.jt-logo .on-dark{display:none}
[data-theme="dark"] .jt-logo .on-light{display:none}
[data-theme="dark"] .jt-logo .on-dark{display:block}
```

### 방법 B — React 컴포넌트 (Next.js)
```jsx
export function Logo({ variant = "h", height = 28 }) {
  // 현재 테마를 읽는 방식은 프로젝트에 맞게(next-themes 등)
  const isDark = typeof document !== "undefined"
    && document.documentElement.dataset.theme === "dark";
  const src = `/brand/logo/logo-${variant}${isDark ? "-light" : ""}.svg`;
  return <img src={src} alt="Janytree" height={height} style={{ width: "auto" }} />;
}
```

### 방법 C — OS 다크모드 자동(picture)
사이트가 `prefers-color-scheme`를 따를 때:
```html
<picture>
  <source srcset="/brand/logo/logo-h-light.svg" media="(prefers-color-scheme: dark)">
  <img src="/brand/logo/logo-h.svg" alt="Janytree" height="28">
</picture>
```

### 파비콘 (Next.js)
`app/` 라우터면 `app/icon.svg`로 `favicon.svg`를 복사하거나,
```html
<link rel="icon" href="/brand/logo/favicon.svg" type="image/svg+xml">
```

## 사용 규칙 (요약, 상세는 Foundation §10)
- 최소 여백 = 심볼 높이의 50%. 다른 요소가 침범 금지.
- 임의 색 변경·비율 왜곡·그림자 추가 금지. 제공된 먹색/흰색 2종만 사용.
- **권장 크기**: 앱 상단바 = h 또는 mark **28~32px** · 문서 레터헤드 = h **30~34px** ·
  로그인/스플래시 = v(세로형) **52~64px** · SNS 프로필 = mark(정사각)
  > 세로형(v)은 심볼+글자가 2단이라, 같은 높이여도 심볼이 절반 크기로 보입니다.
  > 가로형보다 **1.8배 이상 크게** 잡아야 균형이 맞습니다.
- 복잡한 배경 위에는 흰색 또는 `#1F2328` 단색 배지를 깔고 올림.
