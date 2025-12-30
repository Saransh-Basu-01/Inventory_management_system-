"""
CRUD operations for User model.
"""
from sqlalchemy. orm import Session
from sqlalchemy. exc import IntegrityError
from typing import Optional, List
from datetime import datetime

from App.models. user import User, UserRole
from App. schemas.user import UserCreate, UserUpdate
from App.utils. auth import hash_password, verify_password


def create_user(db:  Session, user_in: UserCreate) -> User:
    """
    Create a new user with hashed password. 
    
    Args: 
        db: Database session
        user_in: User creation data
    
    Returns:
        Created user object
    
    Raises: 
        ValueError: If username or email already exists
    """
    # Check if username already exists
    existing_user = db. query(User).filter(User.username == user_in.username).first()
    if existing_user: 
        raise ValueError(f"Username '{user_in.username}' is already taken")
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise ValueError(f"Email '{user_in.email}' is already registered")
    
    # Create user with hashed password
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in. password),
        full_name=user_in.full_name,
        role=user_in.role if user_in.role else UserRole. STAFF,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    try:
        db. add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Database error: {str(e)}")


def get_user(db: Session, user_id: int) -> Optional[User]: 
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username (case-insensitive)."""
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]: 
    """Get user by email (case-insensitive)."""
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100, include_inactive: bool = False) -> List[User]: 
    """
    Get all users with pagination.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        include_inactive: Whether to include inactive users
    
    Returns:
        List of users
    """
    query = db.query(User)
    if not include_inactive: 
        query = query. filter(User.is_active == True)
    return query.offset(skip).limit(limit).all()


def update_user(db:  Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    """
    Update user details.
    
    Args:
        db: Database session
        user_id: ID of user to update
        user_update: Update data
    
    Returns:
        Updated user or None if not found
    """
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Check for duplicate username
    if "username" in update_data and update_data["username"] != db_user.username:
        existing = get_user_by_username(db, update_data["username"])
        if existing: 
            raise ValueError(f"Username '{update_data['username']}' is already taken")
    
    # Check for duplicate email
    if "email" in update_data and update_data["email"] != db_user.email:
        existing = get_user_by_email(db, update_data["email"])
        if existing: 
            raise ValueError(f"Email '{update_data['email']}' is already registered")
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user_password(db: Session, user_id: int, new_password: str) -> Optional[User]:
    """
    Update user's password.
    
    Args:
        db: Database session
        user_id:  ID of user
        new_password:  New plain text password
    
    Returns:
        Updated user or None if not found
    """
    db_user = get_user(db, user_id)
    if not db_user: 
        return None
    
    db_user.hashed_password = hash_password(new_password)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_last_login(db:  Session, user_id: int) -> None:
    """Update user's last login timestamp."""
    db_user = get_user(db, user_id)
    if db_user:
        db_user.last_login = datetime. utcnow()
        db.commit()


def authenticate_user(db:  Session, username: str, password: str) -> Optional[User]: 
    """
    Authenticate user by username and password. 
    
    Args: 
        db: Database session
        username:  Username to authenticate
        password:  Plain text password
    
    Returns:
        User if authentication successful, None otherwise
    """
    user = get_user_by_username(db, username)
    
    # User not found
    if not user:
        return None
    
    # Wrong password
    if not verify_password(password, user.hashed_password):
        return None
    
    # User is deactivated
    if not user.is_active:
        return None
    
    return user


def deactivate_user(db: Session, user_id: int) -> Optional[User]:
    """
    Deactivate a user account (soft delete).
    
    Returns:
        Deactivated user or None if not found
    """
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    db_user.is_active = False
    db.commit()
    db.refresh(db_user)
    return db_user


def activate_user(db:  Session, user_id: int) -> Optional[User]:
    """
    Reactivate a user account. 
    
    Returns:
        Activated user or None if not found
    """
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    db_user. is_active = True
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db:  Session, user_id: int) -> bool:
    """
    Permanently delete a user (hard delete).
    
    ⚠️ WARNING: This permanently removes the user.  Use deactivate_user for soft delete.
    
    Returns:
        True if deleted, False if not found
    """
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db. delete(db_user)
    db.commit()
    return True


def get_users_by_role(db: Session, role: UserRole, skip: int = 0, limit: int = 100) -> List[User]:
    """Get all users with a specific role."""
    return db.query(User).filter(
        User.role == role,
        User.is_active == True
    ).offset(skip).limit(limit).all()


def count_users(db:  Session, include_inactive: bool = False) -> int:
    """Count total users."""
    query = db.query(User)
    if not include_inactive: 
        query = query.filter(User. is_active == True)
    return query.count()