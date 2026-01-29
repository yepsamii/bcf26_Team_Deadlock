package config

import (
	"os"
	"strconv"

	_ "github.com/joho/godotenv/autoload"
)

type Config struct {
	DB                  PostgresConfig
	Port                string
	InventoryServiceURL string
	Resilience          ResilienceConfig
}

type PostgresConfig struct {
	DBString string
}

// ResilienceConfig holds circuit breaker and timeout settings
type ResilienceConfig struct {
	TimeoutSeconds        int // Request timeout (default: 3)
	CircuitMaxFailures    int // Max failures before circuit opens (default: 5)
	CircuitTimeoutSeconds int // Time before circuit transitions to half-open (default: 30)
}

func LoadConfig() (*Config, error) {
	// Parse resilience settings with defaults
	timeoutSeconds := getEnvAsInt("RESILIENCE_TIMEOUT_SECONDS", 3)
	circuitMaxFailures := getEnvAsInt("CIRCUIT_MAX_FAILURES", 5)
	circuitTimeoutSeconds := getEnvAsInt("CIRCUIT_TIMEOUT_SECONDS", 30)

	// Get inventory service URL with default for local development
	inventoryServiceURL := os.Getenv("INVENTORY_SERVICE_URL")
	if inventoryServiceURL == "" {
		inventoryServiceURL = "http://inventory-service:5002"
	}

	return &Config{
		Port: os.Getenv("PORT"),
		DB: PostgresConfig{
			DBString: os.Getenv("DBSTRING"),
		},
		InventoryServiceURL: inventoryServiceURL,
		Resilience: ResilienceConfig{
			TimeoutSeconds:        timeoutSeconds,
			CircuitMaxFailures:    circuitMaxFailures,
			CircuitTimeoutSeconds: circuitTimeoutSeconds,
		},
	}, nil
}

// getEnvAsInt retrieves an environment variable as an integer with a default value
func getEnvAsInt(key string, defaultVal int) int {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	intVal, err := strconv.Atoi(val)
	if err != nil {
		return defaultVal
	}
	return intVal
}
