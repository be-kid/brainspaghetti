FROM node:20

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .

CMD ["pnpm", "run", "start:dev"]
