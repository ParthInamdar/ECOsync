from app.extensions import db
from datetime import datetime

class ResourceImage(db.Model):
    __tablename__ = 'resource_images'
    
    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.Integer, db.ForeignKey('resources.id'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ResourceImage {self.id} for Resource {self.resource_id}>'
