package post

import (
	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/Genericlogin1/enduro/backend/internal/delivery/http/middleware"
)

type Handler struct {
	useCase *UseCase
	logger  *slog.Logger
}

func NewHandler(useCase *UseCase, logger *slog.Logger) *Handler {
	return &Handler{useCase: useCase, logger: logger}
}

type CreatePostRequest struct {
	Content   string `json:"content"`
	MediaURL  string `json:"media_url"`
	MediaType string `json:"media_type"`
}

type UpdatePostRequest struct {
	Content   *string `json:"content"`
	MediaURL  *string `json:"media_url"`
	MediaType *string `json:"media_type"`
}

type PostResponse struct {
	ID           string `json:"id"`
	UserID       string `json:"user_id"`
	Content      string `json:"content"`
	MediaURL     string `json:"media_url"`
	MediaType    string `json:"media_type"`
	LikesCount   int    `json:"likes_count"`
	CommentCount int    `json:"comment_count"`
	CreatedAt    string `json:"created_at"`
}

func toPostResponse(p *Post) *PostResponse {
	return &PostResponse{
		ID:           p.ID.String(),
		UserID:       p.UserID.String(),
		Content:      p.Content,
		MediaURL:     p.MediaURL,
		MediaType:    p.MediaType,
		LikesCount:   p.LikesCount,
		CommentCount: p.CommentCount,
		CreatedAt:    p.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func (h *Handler) Create(c *fiber.Ctx) error {
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "invalid user id in token")
	}

	var req CreatePostRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	p, err := h.useCase.Create(c.UserContext(), CreateInput{
		UserID:    userID,
		Content:   req.Content,
		MediaURL:  req.MediaURL,
		MediaType: req.MediaType,
	})
	if err != nil {
		return middleware.MapDomainError(err)
	}
	return c.Status(fiber.StatusCreated).JSON(toPostResponse(p))
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid post id")
	}
	p, err := h.useCase.GetByID(c.UserContext(), id)
	if err != nil {
		return middleware.MapDomainError(err)
	}
	return c.JSON(toPostResponse(p))
}

func (h *Handler) List(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	offset := c.QueryInt("offset", 0)
	posts, err := h.useCase.List(c.UserContext(), limit, offset)
	if err != nil {
		return middleware.MapDomainError(err)
	}
	resp := make([]*PostResponse, 0, len(posts))
	for _, p := range posts {
		resp = append(resp, toPostResponse(p))
	}
	return c.JSON(fiber.Map{"data": resp, "limit": limit, "offset": offset})
}

func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid post id")
	}
	userIDStr := middleware.GetUserID(c)
	userID, _ := uuid.Parse(userIDStr)

	var req UpdatePostRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	p, err := h.useCase.Update(c.UserContext(), id, userID, UpdateInput{
		Content:   req.Content,
		MediaURL:  req.MediaURL,
		MediaType: req.MediaType,
	})
	if err != nil {
		return middleware.MapDomainError(err)
	}
	return c.JSON(toPostResponse(p))
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid post id")
	}
	userIDStr := middleware.GetUserID(c)
	userID, _ := uuid.Parse(userIDStr)
	if err := h.useCase.Delete(c.UserContext(), id, userID); err != nil {
		return middleware.MapDomainError(err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) Like(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid post id")
	}
	userIDStr := middleware.GetUserID(c)
	userID, _ := uuid.Parse(userIDStr)
	if err := h.useCase.Like(c.UserContext(), id, userID); err != nil {
		return middleware.MapDomainError(err)
	}
	return c.JSON(fiber.Map{"status": "ok"})
}
