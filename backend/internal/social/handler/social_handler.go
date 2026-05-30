package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"enduro/internal/social/dto"
	"enduro/internal/social/usecase"
	"enduro/pkg/middleware"
	"enduro/pkg/response"
)

type SocialHandler struct {
	uc usecase.SocialUsecase
}

func NewSocialHandler(uc usecase.SocialUsecase) *SocialHandler {
	return &SocialHandler{uc: uc}
}

func (h *SocialHandler) Follow(c *fiber.Ctx) error {
	followingID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	callerID, _ := middleware.UserIDFromCtx(c)
	if err := h.uc.Follow(c.UserContext(), callerID, followingID); err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, fiber.Map{"ok": true})
}

func (h *SocialHandler) Unfollow(c *fiber.Ctx) error {
	followingID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	callerID, _ := middleware.UserIDFromCtx(c)
	if err := h.uc.Unfollow(c.UserContext(), callerID, followingID); err != nil {
		return response.Error(c, err)
	}
	return response.NoContent(c)
}

func (h *SocialHandler) IsFollowing(c *fiber.Ctx) error {
	followingID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	callerID, ok := middleware.UserIDFromCtx(c)
	if !ok {
		return response.OK(c, fiber.Map{"is_following": false})
	}
	result, err := h.uc.IsFollowing(c.UserContext(), callerID, followingID)
	if err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, fiber.Map{"is_following": result})
}

func (h *SocialHandler) GetFollowers(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	ids, err := h.uc.GetFollowers(c.UserContext(), userID, c.QueryInt("limit", 20), c.QueryInt("offset", 0))
	if err != nil {
		return response.Error(c, err)
	}
	if ids == nil {
		ids = []uuid.UUID{}
	}
	return response.OK(c, fiber.Map{"followers": ids})
}

func (h *SocialHandler) GetFollowing(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	ids, err := h.uc.GetFollowing(c.UserContext(), userID, c.QueryInt("limit", 20), c.QueryInt("offset", 0))
	if err != nil {
		return response.Error(c, err)
	}
	if ids == nil {
		ids = []uuid.UUID{}
	}
	return response.OK(c, fiber.Map{"following": ids})
}

func (h *SocialHandler) AddComment(c *fiber.Ctx) error {
	postID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	callerID, _ := middleware.UserIDFromCtx(c)
	var req dto.CreateCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	resp, err := h.uc.AddComment(c.UserContext(), postID, callerID, req)
	if err != nil {
		return response.Error(c, err)
	}
	return response.Created(c, resp)
}

func (h *SocialHandler) ListComments(c *fiber.Ctx) error {
	postID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	resp, err := h.uc.ListComments(c.UserContext(), postID, c.QueryInt("limit", 50), c.QueryInt("offset", 0))
	if err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, fiber.Map{"comments": resp})
}

func (h *SocialHandler) DeleteComment(c *fiber.Ctx) error {
	commentID, err := uuid.Parse(c.Params("comment_id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	callerID, _ := middleware.UserIDFromCtx(c)
	if err := h.uc.DeleteComment(c.UserContext(), commentID, callerID); err != nil {
		return response.Error(c, err)
	}
	return response.NoContent(c)
}
