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

    • MVP: 글 작성 + 마인드맵 시각화
    • 사용자 프로필 자동 생성
    • 유저 간 포스트 공유
    • 추천 알고리즘 개선
    • 배포 (Docker → 클라우드)

⸻

📜 라이선스

MIT License
