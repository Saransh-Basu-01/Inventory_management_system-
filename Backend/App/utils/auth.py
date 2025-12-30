"""
Authentication utilities for JWT token handling and password hashing.
"""
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

# ═══════════════════════════════════════════════════════════════════════════
# PASSWORD HASHING CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt.
    
    Args:
        password: Plain text password
    
    Returns: 
        Hashed password string
    
    Example:
        hashed = hash_password("MySecurePassword123")
    """
    return pwd_context. hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash. 
    
    Args: 
        plain_password: Plain text password to verify
        hashed_password: Hashed password from database
    
    Returns:
        True if password matches, False otherwise
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception: 
        return False


# ═══════════════════════════════════════════════════════════════════════════
# JWT TOKEN CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

# Get settings from environment variables
SECRET_KEY = os. getenv("SECRET_KEY")
if not SECRET_KEY: 
    # Fallback for development - CHANGE IN PRODUCTION! 
    SECRET_KEY = "development-secret-key-change-this-in-production-immediately"
    print("⚠️  WARNING: Using default SECRET_KEY.  Set SECRET_KEY in .env for production!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args: 
        data: Data to encode in the token (e.g., {"sub": "user_id", "username": "john"})
        expires_delta: Optional custom expiration time
    
    Returns: 
        JWT token string
    
    Example:
        token = create_access_token({"sub": "123", "username": "john", "role": "admin"})
    """
    from jose import jwt
    
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else: 
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp":  expire,
        "iat": datetime. utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt. encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token (longer lived than access token).
    
    Args:
        data: Data to encode in the token
        expires_delta:  Optional custom expiration time
    
    Returns:
        JWT refresh token string
    """
    from jose import jwt
    
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt. encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token:  str) -> Optional[Dict[str, Any]]: 
    """
    Verify and decode a JWT token.
    
    Args: 
        token: JWT token string
    
    Returns:
        Decoded token payload if valid, None otherwise
    """
    try:
        from jose import jwt, JWTError
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
    except Exception: 
        return None


def decode_token_unverified(token:  str) -> Optional[Dict[str, Any]]:
    """
    Decode a token without verification (for debugging only).
    
    ⚠️ WARNING: Do not use for authentication!
    """
    try:
        from jose import jwt
        
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM],
            options={"verify_exp": False, "verify_signature": False}
        )
        return payload
    except Exception: 
        return None


def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get the expiration time of a token. 
    
    Returns:
        datetime of expiry or None if invalid
    """
    payload = decode_token_unverified(token)
    if payload and "exp" in payload: 
        return datetime. fromtimestamp(payload["exp"])
    return None


def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired.
    
    Returns:
        True if expired, False if valid
    """
    expiry = get_token_expiry(token)
    if expiry is None: 
        return True
    return datetime.utcnow() > expiry