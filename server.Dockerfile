FROM oven/bun:canary-alpine AS builder

WORKDIR /app

COPY . .

RUN bun install

WORKDIR /app/server
RUN bun executable

WORKDIR /app

#FROM gcr.io/distroless/base-debian12
FROM oven/bun:canary-alpine
WORKDIR /app

COPY --from=builder /app/out/friendcrm-server .

CMD ["./friendcrm-server"]