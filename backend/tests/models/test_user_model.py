"""
Test UserModel functionality and validation.
"""
import pytest
from typing import Dict, Any
from datetime import datetime
from app.models.user import UserModel, get_next_user_id, create_admin_user
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.auth.password import get_password_hash, verify_password
from pydantic import ValidationError


class TestUserModel:
    """Test UserModel functionality."""

    def test_user_model_creation(self) -> None:
        """Test creating a UserModel instance."""
        user: UserModel = UserModel(
            id=1,
            username="testuser",
            firstname="Test",
            email="test@example.com",
            hashedPassword="hashed_password_123",
            isActive=True,
            isAdmin=False,
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        assert user.id == 1
        assert user.username == "testuser"
        assert user.firstname == "Test"
        assert user.email == "test@example.com"
        assert user.hashedPassword == "hashed_password_123"
        assert user.isActive is True
        assert user.isAdmin is False

    def test_user_model_to_dict(self) -> None:
        """Test converting UserModel to dictionary."""
        user: UserModel = UserModel(
            id=1,
            username="testuser",
            firstname="Test",
            email="test@example.com",
            hashedPassword="hashed_password_123",
            isActive=True,
            isAdmin=False,
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        userDict: Dict[str, Any] = user.model_dump()
        assert isinstance(userDict, dict)
        assert userDict["id"] == 1
        assert userDict["username"] == "testuser"
        assert userDict["email"] == "test@example.com"
        assert userDict["hashedPassword"] == "hashed_password_123"

    def test_user_model_defaults(self) -> None:
        """Test UserModel default values."""
        user: UserModel = UserModel(
            id=1,
            username="defaultuser",
            firstname="Default",
            email="default@example.com",
            hashedPassword="hashed_password"
        )
        
        # Check defaults
        assert user.isActive is True
        assert user.isAdmin is False
        assert user.createdAt is not None
        assert user.updatedAt is not None

    def test_user_model_timestamps(self) -> None:
        """Test that timestamps are automatically set."""
        user: UserModel = UserModel(
            id=1,
            username="timestampuser",
            firstname="Timestamp",
            email="timestamp@example.com",
            hashedPassword="hashed_password"
        )
        
        assert isinstance(user.createdAt, datetime)
        assert isinstance(user.updatedAt, datetime)
        # Timestamps should be very close to now
        now = datetime.now()
        assert abs((now - user.createdAt).total_seconds()) < 1
        assert abs((now - user.updatedAt).total_seconds()) < 1


class TestUserSchemas:
    """Test User Pydantic schemas."""

    def test_user_create_valid(self) -> None:
        """Test creating a valid UserCreate schema."""
        userData: Dict[str, str] = {
            "username": "newuser",
            "firstname": "New",
            "email": "new@example.com",
            "password": "strongpassword123"
        }
        
        user: UserCreate = UserCreate(**userData)
        assert user.username == "newuser"
        assert user.firstname == "New"
        assert user.email == "new@example.com"
        assert user.password == "strongpassword123"

    def test_user_create_invalid_email(self) -> None:
        """Test UserCreate with invalid email."""
        userData: Dict[str, str] = {
            "username": "testuser",
            "firstname": "Test",
            "email": "invalid-email",  # Invalid email format
            "password": "password123"
        }
        
        with pytest.raises(ValidationError):
            UserCreate(**userData)

    def test_user_create_missing_required_fields(self) -> None:
        """Test UserCreate with missing required fields."""
        userData: Dict[str, str] = {
            "username": "testuser"
            # Missing firstname, email, password
        }
        
        with pytest.raises(ValidationError):
            UserCreate(**userData)

    def test_user_response_serialization(self) -> None:
        """Test UserResponse serialization."""
        responseData: Dict[str, Any] = {
            "id": 1,
            "username": "responseuser",
            "firstname": "Response",
            "email": "response@example.com",
            "isActive": True,
            "isAdmin": False,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
        
        user: UserResponse = UserResponse(**responseData)
        assert user.id == 1
        assert user.username == "responseuser"
        assert user.firstname == "Response"
        assert user.email == "response@example.com"
        assert user.isActive is True
        assert user.isAdmin is False
        # Should not contain hashedPassword
        assert not hasattr(user, 'hashedPassword')

    def test_user_update_valid(self) -> None:
        """Test UserUpdate schema."""
        updateData: Dict[str, Any] = {
            "firstname": "Updated Name",
            "isActive": False
        }
        
        userUpdate: UserUpdate = UserUpdate(**updateData)
        assert userUpdate.firstname == "Updated Name"
        assert userUpdate.isActive is False
        # Optional fields should be None when not provided
        assert userUpdate.username is None
        assert userUpdate.email is None


class TestUserPasswordHandling:
    """Test user password hashing and verification."""

    def test_password_hashing(self) -> None:
        """Test password hashing functionality."""
        password: str = "testpassword123"
        hashedPassword: str = get_password_hash(password)
        
        # Hash should not be the same as original password
        assert hashedPassword != password
        
        # Hash should be a string
        assert isinstance(hashedPassword, str)
        
        # Hash should be non-empty
        assert len(hashedPassword) > 0

    def test_password_verification(self) -> None:
        """Test password verification."""
        password: str = "testpassword123"
        hashedPassword: str = get_password_hash(password)
        
        # Correct password should verify
        assert verify_password(password, hashedPassword) is True
        
        # Wrong password should not verify
        assert verify_password("wrongpassword", hashedPassword) is False

    def test_different_passwords_different_hashes(self) -> None:
        """Test that different passwords generate different hashes."""
        password1: str = "password123"
        password2: str = "password456"
        
        hash1: str = get_password_hash(password1)
        hash2: str = get_password_hash(password2)
        
        assert hash1 != hash2

    def test_same_password_different_hashes(self) -> None:
        """Test that same password generates different hashes (salt)."""
        password: str = "samepassword123"
        
        hash1: str = get_password_hash(password)
        hash2: str = get_password_hash(password)
        
        # Due to salt, same password should generate different hashes
        assert hash1 != hash2
        
        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestUserValidation:
    """Test user validation rules."""

    def test_email_format_validation(self) -> None:
        """Test email format validation."""
        baseData: Dict[str, str] = {
            "username": "testuser",
            "firstname": "Test",
            "password": "password123"
        }
        
        # Valid emails
        validEmails = [
            "user@example.com",
            "test.email@domain.co.uk", 
            "user+tag@example.org",
            "123@test.com"
        ]
        
        for email in validEmails:
            userData: Dict[str, str] = baseData.copy()
            userData["email"] = email
            user: UserCreate = UserCreate(**userData)
            assert user.email == email
        
        # Invalid emails
        invalidEmails = [
            "invalid-email",
            "@example.com",
            "user@",
            "user..double@example.com",
            "user@.com"
        ]
        
        for email in invalidEmails:
            userData = baseData.copy()
            userData["email"] = email
            with pytest.raises(ValidationError):
                UserCreate(**userData)

    def test_username_validation(self) -> None:
        """Test username validation rules."""
        baseData: Dict[str, str] = {
            "firstname": "Test",
            "email": "test@example.com",
            "password": "password123"
        }
        
        # Valid usernames (min_length=3 per schema)
        validUsernames = ["user123", "test_user", "TestUser", "abc"]
        
        for username in validUsernames:
            userData: Dict[str, str] = baseData.copy()
            userData["username"] = username
            user: UserCreate = UserCreate(**userData)
            assert user.username == username
        
        # Test empty username is invalid
        userData = baseData.copy()
        userData["username"] = ""
        with pytest.raises(ValidationError):
            UserCreate(**userData)

    def test_firstname_validation(self) -> None:
        """Test firstname validation rules."""
        baseData: Dict[str, str] = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        
        # Valid firstnames
        validFirstnames = ["John", "Mary Jane", "José", "李明", "A"]
        
        for firstname in validFirstnames:
            userData: Dict[str, str] = baseData.copy()
            userData["firstname"] = firstname
            user: UserCreate = UserCreate(**userData)
            assert user.firstname == firstname
        
        # Test empty firstname is invalid
        userData = baseData.copy()
        userData["firstname"] = ""
        with pytest.raises(ValidationError):
            UserCreate(**userData)
