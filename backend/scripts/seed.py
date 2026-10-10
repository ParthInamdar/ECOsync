import os
import sys
from datetime import datetime, timezone, timedelta

# Add backend directory to sys.path so app can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.category import Category
from app.models.resource import Resource
from app.models.review import Review
from app.models.activity import ActivityLog

def seed_database():
    app = create_app()
    with app.app_context():
        print("Clearing existing data...")
        db.drop_all()
        db.create_all()

        print("Seeding Categories...")
        categories = [
            "Electronics", "Books", "Tools", "Household",
            "Sports Equipment", "Musical Instruments", "Outdoors & Camping", "Party Supplies", "Apparel", "Baby & Kids"
        ]
        cat_objects = {}
        for c_name in categories:
            cat = Category(name=c_name)
            db.session.add(cat)
            cat_objects[c_name] = cat
        db.session.commit()

        from werkzeug.security import generate_password_hash
        print("Seeding Users...")
        admin = User(username="super-admin", email="parth020716@gmail.com", role="ADMIN", password_hash=generate_password_hash("admin123"))
        
        user1 = User(username="john_doe", email="john@example.com", password_hash=generate_password_hash("password123"))

        user2 = User(username="jane_smith", email="jane@example.com", password_hash=generate_password_hash("password123"))

        db.session.add_all([admin, user1, user2])
        db.session.commit()

        print("Seeding Resources...")
        resources = [
            Resource(
                title="Power Drill",
                description="Heavy duty power drill. Only used twice.",
                category_id=cat_objects["Tools"].id,
                owner_id=user1.id,
                condition="Like New",
                listing_type="RENT",
                sharing_type="Borrow",
                price=100.0,
                price_unit="/day",
                security_deposit=500.0,
                location_name="North District",
                location_lat=23.05,
                location_lon=72.58,
                image_url="",
                is_available=True
            ),
            Resource(
                title="Python Programming Book",
                description="Learn Python in 30 days.",
                category_id=cat_objects["Books"].id,
                owner_id=user2.id,
                condition="Good",
                listing_type="FREE",
                sharing_type="Borrow",
                price=0,
                location_name="South District",
                location_lat=23.00,
                location_lon=72.50,
                image_url="",
                is_available=True
            ),
            Resource(
                title="Camping Tent (4 Person)",
                description="Great for weekend getaways.",
                category_id=cat_objects["Sports Equipment"].id,
                owner_id=user1.id,
                condition="Fair",
                listing_type="RENT",
                sharing_type="Borrow",
                price=300.0,
                price_unit="/day",
                security_deposit=1000.0,
                location_name="North District",
                location_lat=23.05,
                location_lon=72.58,
                image_url="",
                is_available=True
            )
        ]
        db.session.add_all(resources)
        db.session.commit()

        print("Seeding Activity Logs...")
        activities = [
            ActivityLog(user_id=admin.id, action="USER_LOGIN", details="Admin logged in to the system", ip_address="192.168.1.1", created_at=datetime.now(timezone.utc) - timedelta(days=2)),
            ActivityLog(user_id=user1.id, action="USER_REGISTER", details="New user registered", ip_address="192.168.1.100", created_at=datetime.now(timezone.utc) - timedelta(days=1)),
            ActivityLog(user_id=user1.id, action="RESOURCE_CREATED", details="Created resource 'Power Drill'", ip_address="192.168.1.100", created_at=datetime.now(timezone.utc) - timedelta(hours=20)),
            ActivityLog(user_id=user2.id, action="USER_REGISTER", details="New user registered", ip_address="192.168.1.101", created_at=datetime.now(timezone.utc) - timedelta(hours=10)),
            ActivityLog(user_id=user2.id, action="RESOURCE_CREATED", details="Created resource 'Python Programming Book'", ip_address="192.168.1.101", created_at=datetime.now(timezone.utc) - timedelta(hours=9)),
            ActivityLog(user_id=user1.id, action="RESOURCE_CREATED", details="Created resource 'Camping Tent (4 Person)'", ip_address="192.168.1.100", created_at=datetime.now(timezone.utc) - timedelta(hours=5)),
            ActivityLog(user_id=user2.id, action="USER_LOGIN", details="User logged in", ip_address="192.168.1.101", created_at=datetime.now(timezone.utc) - timedelta(hours=1)),
        ]
        db.session.add_all(activities)
        db.session.commit()

        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
