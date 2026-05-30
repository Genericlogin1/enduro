package validator

import (
	"fmt"
	"regexp"
	"strings"
)

var emailRe = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

type ValidationError struct {
	Fields map[string]string
}

func (e *ValidationError) Error() string {
	parts := make([]string, 0, len(e.Fields))
	for f, msg := range e.Fields {
		parts = append(parts, fmt.Sprintf("%s: %s", f, msg))
	}
	return "validation failed: " + strings.Join(parts, "; ")
}

func (e *ValidationError) HasErrors() bool {
	return len(e.Fields) > 0
}

type V struct {
	errs map[string]string
}

func New() *V {
	return &V{errs: make(map[string]string)}
}

func (v *V) Required(field, value string) *V {
	if strings.TrimSpace(value) == "" {
		v.errs[field] = "required"
	}
	return v
}

func (v *V) Email(field, value string) *V {
	if !emailRe.MatchString(value) {
		v.errs[field] = "invalid email format"
	}
	return v
}

func (v *V) MinLen(field, value string, min int) *V {
	if len(value) < min {
		v.errs[field] = fmt.Sprintf("must be at least %d characters", min)
	}
	return v
}

func (v *V) MaxLen(field, value string, max int) *V {
	if len(value) > max {
		v.errs[field] = fmt.Sprintf("must be at most %d characters", max)
	}
	return v
}

func (v *V) Validate() error {
	if len(v.errs) == 0 {
		return nil
	}
	return &ValidationError{Fields: v.errs}
}
