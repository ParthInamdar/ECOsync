from app import create_app
from app.extensions import db
from app.models.user import User

app = create_app()

with app.app_context():
    email = "parth020716@gmail.com"
    user = User.query.filter_by(email=email).first()
    
    if user:
        user.role = "ADMIN"
        db.session.commit()
        print(f"SUCCESS: Upgraded {email} to ADMIN.")
    else:
        print(f"ERROR: No user found with email {email}. Please register first!")
