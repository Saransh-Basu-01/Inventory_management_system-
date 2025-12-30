from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi. security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, List
import hashlib
from App.database import get_db
from App.models.user import User, UserRole

router = APIRouter()

# ═══════════════════════════════════════════════════════════════════
# SETTINGS
# ═══════════════════════════════════════════════════════════════════

SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ═══════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════

class Token(BaseModel):
    access_token:  str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name:  Optional[str] = None


class CreateUserRequest(BaseModel):
    username: str
    email:  str
    password:  str
    full_name: Optional[str] = None
    role: str = "staff"


class RoleUpdateRequest(BaseModel):
    role: str


class UserResponse(BaseModel):
    id: int
    username:  str
    email:  str
    full_name: Optional[str] = None
    role: str

    class Config: 
        from_attributes = True


class MessageResponse(BaseModel):
    message: str
    user_id: Optional[int] = None
    username: Optional[str] = None
    new_role: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════
# PASSWORD & TOKEN FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password:  str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password


def create_token(user_id: int, username: str, role: str) -> str:
    """Create JWT token with user info"""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data = {
        "sub": str(user_id),
        "username":  username,
        "role": role,
        "exp": expire
    }
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


# ═══════════════════════════════════════════════════════════════════
# AUTHORIZATION FUNCTIONS - USE THESE IN YOUR ROUTES! 
# ═══════════════════════════════════════════════════════════════════

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get current logged-in user - ANY role can access"""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate":  "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None: 
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None: 
        raise credentials_exception

    return user


def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Only ADMIN can access"""
    if current_user.role. value != "admin": 
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user


def get_manager_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """ADMIN or MANAGER can access"""
    if current_user.role. value not in ["admin", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Manager or Admin access required"
        )
    return current_user


# ═══════════════════════════════════════════════════════════════════
# HELPER FUNCTION - Convert string to UserRole enum
# ═══════════════════════════════════════════════════════════════════

def get_role_enum(role_string: str) -> UserRole:
    """Convert role string to UserRole enum"""
    role_map = {
        "admin": UserRole.ADMIN,
        "manager":  UserRole.MANAGER,
        "staff": UserRole. STAFF,
    }
    
    if role_string not in role_map:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid role '{role_string}'.  Use:  admin, manager, staff"
        )
    
    return role_map[role_string]


# ═══════════════════════════════════════════════════════════════════
# AUTH ROUTES - Public
# ═══════════════════════════════════════════════════════════════════

@router.post("/register", response_model=UserResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user (default role: staff)"""

    # Check if username exists
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check if email exists
    if db.query(User).filter(User.email == data. email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user with default role (staff)
    user = User(
        username=data.username,
        email=data. email,
        hashed_password=hash_password(data. password),
        full_name=data. full_name,
        role=UserRole.STAFF
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/login", response_model=Token)
def login(
    form_data:  OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """Login and get access token"""

    # Find user by username
    user = db.query(User).filter(User.username == form_data. username).first()

    # Validate credentials
    if not user or not verify_password(form_data.password, user. hashed_password):
        raise HTTPException(
            status_code=401, 
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create and return token
    token = create_token(user.id, user. username, user.role.value)

    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user:  User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


# ═══════════════════════════════════════════════════════════════════
# ADMIN ROUTES - User Management
# ═══════════════════════════════════════════════════════════════════

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """List all users (Admin only)"""
    users = db.query(User).order_by(User. id).all()
    return users


@router. get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get a specific user by ID (Admin only)"""
    user = db. query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router. post("/users", response_model=UserResponse)
def create_user(
    data: CreateUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Create a new user with specified role (Admin only)"""

    # Validate role
    role_enum = get_role_enum(data.role)

    # Check if username exists
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check if email exists
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data. full_name,
        role=role_enum
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.patch("/users/{user_id}/role", response_model=MessageResponse)
def change_user_role(
    user_id: int,
    role_data: RoleUpdateRequest,
    db:  Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Change a user's role (Admin only) - Using request body"""

    # Get new role
    new_role = role_data.role
    
    # Validate role
    role_enum = get_role_enum(new_role)

    # Find user
    user = db.query(User).filter(User.id == user_id).first()
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from changing their own role
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    # Get old role for message
    old_role = user.role. value

    # Update role
    user. role = role_enum
    db.commit()
    db.refresh(user)

    return MessageResponse(
        message=f"User '{user.username}' role changed from '{old_role}' to '{new_role}'",
        user_id=user.id,
        username=user.username,
        new_role=new_role
    )


@router.put("/users/{user_id}/role", response_model=MessageResponse)
def change_user_role_query(
    user_id: int,
    role:  str = Query(..., description="New role:  admin, manager, or staff"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Change a user's role (Admin only) - Using query parameter"""

    # Validate role
    role_enum = get_role_enum(role)

    # Find user
    user = db.query(User).filter(User.id == user_id).first()
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from changing their own role
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    # Get old role for message
    old_role = user. role.value

    # Update role
    user.role = role_enum
    db.commit()
    db.refresh(user)

    return MessageResponse(
        message=f"User '{user.username}' role changed from '{old_role}' to '{role}'",
        user_id=user.id,
        username=user.username,
        new_role=role
    )


@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: int,
    db:  Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a user (Admin only)"""

    # Find user
    user = db.query(User).filter(User.id == user_id).first()
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deleting themselves
    if user. id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    # Store username for message
    username = user.username

    # Delete user
    db.delete(user)
    db.commit()

    return MessageResponse(
        message=f"User '{username}' has been deleted",
        user_id=user_id,
        username=username
    )


# ═══════════════════════════════════════════════════════════════════
# INITIAL SETUP - Create First Admin
# ═══════════════════════════════════════════════════════════════════

@router. post("/create-admin", response_model=MessageResponse)
def create_first_admin(
    username: str = Query(..., min_length=3),
    email: str = Query(...),
    password: str = Query(..., min_length=6),
    db: Session = Depends(get_db)
):
    """
    Create first admin user. 
    Use this ONCE to create the initial admin, then use the admin panel. 
    """

    # Check if any admin already exists
    existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if existing_admin: 
        raise HTTPException(
            status_code=400, 
            detail="Admin already exists.  Login as admin and use /users to create more."
        )

    # Check if username exists
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check if email exists
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create admin user
    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        full_name="Administrator",
        role=UserRole.ADMIN
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return MessageResponse(
        message=f"Admin user '{username}' created successfully! ",
        user_id=user.id,
        username=username,
        new_role="admin"
    )