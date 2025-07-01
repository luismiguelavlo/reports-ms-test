# Build stage
FROM public.ecr.aws/docker/library/node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM public.ecr.aws/lambda/nodejs:20

WORKDIR ${LAMBDA_TASK_ROOT}

# Install dependencies for Chromium
RUN microdnf update -y && \
    microdnf install -y \
    nss \
    freetype \
    fontconfig \
    libstdc++ \
    && microdnf clean all

COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/template ./template

# Set environment variables for Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_CACHE_DIR=/tmp/puppeteer

CMD ["dist/index.handler"]