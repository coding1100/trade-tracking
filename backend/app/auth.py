from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

# Configuration (Settings)
SECRET_KEY = "12345678"  # Replace with your actual secret key
ALGORITHM = "HS256"  # Adjust if using a different JWT algorithm

# FastAPI OAuth2 Configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Extract the current user from the token.
    Decodes the JWT and retrieves user information.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=401, detail="Invalid authentication credentials"
            )
        return {"user_id": user_id}
    except JWTError:
        raise HTTPException(
            status_code=401, detail="Invalid authentication credentials"
        )
