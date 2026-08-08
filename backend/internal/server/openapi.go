package server

import "net/http"

const openAPIJSON = `{
  "openapi": "3.0.3",
  "info": {
    "title": "GoOffer Итоги года",
    "version": "1.0.0",
    "description": "API MVP кейса «Итоги года»: профили, generate, share, auth"
  },
  "paths": {
    "/health": {
      "get": { "summary": "Healthcheck" }
    },
    "/metrics": {
      "get": { "summary": "Базовые runtime-метрики" }
    },
    "/api/profiles": {
      "get": { "summary": "Список тестовых профилей" }
    },
    "/api/profiles/{id}": {
      "get": { "summary": "Профиль по id" }
    },
    "/api/recap/generate": {
      "post": {
        "summary": "Генерация итогов года",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["user_id", "year"],
                "properties": {
                  "user_id": { "type": "string", "format": "uuid" },
                  "year": { "type": "integer", "example": 2025 }
                }
              }
            }
          }
        }
      }
    },
    "/api/recap/generate-all": {
      "post": { "summary": "Пересчёт recap для всех тестовых профилей" }
    },
    "/api/recap/{user_id}/{year}": {
      "get": { "summary": "Получить сохранённый recap" }
    },
    "/api/recap/{user_id}/{year}/share": {
      "get": { "summary": "Публичная share-card без id/user_id" }
    },
    "/api/auth/login": {
      "post": { "summary": "Вход (cookie-сессия)" }
    },
    "/api/auth/register": {
      "post": { "summary": "Регистрация" }
    },
    "/api/auth/logout": {
      "post": { "summary": "Выход" }
    },
    "/api/auth/me": {
      "get": { "summary": "Текущий аккаунт" }
    }
  }
}`

func openAPIHandler(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_, _ = w.Write([]byte(openAPIJSON))
}
