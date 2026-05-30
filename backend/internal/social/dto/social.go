package dto

import (
	"time"

	"github.com/google/uuid"

	"enduro/internal/social/entity"
)

type CreateCommentRequest struct {
	Content string `json:"content"`
}

type CommentResponse struct {
	ID         uuid.UUID `json:"id"`
	PostID     uuid.UUID `json:"post_id"`
	AuthorID   uuid.UUID `json:"author_id"`
	AuthorName string    `json:"author_name"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
}

func ToCommentResponse(c *entity.Comment) CommentResponse {
	return CommentResponse{
		ID: c.ID, PostID: c.PostID, AuthorID: c.AuthorID,
		AuthorName: c.AuthorName, Content: c.Content, CreatedAt: c.CreatedAt,
	}
}
