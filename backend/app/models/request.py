from app.extensions import db
from datetime import datetime

class Request(db.Model):
    __tablename__ = 'requests'
    
    id = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    resource_id = db.Column(db.Integer, db.ForeignKey('resources.id'), nullable=False)
    
    status = db.Column(db.String(20), default='PENDING') # PENDING, ACCEPTED, REJECTED, CANCELLED
    message = db.Column(db.Text, nullable=True)
    
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to Transaction
    transaction = db.relationship('Transaction', backref='request', uselist=False)
    
    def __repr__(self):
        return f'<Request {self.id} for Resource {self.resource_id}>'
