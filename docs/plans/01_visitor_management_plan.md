# 01. JT 방문자 관리 시스템 구현 계획

## 작성일
2026-08-10

## 개요
회사 외부 방문자를 효율적으로 관리하기 위한 웹 앱.
GitHub → Vercel 자동 배포, Supabase(PostgreSQL) 데이터 저장 구조.

## 아키텍처
- Frontend: HTML5 / CSS3 / Vanilla JS
- Database: Supabase (PostgreSQL)
- Deployment: Vercel (GitHub 연동 자동 배포)
- Repository: https://github.com/namgun0502/JT_Visiter.git

## 구현 기능
1. 방문자 등록 (이름, 연락처, 소속회사, 방문목적, 대상직원, 방문일시)
2. 방문 기록 조회 (카드 목록)
3. 방문 기록 검색 (이름/회사/직원 키워드)
4. 직원 목록 관리 (추가/삭제)
5. 방문 기록 삭제

## Supabase 설정
- Project URL: https://qzhgsshyhmnczmreagqd.supabase.co
- 테이블: visitors, employees
- RLS: 공개 읽기/쓰기 정책 (사내망 전용)

## 파일 구조
- index.html — 메인 앱 (3탭: 등록/기록/직원관리)
- style.css — 다크모드 글래스모피즘 디자인
- app.js — Supabase 연동 기능 로직
- supabase/migrations/001_create_visitors_table.sql
- supabase/migrations/002_create_employees_table.sql
- supabase/migrations/003_rls_policy.sql

## 구현 완료일
2026-08-10
