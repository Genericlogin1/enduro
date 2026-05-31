package handler

import (
	"context"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"enduro/internal/ride/dto"
	"enduro/internal/ride/entity"
	"enduro/pkg/middleware"
	"enduro/pkg/response"
)

type RideUC interface {
	Create(ctx context.Context, organizerID uuid.UUID, req *entity.Ride) (*entity.Ride, error)
	List(ctx context.Context, userID *uuid.UUID) ([]*entity.Ride, error)
	GetByID(ctx context.Context, id uuid.UUID, userID *uuid.UUID) (*entity.Ride, error)
	Join(ctx context.Context, rideID, userID uuid.UUID) error
	Leave(ctx context.Context, rideID, userID uuid.UUID) error
	Participants(ctx context.Context, rideID uuid.UUID) ([]*entity.Participant, error)
	Delete(ctx context.Context, id, organizerID uuid.UUID) error
}

type RideHandler struct {
	uc RideUC
}

func NewRideHandler(uc RideUC) *RideHandler {
	return &RideHandler{uc: uc}
}

func (h *RideHandler) Create(c *fiber.Ctx) error {
	userID, _ := middleware.UserIDFromCtx(c)
	var req dto.CreateRideRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	if req.Title == "" || req.Location == "" || req.RideDate.IsZero() {
		return response.Error(c, &fiber.Error{Code: 422, Message: "title, location and ride_date are required"})
	}
	ride := &entity.Ride{
		Title: req.Title, Description: req.Description, Location: req.Location,
		RideDate: req.RideDate, RouteID: req.RouteID, MaxParticipants: req.MaxParticipants,
	}
	created, err := h.uc.Create(c.Context(), userID, ride)
	if err != nil {
		return response.Error(c, err)
	}
	return c.Status(201).JSON(dto.ToRideResponse(created))
}

func (h *RideHandler) List(c *fiber.Ctx) error {
	uid, ok := middleware.UserIDFromCtx(c)
	var uidPtr *uuid.UUID
	if ok {
		uidPtr = &uid
	}
	rides, err := h.uc.List(c.Context(), uidPtr)
	if err != nil {
		return response.Error(c, err)
	}
	out := make([]dto.RideResponse, 0, len(rides))
	for _, r := range rides {
		out = append(out, dto.ToRideResponse(r))
	}
	return c.JSON(fiber.Map{"rides": out})
}

func (h *RideHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	uid, ok := middleware.UserIDFromCtx(c)
	var uidPtr *uuid.UUID
	if ok {
		uidPtr = &uid
	}
	ride, err := h.uc.GetByID(c.Context(), id, uidPtr)
	if errors.Is(err, entity.ErrNotFound) {
		return response.Error(c, fiber.ErrNotFound)
	}
	if err != nil {
		return response.Error(c, err)
	}
	return c.JSON(dto.ToRideResponse(ride))
}

func (h *RideHandler) Join(c *fiber.Ctx) error {
	userID, _ := middleware.UserIDFromCtx(c)
	rideID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	if err := h.uc.Join(c.Context(), rideID, userID); err != nil {
		if errors.Is(err, entity.ErrAlreadyJoined) {
			return response.Error(c, &fiber.Error{Code: 409, Message: "already joined"})
		}
		if errors.Is(err, entity.ErrFull) {
			return response.Error(c, &fiber.Error{Code: 409, Message: "ride is full"})
		}
		return response.Error(c, err)
	}
	return c.JSON(fiber.Map{"ok": true})
}

func (h *RideHandler) Leave(c *fiber.Ctx) error {
	userID, _ := middleware.UserIDFromCtx(c)
	rideID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	if err := h.uc.Leave(c.Context(), rideID, userID); err != nil {
		return response.Error(c, err)
	}
	return c.JSON(fiber.Map{"ok": true})
}

func (h *RideHandler) Participants(c *fiber.Ctx) error {
	rideID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	parts, err := h.uc.Participants(c.Context(), rideID)
	if err != nil {
		return response.Error(c, err)
	}
	out := make([]dto.ParticipantResponse, 0, len(parts))
	for _, p := range parts {
		out = append(out, dto.ParticipantResponse{UserID: p.UserID, UserName: p.UserName, JoinedAt: p.JoinedAt})
	}
	return c.JSON(fiber.Map{"participants": out})
}

func (h *RideHandler) Delete(c *fiber.Ctx) error {
	userID, _ := middleware.UserIDFromCtx(c)
	rideID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	if err := h.uc.Delete(c.Context(), rideID, userID); err != nil {
		if errors.Is(err, entity.ErrNotFound) {
			return response.Error(c, fiber.ErrNotFound)
		}
		return response.Error(c, err)
	}
	return c.SendStatus(204)
}
