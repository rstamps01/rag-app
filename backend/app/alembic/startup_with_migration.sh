#!/bin/bash
echo "Starting RAG Application with Database Migrations..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
while ! pg_isready -h postgres-07 -p 5432 -U rag; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Create admin user if it doesn't exist
echo "Checking for admin user..."
python -c "
from app.db.session import SessionLocal
from app.crud.crud_user import get_user_by_email, create_user
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

db = SessionLocal()
try:
    admin_user = get_user_by_email(db, 'admin@rag-app.com')
    if not admin_user:
        admin_data = UserCreate(
            email='admin@rag-app.com',
            password='admin123',  # Change this in production!
            department='admin',
            is_admin=True
        )
        create_user(db, admin_data)
        print('Admin user created: admin@rag-app.com / admin123')
    else:
        print('Admin user already exists')
finally:
    db.close()
"

# Start the application
echo "Starting FastAPI application..."
cd /app
PYTHONPATH=/app python -m uvicorn app.main:app --host 0.0.0.0 --port 8000