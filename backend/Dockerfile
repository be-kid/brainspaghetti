# 1. Node.js 베이스 이미지
FROM node:20-alpine

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. package.json 복사 & 설치
COPY package*.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install

# 4. 소스 코드 복사
COPY . .

# 5. NestJS 실행
CMD ["pnpm", "start:dev"]