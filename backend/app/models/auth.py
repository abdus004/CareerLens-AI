from pydantic import BaseModel, EmailStr, field_validator

from app.utils.validators import validate_full_name


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
        # Confirm-password matching stays a frontend/UX concern (there's
        # nothing to "match" server-side), but the strength rule itself
        # is enforced here too so the API is safe even if a request
        # bypasses the frontend entirely.
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.islower() for c in value):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one number.")
        if not any(not c.isalnum() for c in value):
            raise ValueError("Password must contain at least one special character.")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str
