from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.transaction import Transaction
from app.models.notification import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    current_user_id = int(get_jwt_identity())
    
    from sqlalchemy import or_
    from app.models.review import Review
    transactions = Transaction.query.filter(
        or_(Transaction.lender_id == current_user_id, Transaction.borrower_id == current_user_id)
    ).order_by(Transaction.created_at.desc()).all()
    
    result = []
    for t in transactions:
        has_reviewed = Review.query.filter_by(transaction_id=t.id, reviewer_id=current_user_id).first() is not None
        result.append({
            "id": t.id,
            "resource_id": t.request.resource_id,
            "resource_title": t.request.resource.title,
            "lender_id": t.lender_id,
            "borrower_id": t.borrower_id,
            "has_reviewed": has_reviewed,
            "status": t.status,
            "start_date": t.start_date.isoformat() if t.start_date else None,
            "expected_return_date": t.expected_return_date.isoformat() if t.expected_return_date else None,
            "actual_return_date": t.actual_return_date.isoformat() if t.actual_return_date else None,
        })
    return jsonify({"success": True, "transactions": result}), 200

@transactions_bp.route('/<int:transaction_id>/return', methods=['PUT'])
@jwt_required()
def return_transaction(transaction_id):
    current_user_id = int(get_jwt_identity())
    
    t = db.session.get(Transaction, transaction_id)
    if not t:
        return jsonify({"success": False, "message": "Transaction not found"}), 404
        
    if current_user_id not in [t.lender_id, t.borrower_id]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    if t.status != 'ACTIVE':
        return jsonify({"success": False, "message": "Transaction is not active"}), 400
        
    t.status = 'RETURNED'
    t.actual_return_date = datetime.now(timezone.utc)
    t.request.resource.is_available = True
    
    # Notify the other party
    other_party_id = t.lender_id if current_user_id == t.borrower_id else t.borrower_id
    notif = Notification(
        user_id=other_party_id,
        type='TRANSACTION_COMPLETED',
        message=f"The item '{t.request.resource.title}' has been returned.",
        related_entity_id=t.id
    )
    db.session.add(notif)
    db.session.commit()
    
    return jsonify({"success": True, "message": "Transaction marked as returned"}), 200
