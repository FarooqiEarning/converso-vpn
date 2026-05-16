# Build stage
FROM golang:1.21-alpine AS builder

RUN apk add --no-cache gcc musl-dev linux-headers

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o agent ./cmd/agent

# Production stage
FROM gcr.io/distroless/static:nonroot

WORKDIR /app

COPY --from=builder /app/agent /app/agent
COPY --from=builder /app/proto/agent.proto /app/agent.proto

USER nonroot:nonroot

EXPOSE 9100 50051

ENTRYPOINT ["/app/agent"]