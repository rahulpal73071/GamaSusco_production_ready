# app/routers/auth.py
"""
Production Authentication Router
=================================
JWT-based authentication with bcrypt password hashing
Supports login, registration, token refresh, and user management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
import bcrypt

from app.database import get_db
from app.models import User, Company
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class UserRegister(BaseModel):
    """User registration request"""
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None

    @field_validator('username')
    @classmethod
    def username_valid(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not v.replace('_', '').isalnum():
            raise ValueError('Username must be alphanumeric (underscore allowed)')
        return v.lower()

    @field_validator('password')
    @classmethod
    def password_valid(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class CompanyRegister(BaseModel):
    """Company registration request"""
    company_name: str
    industry: str
    size: str
    email: EmailStr
    password: str

    @field_validator('company_name')
    @classmethod
    def company_name_valid(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Company name must be at least 2 characters')
        return v.strip()

    @field_validator('password')
    @classmethod
    def password_valid(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str
    expires_in: int
    user: dict


class UserResponse(BaseModel):
    """User profile response"""
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime


class PasswordChange(BaseModel):
    """Password change request"""
    current_password: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def password_valid(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class MessageResponse(BaseModel):
    """Simple message response"""
    message: str


# ============================================================================
# ROUTER
# ============================================================================

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# ============================================================================
# PASSWORD UTILITIES
# ============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash

    Args:
        plain_password: Plain text password
        hashed_password: Bcrypt hashed password

    Returns:
        True if password matches, False otherwise
    """
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"⚠️  Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt

    Args:
        password: Plain text password

    Returns:
        Bcrypt hashed password as string
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


# ============================================================================
# TOKEN UTILITIES
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token

    Args:
        data: Data to encode in token
        expires_delta: Optional expiration time

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate JWT token

    Args:
        token: JWT token string

    Returns:
        Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        print(f"⚠️  Token decode error: {e}")
        return None


# ============================================================================
# AUTHENTICATION DEPENDENCIES
# ============================================================================

async def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    Use this as a dependency in protected routes

    Args:
        token: JWT token from Authorization header
        db: Database session

    Returns:
        Authenticated User object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception

    # Get user from database
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user


async def get_current_active_user(
        current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user (alias for backward compatibility)"""
    return current_user


async def get_current_admin_user(
        current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user with admin role

    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
        user_data: UserRegister,
        db: Session = Depends(get_db)
):
    """
    Register a new user

    Creates a new user account and optionally a new company
    Only allows registration with email domains that exist in the companies table

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        Created user profile

    Raises:
        HTTPException: If username or email already exists, or domain not allowed
    """

    # Extract domain from email and validate it exists in companies table
    email_domain = user_data.email.split('@')[1].lower()
    existing_company = db.query(Company).filter(Company.domain == email_domain).first()

    if not existing_company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration not allowed. Your email domain is not associated with any registered company."
        )

    # Check if username exists
    existing_user = db.query(User).filter(User.username == user_data.username.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Use the existing company (domain-based assignment)
    company_id = existing_company.id
    company_name = existing_company.name

    # If company_name is provided and different from existing, allow it but use existing company
    if user_data.company_name and user_data.company_name.strip() != existing_company.name:
        print(f"⚠️  User specified company '{user_data.company_name}' but joining existing company '{existing_company.name}' based on domain")

    print(f"✅ User joining existing company: {existing_company.name} (domain: {email_domain})")

    # Create user
    user = User(
        username=user_data.username.lower(),
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        company_id=company_id,
        role="user",
        is_active=True,
        is_verified=False,
        created_at=datetime.now(timezone.utc)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    print(f"✅ New user registered: {user.username} (ID: {user.id})")

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        company_id=user.company_id,
        company_name=company_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )


@router.post("/register-company", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_company(
        company_data: CompanyRegister,
        db: Session = Depends(get_db)
):
    """
    Register a new company with admin user

    Creates a new company and an admin user account

    Args:
        company_data: Company registration data
        db: Database session

    Returns:
        Created admin user profile

    Raises:
        HTTPException: If email already exists
    """

    # Check if email exists
    existing_email = db.query(User).filter(User.email == company_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Extract domain from email
    email_domain = company_data.email.split('@')[1].lower()

    # Create company
    company = Company(
        name=company_data.company_name,
        industry=company_data.industry,
        employee_count=company_data.size,  # Map size to employee_count
        domain=email_domain,
        created_at=datetime.now(timezone.utc)
    )
    db.add(company)
    db.flush()  # Get company.id without committing

    # Generate username from email
    username = company_data.email.split('@')[0].lower()
    # Ensure username is unique
    base_username = username
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1

    # Create admin user
    user = User(
        username=username,
        email=company_data.email,
        full_name=f"{company_data.company_name} Admin",
        hashed_password=get_password_hash(company_data.password),
        company_id=company.id,
        role="admin",
        is_active=True,
        is_verified=True,  # Company admins are pre-verified
        created_at=datetime.now(timezone.utc)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    print(f"✅ New company registered: {company.name} (ID: {company.id})")
    print(f"✅ Admin user created: {user.username} (ID: {user.id})")

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        company_id=user.company_id,
        company_name=company.name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )


@router.post("/login", response_model=Token)
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
):
    """
    Login with username and password

    Returns JWT access token
    Only allows login for users with email domains that exist in the companies table

    Args:
        form_data: OAuth2 form with username and password
        db: Database session

    Returns:
        JWT token and user info

    Raises:
        HTTPException: If credentials are invalid or domain not allowed
    """

    # Find user
    user = db.query(User).filter(
    (User.username == form_data.username.lower()) | (User.email == form_data.username)).first()

    # Verify credentials
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Check if user's email domain is allowed (exists in companies table)
    email_domain = user.email.split('@')[1].lower()
    existing_company = db.query(Company).filter(Company.domain == email_domain).first()

    if not existing_company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Login not allowed. Your email domain is not associated with any registered company."
        )

    # Create access token
    access_token_expires = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "company_id": user.company_id,
            "role": user.role
        },
        expires_delta=access_token_expires
    )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    # Get company name
    company_name = None
    if user.company_id:
        company = db.query(Company).filter(Company.id == user.company_id).first()
        if company:
            company_name = company.name

    print(f"✅ User logged in: {user.username}")

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_HOURS * 3600,  # in seconds
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "company_id": user.company_id,
            "company_name": company_name,
            "role": user.role
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Get current user profile

    Requires valid JWT token

    Args:
        current_user: Authenticated user from token
        db: Database session

    Returns:
        User profile
    """

    # Get company name
    company_name = None
    if current_user.company_id:
        company = db.query(Company).filter(Company.id == current_user.company_id).first()
        if company:
            company_name = company.name

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        company_id=current_user.company_id,
        company_name=company_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
        password_data: PasswordChange,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Change user password

    Requires valid JWT token and current password

    Args:
        password_data: Current and new password
        current_user: Authenticated user from token
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If current password is incorrect
    """

    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.now(timezone.utc)

    db.commit()

    print(f"✅ Password changed for user: {current_user.username}")

    return MessageResponse(message="Password changed successfully")


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout (client-side token removal)

    In a stateless JWT system, logout is handled client-side
    by removing the token from storage

    Args:
        current_user: Authenticated user from token

    Returns:
        Logout message
    """
    print(f"✅ User logged out: {current_user.username}")

    return MessageResponse(
        message="Logout successful. Please remove the token from client storage."
    )


@router.get("/verify-token")
async def verify_token_endpoint(current_user: User = Depends(get_current_user)):
    """
    Verify if token is valid

    Useful for checking authentication status

    Args:
        current_user: Authenticated user from token

    Returns:
        Token validity status
    """
    return {
        "valid": True,
        "user_id": current_user.id,
        "username": current_user.username,
        "company_id": current_user.company_id,
        "role": current_user.role
    }


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.get("/users")
async def list_users(
        current_user: User = Depends(get_current_admin_user),
        db: Session = Depends(get_db)
):
    """
    List all users (Admin only)

    Args:
        current_user: Authenticated admin user
        db: Database session

    Returns:
        List of all users
    """
    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "company_id": user.company_id,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "last_login": user.last_login
        }
        for user in users
    ]


@router.patch("/users/{user_id}/role", response_model=MessageResponse)
async def update_user_role(
        user_id: int,
        role: str,
        current_user: User = Depends(get_current_admin_user),
        db: Session = Depends(get_db)
):
    """
    Update user role (Admin only)

    Valid roles: user, admin, viewer

    Args:
        user_id: ID of user to update
        role: New role
        current_user: Authenticated admin user
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If role is invalid or user not found
    """
    valid_roles = ["user", "admin", "viewer"]

    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.role = role
    user.updated_at = datetime.now(timezone.utc)
    db.commit()

    print(f"✅ User role updated: {user.username} → {role}")

    return MessageResponse(message=f"User role updated to {role}")


@router.patch("/users/{user_id}/status", response_model=MessageResponse)
async def update_user_status(
        user_id: int,
        is_active: bool,
        current_user: User = Depends(get_current_admin_user),
        db: Session = Depends(get_db)
):
    """
    Activate/deactivate user (Admin only)

    Args:
        user_id: ID of user to update
        is_active: New active status
        current_user: Authenticated admin user
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If user not found or trying to deactivate self
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent deactivating yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )

    user.is_active = is_active
    user.updated_at = datetime.now(timezone.utc)
    db.commit()

    status_text = "activated" if is_active else "deactivated"
    print(f"✅ User {status_text}: {user.username}")

    return MessageResponse(message=f"User {status_text} successfully")