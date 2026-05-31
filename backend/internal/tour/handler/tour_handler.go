package handler

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/internal/tour/dto"
	"enduro/internal/tour/usecase"
	"enduro/pkg/middleware"
	"enduro/pkg/response"
)

type TourHandler struct {
	uc usecase.TourUsecase
	db *pgxpool.Pool
}

func NewTourHandler(uc usecase.TourUsecase, db *pgxpool.Pool) *TourHandler {
	return &TourHandler{uc: uc, db: db}
}

func (h *TourHandler) Create(c *fiber.Ctx) error {
	callerID, _ := middleware.UserIDFromCtx(c)
	var req dto.CreateTourRequest
	if err := c.BodyParser(&req); err != nil { return response.Error(c, fiber.ErrBadRequest) }
	resp, err := h.uc.Create(c.UserContext(), callerID, req)
	if err != nil { return response.Error(c, err) }
	return response.Created(c, resp)
}

func (h *TourHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil { return response.Error(c, fiber.ErrBadRequest) }
	callerID, _ := middleware.UserIDFromCtx(c)
	resp, err := h.uc.GetByID(c.UserContext(), id, callerID)
	if err != nil { return response.Error(c, err) }
	return response.OK(c, resp)
}

func (h *TourHandler) List(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	offset := c.QueryInt("offset", 0)
	callerID, _ := middleware.UserIDFromCtx(c)

	if orgStr := c.Query("organizer_id"); orgStr != "" {
		orgID, err := uuid.Parse(orgStr)
		if err != nil { return response.Error(c, fiber.ErrBadRequest) }
		resp, err := h.uc.ListByOrganizer(c.UserContext(), orgID, limit, offset, callerID)
		if err != nil { return response.Error(c, err) }
		return response.OK(c, fiber.Map{"tours": resp})
	}

	resp, err := h.uc.List(c.UserContext(), limit, offset, callerID)
	if err != nil { return response.Error(c, err) }
	return response.OK(c, fiber.Map{"tours": resp})
}

func (h *TourHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil { return response.Error(c, fiber.ErrBadRequest) }
	callerID, _ := middleware.UserIDFromCtx(c)
	var req dto.CreateTourRequest
	if err := c.BodyParser(&req); err != nil { return response.Error(c, fiber.ErrBadRequest) }
	resp, err := h.uc.Update(c.UserContext(), id, callerID, req)
	if err != nil { return response.Error(c, err) }
	return response.OK(c, resp)
}

func (h *TourHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil { return response.Error(c, fiber.ErrBadRequest) }
	callerID, _ := middleware.UserIDFromCtx(c)
	if err := h.uc.Delete(c.UserContext(), id, callerID); err != nil { return response.Error(c, err) }
	return response.NoContent(c)
}

func (h *TourHandler) Register(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil { return response.Error(c, fiber.ErrBadRequest) }
	callerID, _ := middleware.UserIDFromCtx(c)
	registered, err := h.uc.ToggleRegister(c.UserContext(), id, callerID)
	if err != nil { return response.Error(c, err) }
	return response.OK(c, fiber.Map{"registered": registered})
}

// BookTour submits a booking request for a tour (no payment, just a lead form).
func (h *TourHandler) BookTour(c *fiber.Ctx) error {
	tourID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	var req struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		Phone       string `json:"phone"`
		Message     string `json:"message"`
		Seats       int    `json:"seats"`
		DesiredDate string `json:"desired_date"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	if req.Name == "" || req.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fiber.Map{"code": "VALIDATION", "message": "name and email are required"},
		})
	}
	if req.Seats < 1 {
		req.Seats = 1
	}

	var userID *uuid.UUID
	if id, ok := middleware.UserIDFromCtx(c); ok {
		userID = &id
	}

	var bookingID string
	err = h.db.QueryRow(c.UserContext(),
		`INSERT INTO tour_bookings (tour_id, user_id, name, email, phone, message, seats, desired_date)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
		tourID, userID, req.Name, req.Email, req.Phone, req.Message, req.Seats, req.DesiredDate,
	).Scan(&bookingID)
	if err != nil {
		return response.Error(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"id":      bookingID,
		"status":  "pending",
		"message": "Заявка отправлена организатору",
	})
}

// ListBookings returns booking requests for tours owned by the authenticated organizer.
func (h *TourHandler) ListBookings(c *fiber.Ctx) error {
	callerID, ok := middleware.UserIDFromCtx(c)
	if !ok {
		return response.Error(c, fiber.ErrUnauthorized)
	}

	rows, err := h.db.Query(c.UserContext(),
		`SELECT b.id, b.tour_id, t.title, b.name, b.email, b.phone, b.message,
		        b.seats, b.desired_date, b.status, b.created_at
		 FROM tour_bookings b
		 JOIN tours t ON t.id = b.tour_id
		 WHERE t.organizer_id = $1
		 ORDER BY b.created_at DESC
		 LIMIT 100`,
		callerID,
	)
	if err != nil {
		return response.Error(c, err)
	}
	defer rows.Close()

	type Booking struct {
		ID          string  `json:"id"`
		TourID      string  `json:"tour_id"`
		TourTitle   string  `json:"tour_title"`
		Name        string  `json:"name"`
		Email       string  `json:"email"`
		Phone       string  `json:"phone"`
		Message     string  `json:"message"`
		Seats       int     `json:"seats"`
		DesiredDate string  `json:"desired_date"`
		Status      string  `json:"status"`
		CreatedAt   string  `json:"created_at"`
	}

	var bookings []Booking
	for rows.Next() {
		var b Booking
		var phone, message, desiredDate *string
		var createdAt interface{}
		if err := rows.Scan(&b.ID, &b.TourID, &b.TourTitle, &b.Name, &b.Email,
			&phone, &message, &b.Seats, &desiredDate, &b.Status, &createdAt); err != nil {
			continue
		}
		if phone != nil { b.Phone = *phone }
		if message != nil { b.Message = *message }
		if desiredDate != nil { b.DesiredDate = *desiredDate }
		b.CreatedAt = fmt.Sprintf("%v", createdAt)
		bookings = append(bookings, b)
	}
	if bookings == nil {
		bookings = []Booking{}
	}
	return response.OK(c, fiber.Map{"bookings": bookings})
}
