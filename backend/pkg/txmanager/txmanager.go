package txmanager

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TxKey is used to store an active transaction in context.
type txKey struct{}

// Manager executes a function inside a database transaction.
type Manager struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Manager {
	return &Manager{pool: pool}
}

// RunInTx starts a transaction, passes it via context, and commits/rolls back.
func (m *Manager) RunInTx(ctx context.Context, fn func(ctx context.Context) error) error {
	tx, err := m.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	ctx = context.WithValue(ctx, txKey{}, tx)

	if err := fn(ctx); err != nil {
		_ = tx.Rollback(ctx)
		return err
	}
	return tx.Commit(ctx)
}

// ExtractTx pulls a transaction from context; returns nil if none is active.
func ExtractTx(ctx context.Context) pgx.Tx {
	tx, _ := ctx.Value(txKey{}).(pgx.Tx)
	return tx
}
