from app.extensions import db
from datetime import datetime, timezone

class Issue(db.Model):
    __tablename__ = 'issues'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    description = db.Column(db.Text, nullable=False)
    ai_response = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='OPEN')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = db.relationship('User', backref=db.backref('reported_issues', lazy=True))
