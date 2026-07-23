from fastapi import APIRouter, HTTPException
from app.models.auth import UserSignup, UserLogin
from app.database.db import supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup")
def signup(user: UserSignup):

    try:
        response = supabase.auth.sign_up(
            {
                "email": user.email,
                "password": user.password,
                "options": {
                    "data": {
                        "full_name": user.full_name
                    }
                }
            }
        )

        return {
            "message": "Account created successfully",
            "user": response.user
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(user: UserLogin):

    try:

        response = supabase.auth.sign_in_with_password(
            {
                "email": user.email,
                "password": user.password
            }
        )

        return {
            "message": "Login successful",
            "session": response.session,
            "user": response.user
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))