package dto

type CreateSpotRequest struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Kind        string  `json:"kind"`
	Lat         float64 `json:"lat"`
	Lng         float64 `json:"lng"`
	Country     string  `json:"country"`
}

type SpotResponse struct {
	ID          string  `json:"id"`
	AuthorID    string  `json:"author_id"`
	AuthorName  string  `json:"author_name"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Kind        string  `json:"kind"`
	Lat         float64 `json:"lat"`
	Lng         float64 `json:"lng"`
	Country     string  `json:"country"`
	Upvotes     int     `json:"upvotes"`
	MyVote      int     `json:"my_vote"`
	CreatedAt   string  `json:"created_at"`
}

type ListSpotsFilter struct {
	Kind    string
	MinLat  float64
	MaxLat  float64
	MinLng  float64
	MaxLng  float64
	HasBbox bool
}
