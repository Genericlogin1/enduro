package user

// UserPublic is a safe public representation of a user (no password hash)
type UserPublic struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Bio       string `json:"bio"`
	AvatarURL string `json:"avatar_url"`
	CreatedAt string `json:"created_at"`
}

// ToPublic converts User entity to public DTO
func ToPublic(u *User) *UserPublic {
	if u == nil {
		return nil
	}
	return &UserPublic{
		ID:        u.ID.String(),
		Email:     u.Email,
		Name:      u.Name,
		Bio:       u.Bio,
		AvatarURL: u.AvatarURL,
		CreatedAt: u.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}
