package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	tracer := otel.Tracer("auth-service")

	// Validation span
	ctx, validateSpan := tracer.Start(r.Context(), "Register.ValidateInput")

	var req RegisterRequest
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

	// Password hashing span
	ctx, hashSpan := tracer.Start(ctx, "Register.HashPassword")

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		hashSpan.RecordError(err)
		hashSpan.SetStatus(codes.Error, "password hashing failed")
		hashSpan.End()

		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	hashSpan.SetStatus(codes.Ok, "password hashed")
	hashSpan.End()

	// Database insertion span
	ctx, dbSpan := tracer.Start(ctx, "Register.DatabaseInsert")
	dbSpan.SetAttributes(
		attribute.String("db.system", "postgresql"),
		attribute.String("db.operation", "INSERT"),
		attribute.String("db.table", "users"),
		attribute.String("user.email", req.Email),
	)

	var user User
	err = h.db.QueryRow(
		ctx,
		`INSERT INTO users (email, password_hash) 
		 VALUES ($1, $2) 
		 RETURNING id, email, created_at`,
		req.Email, string(hashedPassword),
	).Scan(&user.ID, &user.Email, &user.CreatedAt)

	if err != nil {
		dbSpan.RecordError(err)

		// Check for duplicate email
		if err.Error() == "ERROR: duplicate key value violates unique constraint \"users_email_key\" (SQLSTATE 23505)" {
			dbSpan.SetStatus(codes.Error, "duplicate email")
			dbSpan.End()

			http.Error(w, "Email already exists", http.StatusConflict)
			return
		}

		dbSpan.SetStatus(codes.Error, "database insertion failed")
		dbSpan.End()

		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	dbSpan.SetAttributes(attribute.String("user.id", user.ID))
	dbSpan.SetStatus(codes.Ok, "user created")
	dbSpan.End()

	// Token generation span
	_, tokenSpan := tracer.Start(ctx, "Register.GenerateToken")
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

	response := RegisterResponse{
		Token: token,
		User:  user,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

var jwtSecret = []byte("team-deadlock")

func generateToken(userID, email string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}
