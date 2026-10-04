from app.extensions import db
from datetime import datetime

class Resource(db.Model):
    __tablename__ = 'resources'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    condition = db.Column(db.String(50), default='Good')
    sharing_type = db.Column(db.String(50), default='Borrow') # Legacy Borrow, Donate
    listing_type = db.Column(db.String(50), default='FREE') # SELL, RENT, BORROW, DONATE, FREE
    price = db.Column(db.Float, default=0.0)
    price_unit = db.Column(db.String(50), nullable=True) # e.g. Fixed, /day, /week
    security_deposit = db.Column(db.Float, default=0.0)
    ai_condition_assessment = db.Column(db.Text, nullable=True)
    
    location_name = db.Column(db.String(100), nullable=False)
    location_lat = db.Column(db.Float, nullable=True)
    location_lon = db.Column(db.Float, nullable=True)
    is_available = db.Column(db.Boolean, default=True)
    image_url = db.Column(db.String(255), nullable=True)
    
    # Foreign Keys
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    requests = db.relationship('Request', backref='resource', lazy=True)
    images = db.relationship('ResourceImage', backref='resource', lazy=True, cascade='all, delete-orphan')
    saved_by = db.relationship('SavedResource', backref='resource', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Resource {self.title}>'
