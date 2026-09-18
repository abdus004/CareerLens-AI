from pydantic import BaseModel, EmailStr, field_validator

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
