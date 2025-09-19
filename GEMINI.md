# BrainSpaghetti - AI 개발 가이드

## 기본 원칙

- 모든 대답은 **한글**로 해주세요.
- 필요하다면 코드 예시는 영어를 사용해도 되지만 설명은 반드시 한글로 작성하세요.
- 모호할 경우 임의로 결정하지 말고 질문을 먼저 해주세요.

## 프로젝트 구조

- brainspaghetti/frontend: React + TypeScript + Vite
- brainspaghetti/backend: NestJS + MySQL
- 벡터 검색: Supabase (pgvector)
- 배포: Docker (개발/테스트 환경), 이후 클라우드 고려
- 패키지 매니저: pnpm

## 코딩 스타일

- **React (프론트엔드)**

  - 함수형 컴포넌트 우선
  - 상태관리는 우선 Context API, 필요 시 Zustand/Recoil 고려
  - 컴포넌트는 역할 단위로 분리, 가독성을 최우선
  - ESLint + Prettier 적용

- **NestJS (백엔드)**

  - 모듈 / 서비스 / 컨트롤러 / 레포지토리 구조
  - DTO를 통한 요청 유효성 검증
  - 서비스 계층은 얇게 유지, 핵심 비즈니스 로직은 별도 계층에 배치
  - TypeORM 사용, 엔티티는 `src/modules/<domain>/entities/`에 둔다

## 개인 성향

- 복잡한 코드보다는 단순하고 읽기 쉬운 코드를 선호
- 커밋 메시지는 짧고 명령형으로 작성 (예: "add post API")
- 불필요한 외부 라이브러리보다는 기본 기능 우선
- 절대 경로 import 선호 (`@/modules/...`)

## AI 사용 지침

- 코드 생성 시 간단한 설명을 함께 제공
- 비용을 최소화할 수 있는 방향을 항상 고려
- **우선순위**:
  1. 글 작성 & 마인드맵 시각화 (MVP)
  2. 유저 관리 (회원가입/로그인)
  3. 포스팅 검색 및 추천 기능
- 결과를 바로 실행 가능한 형태로 제안

## 개발 순서

1. 환경 세팅

   - 프로젝트 구조 생성 (backend, frontend, gemini.md, README.md)
   - Docker Compose로 NestJS + MySQL 개발 환경 구성
   - Supabase 계정 생성 및 pgvector 확장 DB 준비
   - OpenAI API Key 발급 및 환경 변수 세팅

2. 백엔드 (NestJS)

- 공통 설정

  - TypeORM + ConfigModule 연동
  - DB 연결 테스트 (User 테이블 생성 확인)

- 모듈 개발
  - User 모듈
    - 회원가입 / 로그인 (JWT or Supabase Auth 선택 가능)
    - 유저 조회 / 탈퇴
  - Post 모듈
    - 포스트 작성 / 수정 / 삭제 / 조회
    - 포스트 작성 시: OpenAI Embedding 생성 → MySQL 저장 + Supabase에도 post_id + embedding 저장
  - AI 모듈
    - OpenAI API 호출 래퍼 서비스
    - “한 줄 소개” 기능 (10개 이상 글 작성한 유저만)
  - Vector Search (Supabase 연동)
    - 유사 포스트 검색 API
    - 임계값(threshold) 이상일 때만 연결 반환

3. 프론트엔드 (React + Vite + TS)

   - 기본 레이아웃
     - 라우팅 (/login, /signup, /posts, /map, /profile)
     - 공통 UI (헤더/푸터)
   - 기능 페이지
     - 로그인 / 회원가입 페이지
     - 포스트 작성 페이지
     - 포스트 리스트 & 상세
     - 마인드맵 페이지 (d3.js / cytoscape.js / vis-network 등 중 하나)
     - 프로필 페이지 (AI 한 줄 소개 표시)
   - API 연동
     - Axios로 NestJS API 호출
     - Auth 토큰 처리
     - 에러 핸들링

4. AI 기능 연결

   - 포스트 저장 시 OpenAI Embedding API 호출
   - Supabase에 임베딩 저장
   - 유사도 검색 → 마인드맵으로 반환
   - “한 줄 소개” API 구현

5. 테스트 & 배포
   - Jest / e2e 테스트 추가
   - Docker 이미지 최적화
   - 클라우드 배포 (Vercel + Render / Fly.io / AWS 선택)
