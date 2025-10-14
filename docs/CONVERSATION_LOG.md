## 대화 기록 요약 (BrainSpaghetti)

### 메타

- 날짜: 2025-10-01
- 최근 주요 커밋: `ebb049cc` (UI/UX 및 맵 개선), 이전 `ee8f578b` (마인드맵 성능 최적화 1차)

### 합의/결정 사항

- 마인드맵 성능 개선
  - 백엔드: 맵 API 파라미터(threshold, k, maxNodes, maxEdges), 병렬 유사도 검색, 노드·엣지 상한, 60초 메모리 캐시
  - 프론트: vis-network 안정화 후 physics 비활성화, smooth 비활성화, 에러 분기 제거, threshold/k 컨트롤 추가, 슬라이더는 드래그 종료 시에만 요청
- UI/UX
  - 전역 alert 제거 → 토스트(오류만, 자동 사라짐), 버튼 로딩 스피너 도입
  - 로그인/회원가입/작성/수정/삭제 플로우는 조용한 성공 원칙 유지
- 아키텍처 메모
  - 현재는 엣지 사전계산 미사용(요청 시 계산 + 캐시)
  - 확장 시 top-k 후보 사전계산(유사도값 포함) → 슬라이더는 필터만 적용하는 방향 고려

### 현재 기본값 및 권장치

- threshold=0.90, k=3, maxNodes=200, maxEdges=2000
- 느리면: threshold↑, k=2~3 유지, 상한 낮추기

### 잠재적 다음 단계(선택)

- Redis 캐시로 전환(다중 인스턴스 캐시 공유)
- 배치/사전계산 테이블(`post_edges`)로 대규모 최적화
- 마인드맵 UI에 maxNodes/maxEdges 컨트롤 추가(옵션)

### 변경 내역(요약)

- 백엔드
  - `post.controller.ts`: 맵 API 파라미터 추가
  - `post.service.ts`: 병렬 유사도 검색, 상한 적용, 60초 캐시
- 프론트엔드
  - `ToastProvider`/`useToast`, `SpinnerInline`, `PageSkeleton` 추가 및 적용
  - `MindMapPage`/`HomePage`/`ProfilePage`: threshold/k 컨트롤, 커밋형 슬라이더, vis 옵션 튜닝
  - 전역 alert 제거 및 에러 토스트 교체

---

## 날짜: 2025-10-02

### 주요 변경/결정

- **로그인 새로고침 문제 해결**
  - JWT 토큰 만료 시간 연장: 1시간 → 24시간
  - AuthContext에 로딩 상태(`isLoading`) 추가하여 토큰 검증 완료 전 라우팅 보호 로직 실행 방지
  - 토큰 만료 체크 로직 추가: `isTokenExpired` 함수로 JWT exp 필드 검증
  - API 인터셉터와 AuthContext 상태 동기화: 401 에러 시 커스텀 이벤트(`auth-logout`) 발생
  - 보호된 페이지들(ProfilePage, PostCreatePage, PostEditPage)에 인증 체크 로직 추가

### 근거/메모

- **문제 원인**: 새로고침 시 AuthContext 초기화 중 비동기 토큰 검증이 완료되기 전에 라우팅 보호 로직이 먼저 실행되어 로그인 페이지로 리다이렉트
- **해결 방법**:
  1. 로딩 상태 도입으로 토큰 검증 완료 전까지 라우팅 결정 지연
  2. 토큰 만료 시간 체크로 유효하지 않은 토큰 자동 제거
  3. API 에러와 Context 상태 동기화로 일관된 인증 상태 유지
- **부가 효과**: PostCreatePage, PostEditPage에 누락되었던 인증 체크 추가로 보안 강화

### 커밋/PR

- 커밋: `6639e1b9` (Fix: 로그인 새로고침 시 로그인 유지 문제 해결)
- 변경 파일: 21개 (backend 12개, frontend 9개)
- 주요 변경:
  - `backend/src/app.module.ts`: JWT expiresIn '1h' → '24h'
  - `frontend/src/contexts/AuthContext.tsx`: isLoading 상태, isTokenExpired 함수, 이벤트 리스너 추가
  - `frontend/src/services/api.ts`: 401 에러 시 auth-logout 이벤트 발생
  - `frontend/src/pages/ProfilePage.tsx`, `PostCreatePage.tsx`, `PostEditPage.tsx`: 인증 체크 로직 추가

---

### 향후 기록 추가 템플릿

```
## 날짜: YYYY-MM-DD

### 주요 변경/결정
- 항목 1
- 항목 2

### 근거/메모
- 관련 이슈/문제와 선택 이유

### 커밋/PR
- 커밋: `<hash>` (요약)
```
