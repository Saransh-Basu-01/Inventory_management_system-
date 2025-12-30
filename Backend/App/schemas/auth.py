from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class Token(BaseModel):
    """Response model for login - contains JWT tokens."""
    access_token: str
    refresh_token: str
    token_type:  str = "bearer"


class TokenData(BaseModel):
    """Data extracted from JWT token."""
    user_id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    """Login request body (JSON)."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=1)


class RegisterRequest(BaseModel):
    """Registration request body."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(... , min_length=8)
    full_name: Optional[str] = Field(None, max_length=100)


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str


class PasswordChangeRequest(BaseModel):
    """Password change request."""
    current_password: str
    new_password:  str = Field(..., min_length=8)


class PasswordResetRequest(BaseModel):
    """Password reset request (admin use)."""
    new_password: str = Field(..., min_length=8)


class UserProfile(BaseModel):
    """User profile response."""
    id: int
    username:  str
    email:  str
    full_name: Optional[str] = None
    role: str
    is_active:  bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config: 
        from_attributes = True