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
