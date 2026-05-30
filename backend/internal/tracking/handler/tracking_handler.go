package handler

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"

	"enduro/internal/tracking/dto"
	"enduro/internal/tracking/usecase"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/middleware"
	"enduro/pkg/response"
)

type TrackingHandler struct {
	uc         usecase.TrackingUsecase
	jwtManager *jwtutil.Manager
	log        *slog.Logger
}

func NewTrackingHandler(uc usecase.TrackingUsecase, jwtManager *jwtutil.Manager, log *slog.Logger) *TrackingHandler {
	return &TrackingHandler{uc: uc, jwtManager: jwtManager, log: log}
}

func (h *TrackingHandler) StartSession(c *fiber.Ctx) error {
	callerID, _ := middleware.UserIDFromCtx(c)
	var req dto.StartSessionRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	resp, err := h.uc.StartSession(c.UserContext(), callerID, req)
	if err != nil {
		return response.Error(c, err)
	}
	return response.Created(c, resp)
}

func (h *TrackingHandler) FinishSession(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	callerID, _ := middleware.UserIDFromCtx(c)
	resp, err := h.uc.FinishSession(c.UserContext(), id, callerID)
	if err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, resp)
}

func (h *TrackingHandler) GetSession(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	callerID, _ := middleware.UserIDFromCtx(c)
	resp, err := h.uc.GetSession(c.UserContext(), id, callerID)
	if err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, resp)
}

// AddPoints accepts a batch of GPS points via REST (fallback for WebSocket).
func (h *TrackingHandler) AddPoints(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	var points []dto.TrackPointInput
	if err := c.BodyParser(&points); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	saved := 0
	for _, p := range points {
		p.SessionID = id
		if _, err := h.uc.AddPoint(c.UserContext(), p); err == nil {
			saved++
		}
	}
	return response.OK(c, fiber.Map{"saved": saved})
}

// WSUpgrade authenticates via ?token= query param and upgrades to WebSocket.
func (h *TrackingHandler) WSUpgrade(c *fiber.Ctx) error {
	if !websocket.IsWebSocketUpgrade(c) {
		return fiber.ErrUpgradeRequired
	}
	tokenStr := c.Query("token")
	if tokenStr == "" {
		return fiber.ErrUnauthorized
	}
	claims, err := h.jwtManager.Parse(tokenStr)
	if err != nil {
		return fiber.ErrUnauthorized
	}
	c.Locals(middleware.LocalsUserID, claims.UserID)
	return c.Next()
}

// WSHandler streams live GPS points from client and saves them to DB.
func (h *TrackingHandler) WSHandler() fiber.Handler {
	type wsResponse struct {
		Saved   bool      `json:"saved"`
		PointID uuid.UUID `json:"point_id,omitempty"`
		Error   string    `json:"error,omitempty"`
	}

	return websocket.New(func(conn *websocket.Conn) {
		userID, _ := conn.Locals(middleware.LocalsUserID).(uuid.UUID)
		h.log.Info("ws tracking connected", "user_id", userID)
		defer h.log.Info("ws tracking disconnected", "user_id", userID)

		ctx := context.Background()

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				break
			}
			var inp dto.TrackPointInput
			if err := json.Unmarshal(msg, &inp); err != nil {
				_ = conn.WriteJSON(wsResponse{Saved: false, Error: "invalid json"})
				continue
			}
			pointResp, err := h.uc.AddPoint(ctx, inp)
			if err != nil {
				_ = conn.WriteJSON(wsResponse{Saved: false, Error: err.Error()})
				continue
			}
			_ = conn.WriteJSON(wsResponse{Saved: true, PointID: pointResp.ID})
		}
	})
}
