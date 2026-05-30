package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"enduro/internal/report/dto"
	"enduro/internal/report/usecase"
	"enduro/pkg/middleware"
	"enduro/pkg/response"
)

type ReportHandler struct{ uc usecase.ReportUsecase }

func NewReportHandler(uc usecase.ReportUsecase) *ReportHandler { return &ReportHandler{uc: uc} }

func (h *ReportHandler) Create(c *fiber.Ctx) error {
	callerID, _ := middleware.UserIDFromCtx(c)
	var req dto.CreateReportRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	resp, err := h.uc.Create(c.UserContext(), callerID, req)
	if err != nil { return response.Error(c, err) }
	return response.Created(c, resp)
}

func (h *ReportHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil { return response.Error(c, fiber.ErrBadRequest) }
	callerID, _ := middleware.UserIDFromCtx(c)
	resp, err := h.uc.GetByID(c.UserContext(), id, callerID)
	if err != nil { return response.Error(c, err) }
	return response.OK(c, resp)
}

func (h *ReportHandler) List(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	offset := c.QueryInt("offset", 0)
	callerID, _ := middleware.UserIDFromCtx(c)

	if authorIDStr := c.Query("author_id"); authorIDStr != "" {
		authorID, err := uuid.Parse(authorIDStr)
		if err != nil { return response.Error(c, fiber.ErrBadRequest) }
		resp, err := h.uc.ListByAuthor(c.UserContext(), authorID, limit, offset, callerID)
		if err != nil { return response.Error(c, err) }
		return response.OK(c, fiber.Map{"reports": resp})
	}

	resp, err := h.uc.List(c.UserContext(), limit, offset, callerID)
	if err != nil { return response.Error(c, err) }
	return response.OK(c, fiber.Map{"reports": resp})
}

func (h *ReportHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil { return response.Error(c, fiber.ErrBadRequest) }
	callerID, _ := middleware.UserIDFromCtx(c)
	var req dto.UpdateReportRequest
	if err := c.BodyParser(&req); err != nil { return response.Error(c, fiber.ErrBadRequest) }
	resp, err := h.uc.Update(c.UserContext(), id, callerID, req)
	if err != nil { return response.Error(c, err) }
	return response.OK(c, resp)
}

func (h *ReportHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil { return response.Error(c, fiber.ErrBadRequest) }
	callerID, _ := middleware.UserIDFromCtx(c)
	if err := h.uc.Delete(c.UserContext(), id, callerID); err != nil {
		return response.Error(c, err)
	}
	return response.NoContent(c)
}

func (h *ReportHandler) ToggleLike(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil { return response.Error(c, fiber.ErrBadRequest) }
	callerID, _ := middleware.UserIDFromCtx(c)
	if err := h.uc.ToggleLike(c.UserContext(), id, callerID); err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, fiber.Map{"ok": true})
}
