package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ActivityHandler struct {
	pool *pgxpool.Pool
}

func NewActivityHandler(pool *pgxpool.Pool) *ActivityHandler {
	return &ActivityHandler{pool: pool}
}

type ActivityItem struct {
	Type      string     `json:"type"`
	ID        string     `json:"id"`
	Title     string     `json:"title"`
	ActorID   string     `json:"actor_id"`
	ActorName string     `json:"actor_name"`
	Meta      string     `json:"meta"`
	CreatedAt time.Time  `json:"created_at"`
}

func (h *ActivityHandler) List(c *fiber.Ctx) error {
	const q = `
(SELECT 'route'   AS type, r.id::text, r.name,
        u.id::text, u.name,
        COALESCE(r.difficulty,'') || '|' || COALESCE(r.distance_km::text,'0'),
        r.created_at
 FROM routes r JOIN users u ON u.id = r.author_id)
UNION ALL
(SELECT 'gps', ts.id::text,
        CASE WHEN ts.name = '' THEN 'GPS трек' ELSE ts.name END,
        u.id::text, u.name, '',
        ts.finished_at
 FROM track_sessions ts JOIN users u ON u.id = ts.user_id
 WHERE ts.finished_at IS NOT NULL)
UNION ALL
(SELECT 'ride', gr.id::text, gr.title,
        u.id::text, u.name,
        gr.location || '|' || gr.ride_date::text,
        gr.created_at
 FROM group_rides gr JOIN users u ON u.id = gr.organizer_id
 WHERE gr.status != 'done')
UNION ALL
(SELECT 'user', u.id::text, u.name,
        u.id::text, u.name, '',
        u.created_at
 FROM users u)
ORDER BY created_at DESC NULLS LAST
LIMIT 40`

	rows, err := h.pool.Query(c.Context(), q)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "db error"})
	}
	defer rows.Close()

	items := make([]ActivityItem, 0, 40)
	for rows.Next() {
		var it ActivityItem
		if err := rows.Scan(&it.Type, &it.ID, &it.Title, &it.ActorID, &it.ActorName, &it.Meta, &it.CreatedAt); err != nil {
			continue
		}
		items = append(items, it)
	}

	return c.JSON(fiber.Map{"items": items})
}
