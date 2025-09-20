COMPOSE=docker compose -f deploy/docker-compose.yml

.PHONY: up down seed demo logs

up:
$(COMPOSE) up -d --build

seed:
psql postgresql://mcp:mcp@localhost:5432/mcp -f deploy/seed.sql

demo:
./scripts/demo.sh

logs:
$(COMPOSE) logs -f

down:
$(COMPOSE) down -v
