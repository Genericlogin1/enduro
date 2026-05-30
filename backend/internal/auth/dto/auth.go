package dto

import "enduro/internal/user/dto"

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	AccessToken string          `json:"access_token"`
	User        dto.UserResponse `json:"user"`
}
