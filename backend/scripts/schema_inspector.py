#!/usr/bin/env python3
"""
Schema Inspector Script
Examines the actual User model and UserCreate schema to understand the mismatch
"""

import sys
import os

# Add app directory to Python path
sys.path.insert(0, '/app')

try:
    from app.models.models import User
    from app.schemas.user import UserCreate
    from sqlalchemy import inspect
    from app.db.session import engine
    import logging

    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    def inspect_user_model():
        """Inspect the actual User SQLAlchemy model"""
        try:
            logger.info("🔍 Inspecting User SQLAlchemy Model:")
            
            # Get table columns from SQLAlchemy
            inspector = inspect(engine)
            columns = inspector.get_columns('users')
            
            logger.info("📋 Database table 'users' columns:")
            for column in columns:
                nullable = "nullable" if column['nullable'] else "not null"
                default = f"default: {column['default']}" if column['default'] else "no default"
                logger.info(f"   {column['name']}: {column['type']} ({nullable}, {default})")
            
            # Get model attributes
            logger.info("📋 User model attributes:")
            for attr_name in dir(User):
                if not attr_name.startswith('_') and hasattr(User, attr_name):
                    attr = getattr(User, attr_name)
                    if hasattr(attr, 'type'):  # SQLAlchemy column
                        logger.info(f"   {attr_name}: {attr.type}")
            
            return columns
            
        except Exception as e:
            logger.error(f"❌ Failed to inspect User model: {e}")
            return []

    def inspect_user_create_schema():
        """Inspect the UserCreate Pydantic schema"""
        try:
            logger.info("🔍 Inspecting UserCreate Pydantic Schema:")
            
            # Get schema fields
            schema_fields = UserCreate.model_fields
            logger.info("📋 UserCreate schema fields:")
            for field_name, field_info in schema_fields.items():
                required = "required" if field_info.is_required() else "optional"
                field_type = field_info.annotation if hasattr(field_info, 'annotation') else "unknown"
                default = f"default: {field_info.default}" if hasattr(field_info, 'default') and field_info.default is not None else "no default"
                logger.info(f"   {field_name}: {field_type} ({required}, {default})")
            
            return schema_fields
            
        except Exception as e:
            logger.error(f"❌ Failed to inspect UserCreate schema: {e}")
            return {}

    def check_schema_files():
        """Check the actual schema files"""
        try:
            logger.info("📁 Checking schema files:")
            
            # Try to read the user schema file
            try:
                with open('/app/app/schemas/user.py', 'r') as f:
                    content = f.read()
                    logger.info("📄 Found user.py schema file")
                    
                    # Look for UserCreate class
                    lines = content.split('\n')
                    in_user_create = False
                    for i, line in enumerate(lines):
                        if 'class UserCreate' in line:
                            in_user_create = True
                            logger.info(f"📋 UserCreate class found at line {i+1}:")
                        elif in_user_create and line.strip().startswith('class ') and 'UserCreate' not in line:
                            break
                        elif in_user_create and line.strip():
                            logger.info(f"   {line.strip()}")
                            
            except FileNotFoundError:
                logger.warning("⚠️  user.py schema file not found")
                
            # Try to read the models file
            try:
                with open('/app/app/models/models.py', 'r') as f:
                    content = f.read()
                    logger.info("📄 Found models.py file")
                    
                    # Look for User class
                    lines = content.split('\n')
                    in_user_model = False
                    for i, line in enumerate(lines):
                        if 'class User(' in line:
                            in_user_model = True
                            logger.info(f"📋 User model class found at line {i+1}:")
                        elif in_user_model and line.strip().startswith('class ') and 'User(' not in line:
                            break
                        elif in_user_model and line.strip() and ('Column(' in line or '=' in line):
                            logger.info(f"   {line.strip()}")
                            
            except FileNotFoundError:
                logger.warning("⚠️  models.py file not found")
                
        except Exception as e:
            logger.error(f"❌ Failed to check schema files: {e}")

    def main():
        """Main inspection function"""
        logger.info("🔍 Starting Schema Inspection...")
        
        # Step 1: Inspect User SQLAlchemy model
        logger.info("\n" + "="*50)
        user_columns = inspect_user_model()
        
        # Step 2: Inspect UserCreate Pydantic schema
        logger.info("\n" + "="*50)
        user_create_fields = inspect_user_create_schema()
        
        # Step 3: Check actual schema files
        logger.info("\n" + "="*50)
        check_schema_files()
        
        # Step 4: Analyze the mismatch
        logger.info("\n" + "="*50)
        logger.info("🔍 Schema Mismatch Analysis:")
        
        if user_columns and user_create_fields:
            db_column_names = [col['name'] for col in user_columns]
            schema_field_names = list(user_create_fields.keys())
            
            logger.info(f"📋 Database columns: {db_column_names}")
            logger.info(f"📋 Schema fields: {schema_field_names}")
            
            # Find mismatches
            missing_in_db = [field for field in schema_field_names if field not in db_column_names]
            missing_in_schema = [col for col in db_column_names if col not in schema_field_names]
            
            if missing_in_db:
                logger.warning(f"⚠️  Fields in schema but not in database: {missing_in_db}")
            if missing_in_schema:
                logger.warning(f"⚠️  Columns in database but not in schema: {missing_in_schema}")
            
            # Suggest fix
            logger.info("\n💡 Suggested Fix:")
            if 'username' in schema_field_names and 'username' not in db_column_names:
                logger.info("   - Remove 'username' from UserCreate schema, or")
                logger.info("   - Add 'username' column to User model, or")
                logger.info("   - Use direct database insertion bypassing schema validation")
        
        return True

    if __name__ == "__main__":
        success = main()
        sys.exit(0 if success else 1)

except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this script from the correct directory with PYTHONPATH set")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

