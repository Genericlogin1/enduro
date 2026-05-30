package dto

import (
	"time"

	"github.com/google/uuid"

	"enduro/internal/user/entity"
)

type CreateUserRequest struct {
	Email        string `json:"email"`
	Password     string `json:"password"`
	Name         string `json:"name"`
	AccountType  string `json:"account_type"` // 'personal' | 'business'
	BusinessName string `json:"business_name"`
	BusinessType string `json:"business_type"`
	Telegram     string `json:"telegram"`
}

type UpdateUserRequest struct {
	Name         *string `json:"name"`
	Email        *string `json:"email"`
	AccountType  *string `json:"account_type"`
	BusinessName *string `json:"business_name"`
	BusinessType *string `json:"business_type"`
	Telegram     *string `json:"telegram"`
	WhatsApp     *string `json:"whatsapp"`
	Instagram    *string `json:"instagram"`
	Bio          *string `json:"bio"`
	AvatarURL    *string `json:"avatar_url"`
}

type UserResponse struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	AccountType  string    `json:"account_type"`
	IsBusiness   bool      `json:"is_business"`
	IsVerified   bool      `json:"is_verified"`
	BusinessName string    `json:"business_name,omitempty"`
	BusinessType string    `json:"business_type,omitempty"`
	Telegram     string    `json:"telegram,omitempty"`
	WhatsApp     string    `json:"whatsapp,omitempty"`
	Instagram    string    `json:"instagram,omitempty"`
	Bio          string    `json:"bio,omitempty"`
	AvatarURL    string    `json:"avatar_url,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func ToUserResponse(u *entity.User) UserResponse {
	return UserResponse{
		ID:           u.ID,
		Email:        u.Email,
		Name:         u.Name,
		AccountType:  u.AccountType,
		IsBusiness:   u.IsBusiness,
		IsVerified:   u.IsVerified,
		BusinessName: u.BusinessName,
		BusinessType: u.BusinessType,
		Telegram:     u.Telegram,
		WhatsApp:     u.WhatsApp,
		Instagram:    u.Instagram,
		Bio:          u.Bio,
		AvatarURL:    u.AvatarURL,
		CreatedAt:    u.CreatedAt,
		UpdatedAt:    u.UpdatedAt,
	}
}
