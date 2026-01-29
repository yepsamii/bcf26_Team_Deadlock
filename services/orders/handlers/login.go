package handlers

import (
	"encoding/json"
	"net/http"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	tracer := otel.Tracer("auth-service")

	// Validation span
	ctx, validateSpan := tracer.Start(r.Context(), "Login.ValidateInput")

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		validateSpan.RecordError(err)
		validateSpan.SetStatus(codes.Error, "invalid request body")
		validateSpan.End()

		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		validateSpan.SetStatus(codes.Error, "missing required fields")
		validateSpan.End()

		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	validateSpan.SetAttributes(attribute.String("user.email", req.Email))
	validateSpan.SetStatus(codes.Ok, "validation passed")
	validateSpan.End()

	// Database lookup span
	ctx, dbSpan := tracer.Start(ctx, "Login.DatabaseLookup")
	dbSpan.SetAttributes(
		attribute.String("db.system", "postgresql"),
		attribute.String("db.operation", "SELECT"),
		attribute.String("db.table", "users"),
		attribute.String("query.email", req.Email),
	)

	var user User
	var passwordHash string
	err := h.db.QueryRow(
		ctx,
		`SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
		req.Email,
	).Scan(&user.ID, &user.Email, &passwordHash, &user.CreatedAt)

	if err != nil {
		dbSpan.RecordError(err)
		dbSpan.SetStatus(codes.Error, "user not found")
		dbSpan.End()

		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	dbSpan.SetAttributes(attribute.String("user.id", user.ID))
	dbSpan.SetStatus(codes.Ok, "user found")
	dbSpan.End()

	// Password verification span
	_, pwSpan := tracer.Start(ctx, "Login.VerifyPassword")

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		pwSpan.RecordError(err)
		pwSpan.SetStatus(codes.Error, "password mismatch")
		pwSpan.End()

		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	pwSpan.SetStatus(codes.Ok, "password verified")
	pwSpan.End()

	// Token generation span
	_, tokenSpan := tracer.Start(ctx, "Login.GenerateToken")
	tokenSpan.SetAttributes(attribute.String("user.id", user.ID))

	token, err := generateToken(user.ID, user.Email)
	if err != nil {
		tokenSpan.RecordError(err)
		tokenSpan.SetStatus(codes.Error, "token generation failed")
		tokenSpan.End()

		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	tokenSpan.SetStatus(codes.Ok, "token generated")
	tokenSpan.End()

	response := LoginResponse{
		Token: token,
		User:  user,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
