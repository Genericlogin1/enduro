package handler

import (
	"context"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/pkg/response"
)

type BikeBrand struct {
	ID      uuid.UUID `json:"id"`
	Name    string    `json:"name"`
	Country string    `json:"country"`
}

type BikeModel struct {
	ID       uuid.UUID `json:"id"`
	BrandID  uuid.UUID `json:"brand_id"`
	Brand    string    `json:"brand"`
	Model    string    `json:"model"`
	BikeType string    `json:"bike_type"`
	EngineCc int       `json:"engine_cc"`
	YearFrom int       `json:"year_from"`
}

type BikeCatalogHandler struct {
	pool *pgxpool.Pool
}

func NewBikeCatalogHandler(pool *pgxpool.Pool) *BikeCatalogHandler {
	return &BikeCatalogHandler{pool: pool}
}

func (h *BikeCatalogHandler) ListBrands(c *fiber.Ctx) error {
	rows, err := h.pool.Query(context.Background(),
		`SELECT id, name, country FROM bike_brands ORDER BY name`)
	if err != nil {
		return response.Error(c, err)
	}
	defer rows.Close()
	var brands []BikeBrand
	for rows.Next() {
		var b BikeBrand
		if err := rows.Scan(&b.ID, &b.Name, &b.Country); err != nil {
			return response.Error(c, err)
		}
		brands = append(brands, b)
	}
	if brands == nil {
		brands = []BikeBrand{}
	}
	return response.OK(c, fiber.Map{"brands": brands})
}

func (h *BikeCatalogHandler) ListModels(c *fiber.Ctx) error {
	q := `SELECT bm.id, bm.brand_id, bb.name, bm.model, bm.bike_type, bm.engine_cc, bm.year_from
	      FROM bike_models bm JOIN bike_brands bb ON bb.id = bm.brand_id`
	args := []any{}
	argN := 1

	brand := c.Query("brand")
	bikeType := c.Query("type")
	search := c.Query("q")

	if brand != "" {
		q += ` WHERE bb.name ILIKE $` + itoa(argN)
		args = append(args, "%"+brand+"%")
		argN++
	}
	if bikeType != "" {
		if len(args) > 0 {
			q += ` AND`
		} else {
			q += ` WHERE`
		}
		q += ` bm.bike_type = $` + itoa(argN)
		args = append(args, bikeType)
		argN++
	}
	if search != "" {
		if len(args) > 0 {
			q += ` AND`
		} else {
			q += ` WHERE`
		}
		q += ` (bb.name ILIKE $` + itoa(argN) + ` OR bm.model ILIKE $` + itoa(argN) + `)`
		args = append(args, "%"+search+"%")
		argN++
	}

	q += ` ORDER BY bb.name, bm.model LIMIT 200`

	rows, err := h.pool.Query(context.Background(), q, args...)
	if err != nil {
		return response.Error(c, err)
	}
	defer rows.Close()
	var models []BikeModel
	for rows.Next() {
		var m BikeModel
		if err := rows.Scan(&m.ID, &m.BrandID, &m.Brand, &m.Model, &m.BikeType, &m.EngineCc, &m.YearFrom); err != nil {
			return response.Error(c, err)
		}
		models = append(models, m)
	}
	if models == nil {
		models = []BikeModel{}
	}
	return response.OK(c, fiber.Map{"models": models})
}

func itoa(n int) string { return strconv.Itoa(n) }
