package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StatsHandler struct {
	pool *pgxpool.Pool
}

func NewStatsHandler(pool *pgxpool.Pool) *StatsHandler {
	return &StatsHandler{pool: pool}
}

type UserStats struct {
	TotalRides    int      `json:"total_rides"`
	TotalRoutes   int      `json:"total_routes"`
	TotalPosts    int      `json:"total_posts"`
	ThisYearRides int      `json:"this_year_rides"`
	TopRegions    []string `json:"top_regions"`
	JoinedAt      time.Time `json:"joined_at"`
}

func (h *StatsHandler) GetUserStats(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}

	var stats UserStats

	yearStart := time.Date(time.Now().Year(), 1, 1, 0, 0, 0, 0, time.UTC)

	// Total GPS rides + this year
	err = h.pool.QueryRow(c.Context(), `
		SELECT COUNT(*), COUNT(*) FILTER (WHERE started_at >= $2)
		FROM track_sessions WHERE user_id=$1 AND finished_at IS NOT NULL`,
		userID, yearStart,
	).Scan(&stats.TotalRides, &stats.ThisYearRides)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "db error"})
	}

	// Total routes
	_ = h.pool.QueryRow(c.Context(),
		`SELECT COUNT(*) FROM routes WHERE author_id=$1`, userID,
	).Scan(&stats.TotalRoutes)

	// Total posts
	_ = h.pool.QueryRow(c.Context(),
		`SELECT COUNT(*) FROM posts WHERE author_id=$1`, userID,
	).Scan(&stats.TotalPosts)

	// Top regions from routes
	rows, err := h.pool.Query(c.Context(), `
		SELECT country, COUNT(*) as cnt
		FROM routes WHERE author_id=$1 AND country != ''
		GROUP BY country ORDER BY cnt DESC LIMIT 3`, userID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var country string
			var cnt int
			if rows.Scan(&country, &cnt) == nil {
				stats.TopRegions = append(stats.TopRegions, country)
			}
		}
	}
	if stats.TopRegions == nil {
		stats.TopRegions = []string{}
	}

	// Joined at
	_ = h.pool.QueryRow(c.Context(),
		`SELECT created_at FROM users WHERE id=$1`, userID,
	).Scan(&stats.JoinedAt)

	return c.JSON(stats)
}
