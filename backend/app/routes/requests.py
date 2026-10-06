from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.request import Request
from app.models.resource import Resource
from app.models.transaction import Transaction
from app.models.notification import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

requests_bp = Blueprint('requests', __name__)

@requests_bp.route('/', methods=['POST'])
@jwt_required()
def create_request():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    resource_id = data.get('resource_id')
    message = data.get('message', '')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')
    
    start_date = None
    end_date = None
    if start_date_str:
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
    if end_date_str:
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
    
    if start_date and end_date and start_date >= end_date:
        return jsonify({"success": False, "message": "End date must be after start date"}), 400
        
    if not resource_id:
        return jsonify({"success": False, "message": "Resource ID is required"}), 400
        
    resource = Resource.query.get(resource_id)
    if not resource:
        return jsonify({"success": False, "message": "Resource not found"}), 404
        
    if resource.owner_id == current_user_id:
        return jsonify({"success": False, "message": "You cannot request your own resource"}), 400
        
    # Check if a pending request already exists
    existing_req = Request.query.filter_by(
        requester_id=current_user_id, 
        resource_id=resource_id, 
        status='PENDING'
    ).first()
    
    if existing_req:
        return jsonify({"success": False, "message": "You already have a pending request for this item"}), 400
        
    new_request = Request(
        requester_id=current_user_id,
        resource_id=resource_id,
        message=message,
        start_date=start_date,
        end_date=end_date,
        status='PENDING'
    )
    
    db.session.add(new_request)
    db.session.flush() # To get new_request.id
    
    from app.models.user import User
    requester = User.query.get(current_user_id)
    requester_name = requester.username if requester else "Someone"

    # Notify owner
    notif = Notification(
        user_id=resource.owner_id,
        type='NEW_REQUEST',
        message=f"{requester_name} wants to {resource.sharing_type.lower()} your '{resource.title}'.",
        related_entity_id=new_request.id
    )
    db.session.add(notif)
    
    db.session.commit()
    
    return jsonify({
        "success": True, 
        "message": "Request sent successfully",
        "request_id": new_request.id
    }), 201

@requests_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_requests():
    """Get requests made by the current user (Outgoing)"""
    current_user_id = int(get_jwt_identity())
    
    my_requests = Request.query.filter_by(requester_id=current_user_id).order_by(Request.created_at.desc()).all()
    
    result = []
    for req in my_requests:
        result.append({
            "id": req.id,
            "resource_id": req.resource_id,
            "resource_title": req.resource.title,
            "resource_image": req.resource.image_url,
            "owner_name": req.resource.owner.username,
            "status": req.status,
            "message": req.message,
            "transaction_id": req.transaction.id if req.transaction else None,
            "created_at": req.created_at.isoformat()
        })
        
    return jsonify({"success": True, "requests": result}), 200

@requests_bp.route('/incoming', methods=['GET'])
@jwt_required()
def get_incoming_requests():
    """Get requests made to the current user's resources (Incoming)"""
    current_user_id = int(get_jwt_identity())
    
    # Get all resources owned by user
    my_resources_ids = [r.id for r in Resource.query.filter_by(owner_id=current_user_id).all()]
    
    incoming = Request.query.filter(Request.resource_id.in_(my_resources_ids)).order_by(Request.created_at.desc()).all()
    
    result = []
    for req in incoming:
        result.append({
            "id": req.id,
            "resource_id": req.resource_id,
            "resource_title": req.resource.title,
            "requester_name": req.requester.username,
            "requester_id": req.requester_id,
            "status": req.status,
            "message": req.message,
            "transaction_id": req.transaction.id if req.transaction else None,
            "created_at": req.created_at.isoformat()
        })
        
    return jsonify({"success": True, "requests": result}), 200

@requests_bp.route('/<int:request_id>', methods=['PATCH'])
@jwt_required()
def update_request_status(request_id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['ACCEPTED', 'REJECTED', 'CANCELLED']:
        return jsonify({"success": False, "message": "Invalid status"}), 400
        
    req = Request.query.get(request_id)
    if not req:
        return jsonify({"success": False, "message": "Request not found"}), 404
        
    # Check permissions
    if new_status == 'CANCELLED' and req.requester_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    if new_status in ['ACCEPTED', 'REJECTED'] and req.resource.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    req.status = new_status
    
    # If accepted, create a transaction and mark resource as unavailable
    if new_status == 'ACCEPTED':
        if not req.resource.is_available:
            return jsonify({"success": False, "message": "Resource is no longer available"}), 409
            
        transaction = Transaction(
            request_id=req.id,
            lender_id=req.resource.owner_id,
            borrower_id=req.requester_id,
            start_date=req.start_date or datetime.utcnow(),
            expected_return_date=req.end_date,
            status='ACTIVE'
        )
        db.session.add(transaction)
        req.resource.is_available = False
        
        # Notify requester
        notif = Notification(
            user_id=req.requester_id,
            type='REQUEST_ACCEPTED',
            message=f"Your request for '{req.resource.title}' was approved!",
            related_entity_id=req.id
        )
        db.session.add(notif)
        
        # Add automated chat message
        from app.models.conversation import Conversation
        from app.models.message import Message
        from sqlalchemy import and_, or_
        
        conv = Conversation.query.filter(
            and_(Conversation.listing_id == req.resource_id,
                 or_(
                     and_(Conversation.participant1_id == req.requester_id, Conversation.participant2_id == req.resource.owner_id),
                     and_(Conversation.participant1_id == req.resource.owner_id, Conversation.participant2_id == req.requester_id)
                 ))
        ).first()
        
        if not conv:
            conv = Conversation(
                listing_id=req.resource_id,
                participant1_id=req.resource.owner_id,
                participant2_id=req.requester_id
            )
            db.session.add(conv)
            db.session.flush()
            
        auto_msg = Message(
            conversation_id=conv.id,
            sender_id=req.resource.owner_id,
            message_text=f"✅ Your request for '{req.resource.title}' has been accepted! Let's arrange the details here."
        )
        db.session.add(auto_msg)
        conv.updated_at = db.func.current_timestamp()
        
    elif new_status == 'REJECTED':
        # Notify requester
        notif = Notification(
            user_id=req.requester_id,
            type='REQUEST_REJECTED',
            message=f"Your request for '{req.resource.title}' was declined.",
            related_entity_id=req.id
        )
        db.session.add(notif)
        
    db.session.commit()
    
    return jsonify({"success": True, "message": f"Request marked as {new_status}"}), 200
