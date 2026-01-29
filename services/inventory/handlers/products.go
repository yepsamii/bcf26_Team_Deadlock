package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

type CreateProductRequest struct {
	Title             string  `json:"title"`
	Price             float64 `json:"price"`
	AvailableQuantity int     `json:"available_quantity"`
}

type UpdateProductRequest struct {
	Title             string  `json:"title,omitempty"`
	Price             float64 `json:"price,omitempty"`
	AvailableQuantity int     `json:"available_quantity,omitempty"`
}

type ReserveProductRequest struct {
	Quantity int `json:"quantity"`
}

// CreateProduct creates a new product
func (h *InventoryHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	tracer := otel.Tracer("inventory-service")

	// Validation span
	ctx, validateSpan := tracer.Start(r.Context(), "CreateProduct.ValidateInput")

	var req CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		validateSpan.RecordError(err)
		validateSpan.SetStatus(codes.Error, "invalid request body")
		validateSpan.End()

		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Title == "" || req.Price <= 0 || req.AvailableQuantity < 0 {
		validateSpan.SetStatus(codes.Error, "missing or invalid required fields")
		validateSpan.End()

		http.Error(w, "Title, valid price, and available quantity are required", http.StatusBadRequest)
		return
	}

	validateSpan.SetAttributes(attribute.String("product.title", req.Title))
	validateSpan.SetStatus(codes.Ok, "validation passed")
	validateSpan.End()

	// Database insertion span
	ctx, dbSpan := tracer.Start(ctx, "CreateProduct.DatabaseInsert")
	dbSpan.SetAttributes(
		attribute.String("db.system", "postgresql"),
		attribute.String("db.operation", "INSERT"),
		attribute.String("db.table", "products"),
		attribute.String("product.title", req.Title),
	)

	var product Product
	err := h.db.QueryRow(
		ctx,
		`INSERT INTO products (title, price, available_quantity, reserved)
		 VALUES ($1, $2, $3, 0)
		 RETURNING id, title, price, available_quantity, reserved, created_at, updated_at`,
		req.Title, req.Price, req.AvailableQuantity,
	).Scan(&product.ID, &product.Title, &product.Price, &product.AvailableQuantity, &product.Reserved, &product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		dbSpan.RecordError(err)
		dbSpan.SetStatus(codes.Error, "database insertion failed")
		dbSpan.End()

		http.Error(w, "Failed to create product", http.StatusInternalServerError)
		return
	}

	dbSpan.SetAttributes(attribute.String("product.id", product.ID))
	dbSpan.SetStatus(codes.Ok, "product created")
	dbSpan.End()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(product)
}

// GetAllProducts retrieves all products
func (h *InventoryHandler) GetAllProducts(w http.ResponseWriter, r *http.Request) {
	tracer := otel.Tracer("inventory-service")

	ctx, dbSpan := tracer.Start(r.Context(), "GetAllProducts.DatabaseQuery")
	dbSpan.SetAttributes(
		attribute.String("db.system", "postgresql"),
		attribute.String("db.operation", "SELECT"),
		attribute.String("db.table", "products"),
	)

	rows, err := h.db.Query(
		ctx,
		`SELECT id, title, price, available_quantity, reserved, created_at, updated_at
		 FROM products
		 ORDER BY created_at DESC`,
	)
	if err != nil {
		dbSpan.RecordError(err)
		dbSpan.SetStatus(codes.Error, "database query failed")
		dbSpan.End()

		http.Error(w, "Failed to retrieve products", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var product Product
		err := rows.Scan(&product.ID, &product.Title, &product.Price, &product.AvailableQuantity, &product.Reserved, &product.CreatedAt, &product.UpdatedAt)
		if err != nil {
			dbSpan.RecordError(err)
			dbSpan.SetStatus(codes.Error, "row scan failed")
			dbSpan.End()

			http.Error(w, "Failed to scan products", http.StatusInternalServerError)
			return
		}
		products = append(products, product)
	}

	dbSpan.SetAttributes(attribute.Int("products.count", len(products)))
	dbSpan.SetStatus(codes.Ok, "products retrieved")
	dbSpan.End()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// GetProduct retrieves a single product by ID
func (h *InventoryHandler) GetProduct(w http.ResponseWriter, r *http.Request) {
	tracer := otel.Tracer("inventory-service")

	productID := chi.URLParam(r, "id")
	if productID == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	ctx, dbSpan := tracer.Start(r.Context(), "GetProduct.DatabaseQuery")
	dbSpan.SetAttributes(
		attribute.String("db.system", "postgresql"),
		attribute.String("db.operation", "SELECT"),
		attribute.String("db.table", "products"),
		attribute.String("product.id", productID),
	)

	var product Product
	err := h.db.QueryRow(
		ctx,
		`SELECT id, title, price, available_quantity, reserved, created_at, updated_at
		 FROM products
		 WHERE id = $1`,
		productID,
	).Scan(&product.ID, &product.Title, &product.Price, &product.AvailableQuantity, &product.Reserved, &product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		dbSpan.RecordError(err)
		dbSpan.SetStatus(codes.Error, "product not found")
		dbSpan.End()

		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	dbSpan.SetStatus(codes.Ok, "product retrieved")
	dbSpan.End()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

// UpdateProduct updates a product
func (h *InventoryHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	tracer := otel.Tracer("inventory-service")

	productID := chi.URLParam(r, "id")
	if productID == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	ctx, validateSpan := tracer.Start(r.Context(), "UpdateProduct.ValidateInput")

	var req UpdateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		validateSpan.RecordError(err)
		validateSpan.SetStatus(codes.Error, "invalid request body")
		validateSpan.End()

		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	validateSpan.SetStatus(codes.Ok, "validation passed")
	validateSpan.End()

	ctx, dbSpan := tracer.Start(ctx, "UpdateProduct.DatabaseUpdate")
	dbSpan.SetAttributes(
		attribute.String("db.system", "postgresql"),
		attribute.String("db.operation", "UPDATE"),
		attribute.String("db.table", "products"),
		attribute.String("product.id", productID),
	)

	var product Product
	err := h.db.QueryRow(
		ctx,
		`UPDATE products
		 SET title = COALESCE(NULLIF($1, ''), title),
		     price = COALESCE(NULLIF($2, 0), price),
		     available_quantity = COALESCE(NULLIF($3, -1), available_quantity),
		     updated_at = NOW()
		 WHERE id = $4
		 RETURNING id, title, price, available_quantity, reserved, created_at, updated_at`,
		req.Title, req.Price, req.AvailableQuantity, productID,
	).Scan(&product.ID, &product.Title, &product.Price, &product.AvailableQuantity, &product.Reserved, &product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		dbSpan.RecordError(err)
		dbSpan.SetStatus(codes.Error, "database update failed")
		dbSpan.End()

		http.Error(w, "Failed to update product", http.StatusInternalServerError)
		return
	}

	dbSpan.SetStatus(codes.Ok, "product updated")
	dbSpan.End()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

// DeleteProduct deletes a product
func (h *InventoryHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	tracer := otel.Tracer("inventory-service")

	productID := chi.URLParam(r, "id")
	if productID == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	ctx, dbSpan := tracer.Start(r.Context(), "DeleteProduct.DatabaseDelete")
	dbSpan.SetAttributes(
		attribute.String("db.system", "postgresql"),
		attribute.String("db.operation", "DELETE"),
		attribute.String("db.table", "products"),
		attribute.String("product.id", productID),
	)

	result, err := h.db.Exec(
		ctx,
		`DELETE FROM products WHERE id = $1`,
		productID,
	)

	if err != nil {
		dbSpan.RecordError(err)
		dbSpan.SetStatus(codes.Error, "database delete failed")
		dbSpan.End()

		http.Error(w, "Failed to delete product", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		dbSpan.SetStatus(codes.Error, "product not found")
		dbSpan.End()

		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	dbSpan.SetStatus(codes.Ok, "product deleted")
	dbSpan.End()

	w.WriteHeader(http.StatusNoContent)
}

// ReserveProduct reserves a quantity of a product
func (h *InventoryHandler) ReserveProduct(w http.ResponseWriter, r *http.Request) {
	tracer := otel.Tracer("inventory-service")

	productID := chi.URLParam(r, "id")
	if productID == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	ctx, validateSpan := tracer.Start(r.Context(), "ReserveProduct.ValidateInput")

	var req ReserveProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		validateSpan.RecordError(err)
		validateSpan.SetStatus(codes.Error, "invalid request body")
		validateSpan.End()

		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Quantity <= 0 {
		validateSpan.SetStatus(codes.Error, "invalid quantity")
		validateSpan.End()

		http.Error(w, "Quantity must be greater than 0", http.StatusBadRequest)
		return
	}

	validateSpan.SetStatus(codes.Ok, "validation passed")
	validateSpan.End()

	ctx, dbSpan := tracer.Start(ctx, "ReserveProduct.DatabaseUpdate")
	dbSpan.SetAttributes(
		attribute.String("db.system", "postgresql"),
		attribute.String("db.operation", "UPDATE"),
		attribute.String("db.table", "products"),
		attribute.String("product.id", productID),
		attribute.Int("quantity", req.Quantity),
	)

	var product Product
	err := h.db.QueryRow(
		ctx,
		`UPDATE products
		 SET reserved = reserved + $1,
		     available_quantity = available_quantity - $1,
		     updated_at = NOW()
		 WHERE id = $2 AND available_quantity >= $1
		 RETURNING id, title, price, available_quantity, reserved, created_at, updated_at`,
		req.Quantity, productID,
	).Scan(&product.ID, &product.Title, &product.Price, &product.AvailableQuantity, &product.Reserved, &product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		dbSpan.RecordError(err)
		dbSpan.SetStatus(codes.Error, "insufficient quantity or product not found")
		dbSpan.End()

		http.Error(w, "Insufficient quantity or product not found", http.StatusBadRequest)
		return
	}

	dbSpan.SetStatus(codes.Ok, "product reserved")
	dbSpan.End()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

// ReleaseProduct releases a reserved quantity of a product
func (h *InventoryHandler) ReleaseProduct(w http.ResponseWriter, r *http.Request) {
	tracer := otel.Tracer("inventory-service")

	productID := chi.URLParam(r, "id")
	if productID == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	ctx, validateSpan := tracer.Start(r.Context(), "ReleaseProduct.ValidateInput")

	var req ReserveProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		validateSpan.RecordError(err)
		validateSpan.SetStatus(codes.Error, "invalid request body")
		validateSpan.End()

		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Quantity <= 0 {
		validateSpan.SetStatus(codes.Error, "invalid quantity")
		validateSpan.End()

		http.Error(w, "Quantity must be greater than 0", http.StatusBadRequest)
		return
	}

	validateSpan.SetStatus(codes.Ok, "validation passed")
	validateSpan.End()

	ctx, dbSpan := tracer.Start(ctx, "ReleaseProduct.DatabaseUpdate")
	dbSpan.SetAttributes(
		attribute.String("db.system", "postgresql"),
		attribute.String("db.operation", "UPDATE"),
		attribute.String("db.table", "products"),
		attribute.String("product.id", productID),
		attribute.Int("quantity", req.Quantity),
	)

	var product Product
	err := h.db.QueryRow(
		ctx,
		`UPDATE products
		 SET reserved = reserved - $1,
		     available_quantity = available_quantity + $1,
		     updated_at = NOW()
		 WHERE id = $2 AND reserved >= $1
		 RETURNING id, title, price, available_quantity, reserved, created_at, updated_at`,
		req.Quantity, productID,
	).Scan(&product.ID, &product.Title, &product.Price, &product.AvailableQuantity, &product.Reserved, &product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		dbSpan.RecordError(err)
		dbSpan.SetStatus(codes.Error, "insufficient reserved quantity or product not found")
		dbSpan.End()

		http.Error(w, "Insufficient reserved quantity or product not found", http.StatusBadRequest)
		return
	}

	dbSpan.SetStatus(codes.Ok, "product released")
	dbSpan.End()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}
