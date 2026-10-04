from app import create_app
from app.extensions import db

# Need to import all models so SQLAlchemy knows about them before create_all()
from app.models.user import User
from app.models.category import Category
from app.models.resource import Resource
from app.models.request import Request
from app.models.transaction import Transaction
from app.models.review import Review
from app.models.sustainability import SustainabilityImpact
from app.models.notification import Notification

app = create_app()

with app.app_context():
    print("Creating database tables...")
    db.create_all()
    
    # Optionally seed some categories
    if not Category.query.first():
        categories = ['Books', 'Electronics', 'Sports Equipment', 'Tools', 'Household', 'Other']
        for cat_name in categories:
            cat = Category(name=cat_name)
            db.session.add(cat)
        db.session.commit()
        print("Seeded default categories.")
        
    print("Done!")
