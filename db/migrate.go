package main

import (
	"fmt"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run migrate.go <command>")
		fmt.Println("Commands: up, down, version")
		fmt.Println("Set DBSTRING environment variable for database connection")
		os.Exit(1)
	}

	dbURL := os.Getenv("DBSTRING")
	if dbURL == "" {
		log.Fatal("DBSTRING environment variable is required")
	}

	m, err := migrate.New("file://migrations", dbURL)
	if err != nil {
		log.Fatalf("Failed to create migrate instance: %v", err)
	}
	defer m.Close()

	cmd := os.Args[1]

	switch cmd {
	case "up":
		err = m.Up()
		if err != nil && err != migrate.ErrNoChange {
			log.Fatalf("Migration up failed: %v", err)
		}
		fmt.Println("Migration up completed")

	case "down":
		err = m.Down()
		if err != nil && err != migrate.ErrNoChange {
			log.Fatalf("Migration down failed: %v", err)
		}
		fmt.Println("Migration down completed")

	case "version":
		version, dirty, err := m.Version()
		if err != nil {
			log.Fatalf("Failed to get version: %v", err)
		}
		fmt.Printf("Version: %d, Dirty: %v\n", version, dirty)

	default:
		fmt.Println("Unknown command. Use: up, down, version")
		os.Exit(1)
	}
}
