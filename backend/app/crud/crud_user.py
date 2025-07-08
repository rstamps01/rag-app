# File Path: /home/ubuntu/rag_app_extracted/rag-app/backend/app/crud/crud_user.py
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate # Import UserCreate specifically
from app.core.security import get_password_hash, verify_password # Assuming this handles hashing
import logging
from app.models.models import User # Import the specific User model

logger = logging.getLogger(__name__)

def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user_data: UserCreate) -> User:
    hashed_password = get_password_hash(user_data.password) # Hash the password before storing
    db_user_data = user_data.model_dump(exclude={"password"}) # Exclude plain password
    
    # Standardize department to lowercase if it exists
    if "department" in db_user_data and db_user_data["department"]:
        db_user_data["department"] = db_user_data["department"].lower()
    else:
        db_user_data["department"] = None # Or a default like 'general'

    db_user = User(**db_user_data, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"Created user: {db_user.email} in department {db_user.department}")
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email=email)
    if not user:
        logger.debug(f"Authentication failed: User not found - {email}")
        return None
    if not verify_password(password, user.hashed_password):
        logger.debug(f"Authentication failed: Invalid password for user - {email}")
        return None
    logger.info(f"Authentication successful for user: {email}") # Changed to info for successful auth
    return user

# Add other user-related CRUD operations as needed (update, delete, etc.)
# Example for updating a user (partial updates allowed via Pydantic schema)
# from app.schemas.user import UserUpdate 
# def update_user(db: Session, user_id: int, user_update: UserUpdate) -> User | None:
#     db_user = get_user(db, user_id)
#     if db_user:
#         update_data = user_update.model_dump(exclude_unset=True)
#         if "password" in update_data and update_data["password"]:
#             hashed_password = get_password_hash(update_data["password"])
#             db_user.hashed_password = hashed_password
#             del update_data["password"]
#         if "department" in update_data and update_data["department"]:
#             update_data["department"] = update_data["department"].lower()
            
#         for key, value in update_data.items():
#             setattr(db_user, key, value)
#         db.commit()
#         db.refresh(db_user)
#         logger.info(f"Updated user: {db_user.email}")
#         return db_user
#     return None

