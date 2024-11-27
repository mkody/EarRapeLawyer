FROM node:22.11.0

# Setup for project
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Copy project files
COPY ./index.js ./package.json ./pnpm-lock.yaml ./

# Install deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store corepack enable && pnpm install --frozen-lockfile

CMD [ "node", "index.js" ]
