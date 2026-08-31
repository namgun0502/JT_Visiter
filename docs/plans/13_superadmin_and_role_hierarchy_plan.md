# 13. superadmin 역할 추가 및 역할 계층형 부여 권한 제어 구현 계획서

## 1. 개요
직원 등록/수정 시 superadmin 역할이 누락되어 있던 문제를 해결하고, 로그인한 사용자의 권한에 따라 하위 역할만 부여할 수 있도록 계층형 제어를 적용합니다.

## 2. 역할 계층 구조
- superadmin: superadmin, admin, 안내자+승인자, 승인자, 안내자 모두 부여 가능
- admin: admin, 안내자+승인자, 승인자, 안내자 부여 가능 (superadmin 부여 불가)

## 3. 작업 내용
1. index.html의 직원 등록 폼(#e-role) 및 직원 수정 모달(#edit-e-role)에 <option value="superadmin">최고관리자 (Superadmin)</option> 추가
2. app.js에서 관리자 탭 진입 시 또는 모달 열림 시 로그인한 사용자(currentUser.role)에 따라 select 옵션을 동적으로 필터링/표시
   - superadmin 로그인 시: 전체 역할 옵션 표시
   - admin 로그인 시: superadmin 옵션 숨김/제거
3. app.js의 loadAdminEmployees에서 superadmin 뱃지 스타일 렌더링 지원 (예: 👑 최고관리자)
4. handleAddEmployee 및 submitEditEmployee에서 권한 검증 (admin이 superadmin을 부여하려고 할 경우 차단)
