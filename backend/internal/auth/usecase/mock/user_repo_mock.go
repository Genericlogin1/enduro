package mock

import (
	"context"

	"github.com/google/uuid"

	"enduro/internal/user/entity"
)

type UserRepositoryMock struct {
	CreateFn     func(ctx context.Context, u *entity.User) error
	GetByIDFn    func(ctx context.Context, id uuid.UUID) (*entity.User, error)
	GetByEmailFn func(ctx context.Context, email string) (*entity.User, error)
	ListFn       func(ctx context.Context, limit, offset int) ([]*entity.User, error)
	UpdateFn     func(ctx context.Context, u *entity.User) error
	DeleteFn     func(ctx context.Context, id uuid.UUID) error
}

func (m *UserRepositoryMock) Create(ctx context.Context, u *entity.User) error {
	return m.CreateFn(ctx, u)
}
func (m *UserRepositoryMock) GetByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	return m.GetByIDFn(ctx, id)
}
func (m *UserRepositoryMock) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	return m.GetByEmailFn(ctx, email)
}
func (m *UserRepositoryMock) List(ctx context.Context, limit, offset int) ([]*entity.User, error) {
	return m.ListFn(ctx, limit, offset)
}
func (m *UserRepositoryMock) Update(ctx context.Context, u *entity.User) error {
	return m.UpdateFn(ctx, u)
}
func (m *UserRepositoryMock) Delete(ctx context.Context, id uuid.UUID) error {
	return m.DeleteFn(ctx, id)
}
