from flask import Flask
from .extensions import db, jwt, cors
from config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Flask extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    
    # 5MB max file size for uploads
    app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024

    # Register blueprints here
    from app.routes.auth import auth_bp
    from app.routes.resources import resources_bp
    from app.routes.requests import requests_bp
    from app.routes.users import users_bp
    from app.routes.reviews import reviews_bp
    from app.routes.transactions import transactions_bp
    from app.routes.notifications import notifications_bp
    from app.routes.sustainability import sustainability_bp
    from app.routes.recommendations import recommendations_bp
    from app.routes.admin import admin_bp
    from app.routes.chat import chat_bp
    from app.routes.ai_helpers import ai_helpers_bp
    from app.routes.upload import upload_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(resources_bp, url_prefix='/api/resources')
    app.register_blueprint(requests_bp, url_prefix='/api/requests')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(reviews_bp, url_prefix='/api/reviews')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(sustainability_bp, url_prefix='/api/sustainability')
    app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(ai_helpers_bp, url_prefix='/api/ai-helpers')
    app.register_blueprint(upload_bp, url_prefix='/api/upload')

    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'EcoSync API is running'}

    return app
