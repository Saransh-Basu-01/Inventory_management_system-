from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

# ═══════════════════════════════════════════════════════════
# PASSWORD HASHING
# ═══════════════════════════════════════════════════════════

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt.
    
    Args:
        password: Plain text password
    
    Returns:
        Hashed password string
    
    Example:
        hashed = hash_password("MyPassword123")
        # Returns: "$2b$12$KIXxKj3..."
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password from database
    
    Returns:
        True if password matches, False otherwise
    
    Example:
        is_valid = verify_password("MyPassword123", hashed_from_db)
    """
    return pwd_context.verify(plain_password, hashed_password)


# ═══════════════════════════════════════════════════════════
# JWT TOKEN SETTINGS (from environment variables)
# ═══════════════════════════════════════════════════════════

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY not found in environment variables")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Data to encode in the token (e.g., {"sub": "username"})
        expires_delta: Token expiration time (default: from env variable)
    
    Returns:
        JWT token string
    
    Example:
        token = create_access_token({"sub": "john123"})
    
    Requires:
        pip install python-jose[cryptography]
    """
    try:
        from jose import jwt
        
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        
        return encoded_jwt
    
    except ImportError:
        raise ImportError(
            "python-jose not installed. Install with: pip install python-jose[cryptography]"
        )


def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token data if valid, None otherwise
    
    Example:
        data = verify_token(token)
        if data:
            username = data.get("sub")
    """
    try:
        from jose import jwt, JWTError
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    
    except ImportError:
        raise ImportError(
            "python-jose not installed. Install with: pip install python-jose[cryptography]"
        )
    except JWTError:
        return None


# ═══════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    
    Requirements:
        - At least 8 characters
        - At least one number
        - At least one uppercase letter
        - At least one lowercase letter
    
    Args:
        password: Password to validate
    
    Returns:
        Tuple of (is_valid: bool, message: str)
    
    Example:
        is_valid, message = validate_password_strength("weak")
        if not is_valid:
            raise ValueError(message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    if not any(char.isdigit() for char in password):
        return False, "Password must contain at least one number"
    
    if not any(char.isupper() for char in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(char.islower() for char in password):
        return False, "Password must contain at least one lowercase letter"
    
    return True, "Password is strong"


# ═══════════════════════════════════════════════════════════
# EXPORT
# ═══════════════════════════════════════════════════════════

__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "verify_token",
    "validate_password_strength",
    "pwd_context",
    "SECRET_KEY",
    "ALGORITHM",
    "ACCESS_TOKEN_EXPIRE_MINUTES"
]