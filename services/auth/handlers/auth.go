package handlers

import (
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthHandler struct {
	db *pgxpool.Pool
}

func New(conn *pgxpool.Pool) *AuthHandler {
	return &AuthHandler{db: conn}
}

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}
