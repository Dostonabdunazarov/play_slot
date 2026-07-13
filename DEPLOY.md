# Деплой play_slot → play.hypex.site

Архитектура повторяет corpdev: **TLS терминирует Cloudflare**, на сервере трафик
идёт по HTTP на общий **Caddy** (живёт в `corpdev/infra`), который маршрутизирует
по доменам через общую Docker-сеть `proxy`.

```text
Браузер → Cloudflare (HTTPS) → сервер :80 → Caddy → /api/* → playslot-backend:8080
                                                   → всё остальное → playslot-frontend:80
```

Фронтенд зовёт API относительным путём `/api` (axios `baseURL='/api'`), поэтому
отдельный домен для бэкенда не нужен — всё на `play.hypex.site`.

## Что уже настроено в репозитории

| Файл | Назначение |
|------|-----------|
| `docker-compose.yml` | базовый (локальная разработка, порты 5432/5000/3000) |
| `docker-compose.prod.yml` | прод-оверлей: сеть `proxy`, без публичных портов, секреты из `.env`, `ASPNETCORE_ENVIRONMENT=Production` |
| `frontend/nginx.conf` | SPA-fallback + gzip + жёсткий кэш `/assets/` |
| `backend/.dockerignore`, `frontend/.dockerignore` | чистый build-контекст |
| `.env.example` | шаблон секретов (`POSTGRES_PASSWORD`, `JWT_KEY`) |
| `.github/workflows/deploy.yml` | авто-деплой по push в `main` через SSH |
| `corpdev/infra/Caddyfile` | блок `play.hypex.site` (уже добавлен) |

## Первичная настройка на сервере (один раз)

```bash
# 1. Клонировать репозиторий рядом с corpdev
cd /root
git clone <repo-url> play_slot
cd play_slot

# 2. Создать .env с реальными секретами (в git не коммитится)
cp .env.example .env
# отредактировать POSTGRES_PASSWORD и JWT_KEY (JWT_KEY: openssl rand -base64 48)

# 3. Общая сеть proxy (если ещё не создана — её поднимает corpdev)
docker network inspect proxy >/dev/null 2>&1 || docker network create proxy

# 4. Поднять play_slot
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 5. Перечитать Caddy (маршрут play.hypex.site уже в corpdev/infra/Caddyfile)
docker compose -f /root/corpdev/infra/docker-compose.yml exec -T caddy \
  caddy reload --config /etc/caddy/Caddyfile
```

## Cloudflare (делается вручную)

Создать DNS-запись **A/AAAA `play` → IP сервера**, проксирование включено
(оранжевое облачко). TLS выпускает Cloudflare, на сервере сертификаты не нужны.

## Дальнейшие деплои

Автоматически по push в `main` (см. `.github/workflows/deploy.yml`).
Нужны GitHub Secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`.

Вручную:
```bash
cd /root/play_slot
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker image prune -f
```

## Полезное

```bash
# логи
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
# проверить, что контейнеры в сети proxy
docker network inspect proxy
```
