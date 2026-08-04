package errors

import "errors"

// Доменные ошибки — их понимают все слои приложения.
// Репозиторий возвращает ErrNotFound, handler превращает её в HTTP 404.
var (
	ErrNotFound    = errors.New("not found")
	ErrInvalidID   = errors.New("invalid id")
	ErrInvalidYear = errors.New("invalid year")
)
