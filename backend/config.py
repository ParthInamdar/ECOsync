import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    is_prod = os.environ.get('FLASK_ENV') == 'production' or os.environ.get('RENDER') == 'true'

    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        if is_prod:
            raise ValueError("No SECRET_KEY set for Flask application in production")
        SECRET_KEY = 'dev-secret-key-change-in-prod'

    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:
        if is_prod:
            raise ValueError("No JWT_SECRET_KEY set for Flask application in production")
        JWT_SECRET_KEY = 'jwt-dev-secret-key-change-in-prod'
        
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
    if not GROQ_API_KEY:
        if is_prod:
            raise ValueError("No GROQ_API_KEY set for Flask application in production")
    
    # Database
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    if not SQLALCHEMY_DATABASE_URI:
        if is_prod:
            raise ValueError("No DATABASE_URL set for Flask application in production")
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'ecosync.db')

    # Fix postgres:// to postgresql:// for SQLAlchemy compatibility in deployed environments
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS Security
    FRONTEND_URL = os.environ.get('FRONTEND_URL')
    if is_prod:
        if not FRONTEND_URL:
            raise ValueError("No FRONTEND_URL set for CORS in production")
        CORS_ORIGINS = [FRONTEND_URL]
    else:
        CORS_ORIGINS = "*"

    # Other Configs
    JSON_SORT_KEYS = False
