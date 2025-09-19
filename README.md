# 🧠 BrainSpaghetti

BrainSpaghetti는 사용자가 작성한 글(포스트)을 **AI로 분석**하여  
서로 연관된 내용을 **마인드맵 형태로 시각화**해주는 개인 지식 관리 & SNS 플랫폼입니다.

---

## ✨ 주요 기능

    - 📄 **포스트 작성 및 관리**
      - 제목 + 단문/장문 글 작성
      - 수정 / 삭제 / 상태(보관, 게시 등) 변경
    - 🔍 **AI 기반 연관성 분석**
      - OpenAI Embedding을 사용해 글 벡터화
      - Supabase(pgvector)로 유사도 검색
    - 🗺️ **마인드맵 시각화**
      - 연관된 글들을 마치 스파게티처럼 연결
      - 글 간 관계를 직관적으로 파악 가능
    - 👤 **유저 관리**
      - 회원가입 / 로그인
      - 프로필 자동 생성 (AI 기반 요약)
    - 🌐 **공유**
      - 다른 사용자의 포스트 열람
      - 나만의 지식 그래프를 공유 가능

---

## 🛠 기술 스택

### Frontend

    - React + TypeScript + Vite
    - 상태 관리: Context API (추후 Recoil/Zustand 고려)
    - 시각화: d3.js, vis-network, cytoscape.js 등 검토 중

### Backend

    - NestJS (Node.js Framework)
    - MySQL (주 데이터 저장소)
    - Supabase (pgvector, 벡터 검색 전용)
    - TypeORM (ORM)

### AI

    - OpenAI API (Embedding, 요약/프로필 생성)

---

## 📂 프로젝트 구조

    brainspaghetti/
    ├── frontend/   # React + TypeScript (Vite 기반)
    ├── backend/    # Docker(NestJS + MySQL) + Supabase
    ├── gemini.md   # AI 개발 가이드 (Gemini/Claude Code 참고용)
    └── README.md   # 프로젝트 설명 문서

---

## 🚀 실행 방법

### 1. 프론트엔드(개발)

```bash
cd frontend
pnpm install
pnpm run dev
```

### 2. 백엔드(개발)

```bash
cd backend
docker compose up --build -d
```

🧩 개발 로드맵 (초안)

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

⸻

📜 라이선스

MIT License
