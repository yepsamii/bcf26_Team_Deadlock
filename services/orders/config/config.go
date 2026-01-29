package config

import (
	"os"

	_ "github.com/joho/godotenv/autoload"
)

type Config struct {
	DB   PostgresConfig
	Port string
}

type PostgresConfig struct {
	DBString string
}

func LoadConfig() (*Config, error) {
	return &Config{
		Port: os.Getenv("PORT"),
		DB: PostgresConfig{
			DBString: os.Getenv("DBSTRING"),
		},
	}, nil
}
