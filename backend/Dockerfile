FROM node:20

# Install pnpm
RUN npm install -g pnpm

# Copy entire project into container
COPY . /usr/src/app_temp

# Set working directory to backend
WORKDIR /usr/src/app_temp/backend

ENV CI=true
# Install dependencies
RUN pnpm install

# Set final working directory
WORKDIR /usr/src/app_temp/backend

# The command from docker-compose.yml will be used, but this is a good fallback.
CMD ["pnpm", "run", "start:dev"]
