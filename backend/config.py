import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    is_prod = False

    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-prod'

    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-dev-secret-key-change-in-prod'
        
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
    if not GROQ_API_KEY:
        if is_prod:
            raise ValueError("No GROQ_API_KEY set for Flask application in production")
    
    # Database
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///' + os.path.join(basedir, 'ecosync.db')

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CORS_ORIGINS = "*"

    # Other Configs
    JSON_SORT_KEYS = False
