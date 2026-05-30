package entity

import "enduro/pkg/apperrors"

var (
	ErrAlreadyFollowing = apperrors.New(apperrors.ErrAlreadyExists, "ALREADY_FOLLOWING", "already following this user")
	ErrNotFollowing     = apperrors.New(apperrors.ErrNotFound, "NOT_FOLLOWING", "not following this user")
	ErrCommentNotFound  = apperrors.New(apperrors.ErrNotFound, "COMMENT_NOT_FOUND", "comment not found")
	ErrForbidden        = apperrors.New(apperrors.ErrForbidden, "FORBIDDEN", "not allowed")
)
