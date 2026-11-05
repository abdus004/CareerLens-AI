from pydantic import BaseModel, EmailStr, Field, field_validator

from app.utils.validators import validate_full_name, validate_password


class UserSignup(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("full_name")
    @classmethod
    def _validate_full_name(cls, value: str) -> str:
        return validate_full_name(value)

    @field_validator("password")
    @classmethod
    def _validate_password(cls, value: str) -> str:
        return validate_password(value)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RefreshSessionRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=4096)


class LogoutRequest(BaseModel):
    # The current access token comes from Authorization. The refresh token is
    # needed only to establish the same request-scoped client session before
    # invoking Supabase's local-scope sign-out API.
    refresh_token: str = Field(min_length=1, max_length=4096)
