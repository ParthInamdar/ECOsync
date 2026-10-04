from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.user import User
from app.models.resource import Resource
from app.models.review import Review
from app.models.transaction import Transaction
from app.models.report import Report
from app.models.block import Block
from sqlalchemy.orm import joinedload
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, jwt_required

users_bp = Blueprint('users', __name__)

@users_bp.route('/<int:user_id>', methods=['GET'])
def get_public_profile(user_id):
    user = User.query.get_or_404(user_id)
    
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            current_user_id = int(identity)
    except Exception:
        pass
        
    if current_user_id == user_id:
        resources = Resource.query.options(joinedload(Resource.category))\
            .filter_by(owner_id=user_id).order_by(Resource.created_at.desc()).all()
    else:
        resources = Resource.query.options(joinedload(Resource.category))\
            .filter_by(owner_id=user_id, is_available=True).order_by(Resource.created_at.desc()).all()
        
    resources_data = []
    for r in resources:
        resources_data.append({
            "id": r.id,
            "title": r.title,
            "category": r.category.name if r.category else "Other",
            "sharing_type": r.sharing_type,
            "location_name": r.location_name,
            "image_url": r.image_url or "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image",
            "is_available": r.is_available,
            "created_at": r.created_at.isoformat()
        })
        
    # Get reviews for this user
    # A user gets a review when they act as a lender or borrower in a transaction.
    # To keep it simple, we find transactions where this user is the lender.
    # We find reviews tied to those transactions where the reviewer is NOT the user.
    transactions = Transaction.query.filter((Transaction.lender_id == user_id) | (Transaction.borrower_id == user_id)).all()
    transaction_ids = [t.id for t in transactions]
    
    reviews = Review.query.options(joinedload(Review.reviewer))\
        .filter(Review.transaction_id.in_(transaction_ids), Review.reviewer_id != user_id).all()
    
    reviews_data = []
    total_rating = 0
    for rev in reviews:
        total_rating += rev.rating
        reviews_data.append({
            "id": rev.id,
            "rating": rev.rating,
            "comment": rev.comment,
            "reviewer_name": rev.reviewer.username,
            "created_at": rev.created_at.isoformat()
        })
        
    avg_rating = round(total_rating / len(reviews), 1) if reviews else 0.0
    
    return jsonify({
        "success": True,
        "profile": {
            "id": user.id,
            "username": user.username,
            "created_at": user.created_at.isoformat(),
            "average_rating": avg_rating,
            "total_reviews": len(reviews),
            "resources": resources_data,
            "reviews": reviews_data
        }
    }), 200

@users_bp.route('/<int:user_id>/report', methods=['POST'])
@jwt_required()
def report_user(user_id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    reason = data.get('reason', 'Inappropriate behavior')
    description = data.get('description', '')
    
    if current_user_id == user_id:
        return jsonify({"success": False, "message": "Cannot report yourself"}), 400
        
    report = Report(
        reporter_id=current_user_id,
        reported_user_id=user_id,
        reason=reason,
        description=description
    )
    db.session.add(report)
    db.session.commit()
    
    return jsonify({"success": True, "message": "User reported successfully."}), 201

@users_bp.route('/<int:user_id>/block', methods=['POST'])
@jwt_required()
def block_user(user_id):
    current_user_id = int(get_jwt_identity())
    
    if current_user_id == user_id:
        return jsonify({"success": False, "message": "Cannot block yourself"}), 400
        
    existing = Block.query.filter_by(blocker_id=current_user_id, blocked_id=user_id).first()
    if existing:
        return jsonify({"success": False, "message": "User already blocked"}), 400
        
    block = Block(blocker_id=current_user_id, blocked_id=user_id)
    db.session.add(block)
    db.session.commit()
    
    return jsonify({"success": True, "message": "User blocked successfully."}), 201
