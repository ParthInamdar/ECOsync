from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.review import Review
from app.models.transaction import Transaction
from app.models.notification import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity

reviews_bp = Blueprint('reviews', __name__)

@reviews_bp.route('/', methods=['POST'])
@jwt_required()
def create_review():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    transaction_id = data.get('transaction_id')
    rating = data.get('rating')
    comment = data.get('comment', '')
    
    if not transaction_id or not rating:
        return jsonify({"success": False, "message": "Transaction ID and rating are required"}), 400
        
    # Ensure rating is between 1 and 5
    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            raise ValueError
    except ValueError:
        return jsonify({"success": False, "message": "Rating must be an integer between 1 and 5"}), 400

    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return jsonify({"success": False, "message": "Transaction not found"}), 404
        
    # Ensure the user is part of the transaction
    if current_user_id not in [transaction.lender_id, transaction.borrower_id]:
        return jsonify({"success": False, "message": "You can only review your own transactions"}), 403
        
    # Check if this user already left a review for this transaction
    existing_review = Review.query.filter_by(transaction_id=transaction_id, reviewer_id=current_user_id).first()
    if existing_review:
        return jsonify({"success": False, "message": "You have already reviewed this transaction"}), 400

    new_review = Review(
        transaction_id=transaction_id,
        reviewer_id=current_user_id,
        rating=rating,
        comment=comment
    )
    
    # Mark transaction as completed if it isn't already
    if transaction.status == 'ACTIVE':
        transaction.status = 'COMPLETED'
        
    db.session.add(new_review)
    
    # Notify the other party
    other_party_id = transaction.lender_id if current_user_id == transaction.borrower_id else transaction.borrower_id
    notif = Notification(
        user_id=other_party_id,
        type='NEW_REVIEW',
        message=f"You received a new {rating}-star review for a completed transaction.",
        related_entity_id=transaction_id
    )
    db.session.add(notif)
    
    db.session.commit()
    
    return jsonify({
        "success": True, 
        "message": "Review submitted successfully!"
    }), 201
