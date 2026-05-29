package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/Genericlogin1/enduro/backend/internal/domain"
	"github.com/Genericlogin1/enduro/backend/internal/user"
)

// UserRepository interface needed by auth usecase
type UserRepository interface {
	GetByEmail(ctx context.Context, email string) (*user.User, error)
	Create(ctx context.Context, u *user.User) error
}

// Claims represents JWT claims
type Claims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}

// UseCase handles authentication logic
type UseCase struct {
	userRepo     UserRepository
	jwtSecret    string
	accessTTL    time.Duration
}

func NewUseCase(userRepo UserRepository, jwtSecret string, accessTTL time.Duration) *UseCase {
	return &UseCase{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
		accessTTL: accessTTL,
	}
}

// RegisterInput for new user registration
type RegisterInput struct {
	Email    string
	Password string
	Name     string
}

// LoginInput for user login
type LoginInput struct {
	Email    string
	Password string
}

// AuthResult returned after successful auth
type AuthResult struct {
	AccessToken string
	User        *user.User
}

func (uc *UseCase) Register(ctx context.Context, input RegisterInput) (*AuthResult, error) {
	if input.Email == "" {
		return nil, domain.NewInvalidInput("email is required")
	}
	if len(input.Password) < 8 {
		return nil, domain.NewInvalidInput("password must be at least 8 characters")
	}
	if input.Name == "" {
		return nil, domain.NewInvalidInput("name is required")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	now := time.Now().UTC()
	u := &user.User{
		ID:           uuid.New(),
		Email:        input.Email,
		PasswordHash: string(hash),
		Name:         input.Name,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := uc.userRepo.Create(ctx, u); err != nil {
		return nil, err
	}

	token, err := uc.generateToken(u.ID.String())
	if err != nil {
		return nil, err
	}

	return &AuthResult{AccessToken: token, User: u}, nil
}

func (uc *UseCase) Login(ctx context.Context, input LoginInput) (*AuthResult, error) {
	if input.Email == "" || input.Password == "" {
		return nil, domain.NewInvalidInput("email and password are required")
	}

	u, err := uc.userRepo.GetByEmail(ctx, input.Email)
	if err != nil {
		// Return unauthorized for not found (don't leak user existence)
		return nil, domain.NewUnauthorized("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(input.Password)); err != nil {
		return nil, domain.NewUnauthorized("invalid credentials")
	}

	token, err := uc.generateToken(u.ID.String())
	if err != nil {
		return nil, err
	}

	return &AuthResult{AccessToken: token, User: u}, nil
}

func (uc *UseCase) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(uc.jwtSecret), nil
	})
	if err != nil {
		return nil, domain.NewUnauthorized("invalid token")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, domain.NewUnauthorized("invalid token")
	}

	return claims, nil
}

func (uc *UseCase) generateToken(userID string) (string, error) {
	now := time.Now()
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(uc.accessTTL)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(uc.jwtSecret))
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}

	return signed, nil
}
