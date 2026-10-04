from app.extensions import db
from datetime import datetime

class SustainabilityImpact(db.Model):
    __tablename__ = 'sustainability_impacts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=False)
    resource_id = db.Column(db.Integer, db.ForeignKey('resources.id'), nullable=False)
    
    reused = db.Column(db.Boolean, default=True)
    estimated_waste_avoided = db.Column(db.Float, nullable=True) # e.g. in kg
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<SustainabilityImpact {self.id} for User {self.user_id}>'
