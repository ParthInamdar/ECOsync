import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import os
from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # Check if columns already exist to prevent errors
        print("Applying migration to add reset_code and reset_expiry to users table...")
        db.session.execute(text("ALTER TABLE users ADD COLUMN reset_code VARCHAR(6);"))
        db.session.execute(text("ALTER TABLE users ADD COLUMN reset_expiry TIMESTAMP;"))
        db.session.commit()
        print("Success! Database migration applied to the local database.")
    except Exception as e:
        print("Migration may have already been applied or an error occurred:")
        print(e)
