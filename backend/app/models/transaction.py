from app.extensions import db
from datetime import datetime

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('requests.id'), nullable=False)
    
    lender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    borrower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    expected_return_date = db.Column(db.DateTime, nullable=True)
    return_date = db.Column(db.DateTime, nullable=True)
    
    status = db.Column(db.String(20), default='ACTIVE') # ACTIVE, RETURNED, COMPLETED, CANCELLED
    
    # Relationships
    lender = db.relationship('User', foreign_keys=[lender_id], backref='lent_transactions')
    borrower = db.relationship('User', foreign_keys=[borrower_id], backref='borrowed_transactions')
    
    def __repr__(self):
        return f'<Transaction {self.id}>'
