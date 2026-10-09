from flask import Blueprint, jsonify
from app.extensions import db
from app.models.notification import Notification
from app.models.transaction import Transaction
from datetime import datetime, timezone
from flask_jwt_extended import jwt_required, get_jwt_identity

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = int(get_jwt_identity())
    
    # Get unread notifications
    notifications = Notification.query.filter_by(user_id=current_user_id).order_by(Notification.created_at.desc()).limit(10).all()
    
    result = []
    unread_count = 0
    for n in notifications:
        if not n.is_read:
            unread_count += 1
        result.append({
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "is_read": n.is_read,
            "related_entity_id": n.related_entity_id,
            "created_at": n.created_at.isoformat()
        })
        
    return jsonify({
        "success": True, 
        "notifications": result,
        "unread_count": unread_count
    }), 200

@notifications_bp.route('/mark-read', methods=['POST'])
@jwt_required()
def mark_read():
    current_user_id = int(get_jwt_identity())
    
    # Mark all as read for this user
    Notification.query.filter_by(user_id=current_user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    
    return jsonify({"success": True, "message": "Notifications marked as read"}), 200

from app.models.user import User

@notifications_bp.route('/trigger-reminders', methods=['POST'])
@jwt_required()
def trigger_reminders():
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'ADMIN':
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    # In production, this would be a celery task or cron job
    # Finds active transactions where expected_return_date is soon or passed
    active_transactions = Transaction.query.filter(
        Transaction.status == 'ACTIVE',
        Transaction.expected_return_date != None
    ).all()
    
    count = 0
    now = datetime.now(timezone.utc)
    for t in active_transactions:
        # Simplistic logic: if within 24h of return date or overdue
        delta = t.expected_return_date - now
        if delta.days <= 1:
            # Notify borrower
            notif = Notification(
                user_id=t.borrower_id,
                type='RETURN_REMINDER',
                message=f"Reminder: You need to return '{t.request.resource.title}' soon.",
                related_entity_id=t.id
            )
            db.session.add(notif)
            count += 1
            
    db.session.commit()
    return jsonify({"success": True, "message": f"Sent {count} reminders"}), 200
