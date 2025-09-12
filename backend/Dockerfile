# Dockerfile

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# pnpm 설치
RUN npm install -g pnpm

# package.json, pnpm-lock.yaml 복사
COPY package.json pnpm-lock.yaml ./

# 의존성 설치
RUN pnpm install --frozen-lockfile

# 소스코드 복사
COPY . .

# 애플리케이션 빌드
RUN pnpm run build

# 2. Production Stage
FROM node:20-alpine

WORKDIR /usr/src/app

# pnpm 설치
RUN npm install -g pnpm

# 빌드 스테이지에서 빌드된 파일과 node_modules 복사
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/dist ./dist

# 외부에 노출할 포트
EXPOSE 3000

# 애플리케이션 실행
CMD ["pnpm", "run", "start:prod"]
