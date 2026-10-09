from app.extensions import db
from datetime import datetime, timezone

class Block(db.Model):
    __tablename__ = 'blocked_users'
    
    id = db.Column(db.Integer, primary_key=True)
    blocker_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    blocked_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    
    # Ensure unique block pairs
    __table_args__ = (
        db.UniqueConstraint('blocker_id', 'blocked_id', name='unique_block'),
    )
    
    # Relationships
    blocker = db.relationship('User', foreign_keys=[blocker_id], backref='users_blocked')
    blocked = db.relationship('User', foreign_keys=[blocked_id], backref='blocked_by')
