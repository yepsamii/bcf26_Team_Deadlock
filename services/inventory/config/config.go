package config

import (
	"os"

	_ "github.com/joho/godotenv/autoload"
)

type Config struct {
	Logs        LogConfig
	DB          PostgresConfig
	Port        string
	CorsAllowed string
	RabbitMqURL string
}

type LogConfig struct {
	Style string
	Level string
}

type PostgresConfig struct {
	DBString string
}

func LoadConfig() (*Config, error) {
	dbString := os.Getenv("DBSTRING")
	if dbString == "" {
	}

	cfg := &Config{
		Port: os.Getenv("PORT"),
		Logs: LogConfig{
			Style: os.Getenv("LOG_STYLE"),
			Level: os.Getenv("LOG_LEVEL"),
		},
		DB: PostgresConfig{
			DBString: dbString,
		},
		CorsAllowed: os.Getenv("CORS_ALLOWED_ORIGIN"),
	}

	return cfg, nil
}
