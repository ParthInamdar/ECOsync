import pytest
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.category import Category

@pytest.fixture
def app():
    # We can create a basic config class or just update the app config
    class TestConfig:
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        JWT_SECRET_KEY = "test-secret-key"
        SQLALCHEMY_TRACK_MODIFICATIONS = False
        
    app = create_app(TestConfig)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

from werkzeug.security import generate_password_hash

@pytest.fixture
def init_db(app):
    with app.app_context():
        # Create a test user
        test_user = User(
            username="testuser", 
            email="test@example.com",
            password_hash=generate_password_hash("password123")
        )
        
        # Create an admin user
        admin_user = User(
            username="adminuser", 
            email="admin@example.com", 
            role="ADMIN",
            password_hash=generate_password_hash("admin123")
        )
        
        # Create some categories
        cat1 = Category(name="Electronics")
        cat2 = Category(name="Books")
        
        db.session.add(test_user)
        db.session.add(admin_user)
        db.session.add(cat1)
        db.session.add(cat2)
        db.session.commit()
        
        yield db

@pytest.fixture
def auth_headers(client, init_db):
    response = client.post('/api/auth/login', json={
        "email": "test@example.com",
        "password": "password123"
    })
    token = response.json.get('access_token')
    return {"Authorization": f"Bearer {token}"}
