package dto

import "enduro/internal/user/dto"

type RegisterRequest struct {
	Email        string `json:"email"`
	Password     string `json:"password"`
	Name         string `json:"name"`
	AccountType  string `json:"account_type"` // 'personal' | 'business'
	BusinessName string `json:"business_name"`
	BusinessType string `json:"business_type"`
	Telegram     string `json:"telegram"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	AccessToken string          `json:"access_token"`
	User        dto.UserResponse `json:"user"`
}
