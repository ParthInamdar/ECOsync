from app import create_app
from app.extensions import db
from app.models.user import User

app = create_app()

with app.app_context():
    # Find user named 'admin' or 'Admin'
    admin_user = User.query.filter_by(username='admin').first()
    if admin_user:
        admin_user.role = 'ADMIN'
        db.session.commit()
        print(f"Successfully promoted {admin_user.username} to ADMIN.")
    else:
        print("User 'admin' not found. Please create an account named 'admin' first.")
