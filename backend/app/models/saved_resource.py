from app.extensions import db
from datetime import datetime

class SavedResource(db.Model):
    __tablename__ = 'saved_resources'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    resource_id = db.Column(db.Integer, db.ForeignKey('resources.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure a user can only save a specific resource once
    __table_args__ = (db.UniqueConstraint('user_id', 'resource_id', name='_user_resource_uc'),)
    
    def __repr__(self):
        return f'<SavedResource user_id={self.user_id} resource_id={self.resource_id}>'
