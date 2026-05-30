package entity

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID
	Email        string
	PasswordHash string
	Name         string
	AccountType  string // 'personal' | 'business'
	IsBusiness   bool
	IsVerified   bool
	BusinessName string
	BusinessType string
	Telegram     string
	WhatsApp     string
	Instagram    string
	Bio          string
	AvatarURL    string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

const (
	AccountPersonal = "personal"
	AccountBusiness = "business"
)
