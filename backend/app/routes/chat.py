from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.resource import Resource
from app.models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/', methods=['GET'])
@jwt_required()
def get_conversations():
    current_user_id = int(get_jwt_identity())
    
    # Get all conversations where user is participant1 or participant2
    conversations = Conversation.query.filter(
        or_(Conversation.participant1_id == current_user_id,
            Conversation.participant2_id == current_user_id)
    ).order_by(Conversation.updated_at.desc()).all()
    
    result = []
    for conv in conversations:
        other_user_id = conv.participant2_id if conv.participant1_id == current_user_id else conv.participant1_id
        other_user = User.query.get(other_user_id)
        
        # Get latest message
        latest_msg = Message.query.filter_by(conversation_id=conv.id).order_by(Message.created_at.desc()).first()
        
        result.append({
            "id": conv.id,
            "listing_id": conv.listing_id,
            "listing_title": conv.listing.title if conv.listing else "Deleted Item",
            "listing_image": conv.listing.image_url if conv.listing else None,
            "other_user_id": other_user_id,
            "other_user_name": other_user.username if other_user else "Unknown User",
            "updated_at": conv.updated_at.isoformat(),
            "latest_message": latest_msg.message_text if latest_msg else "No messages yet",
            "unread_count": Message.query.filter_by(conversation_id=conv.id, sender_id=other_user_id, is_read=False).count()
        })
        
    return jsonify({"success": True, "conversations": result}), 200

@chat_bp.route('/', methods=['POST'])
@jwt_required()
def create_or_get_conversation():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    listing_id = data.get('listing_id')
    if not listing_id:
        return jsonify({"success": False, "message": "Listing ID required"}), 400
        
    listing = Resource.query.get_or_404(listing_id)
    owner_id = listing.owner_id
    
    if current_user_id == owner_id:
        return jsonify({"success": False, "message": "Cannot chat with yourself"}), 400
        
    # Check if conversation already exists
    conv = Conversation.query.filter(
        and_(Conversation.listing_id == listing_id,
             or_(
                 and_(Conversation.participant1_id == current_user_id, Conversation.participant2_id == owner_id),
                 and_(Conversation.participant1_id == owner_id, Conversation.participant2_id == current_user_id)
             ))
    ).first()
    
    if not conv:
        conv = Conversation(
            listing_id=listing_id,
            participant1_id=current_user_id,
            participant2_id=owner_id
        )
        db.session.add(conv)
        db.session.commit()
        
    return jsonify({"success": True, "conversation_id": conv.id}), 200

@chat_bp.route('/<int:conversation_id>', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    current_user_id = int(get_jwt_identity())
    conv = Conversation.query.get_or_404(conversation_id)
    
    if current_user_id not in [conv.participant1_id, conv.participant2_id]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    other_user_id = conv.participant2_id if conv.participant1_id == current_user_id else conv.participant1_id
    other_user = User.query.get(other_user_id)
        
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.asc()).all()
    
    # Mark as read
    unread_msgs = [m for m in messages if m.sender_id != current_user_id and not m.is_read]
    if unread_msgs:
        for m in unread_msgs:
            m.is_read = True
        db.session.commit()
        
    result = []
    for m in messages:
        result.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "text": m.message_text,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat()
        })
        
    return jsonify({
        "success": True, 
        "messages": result,
        "listing": {
            "id": conv.listing.id,
            "title": conv.listing.title,
            "price": conv.listing.price,
            "image": conv.listing.image_url
        },
        "other_user": {
            "id": other_user_id,
            "name": other_user.username
        }
    }), 200

@chat_bp.route('/<int:conversation_id>/message', methods=['POST'])
@jwt_required()
def send_message(conversation_id):
    current_user_id = int(get_jwt_identity())
    conv = Conversation.query.get_or_404(conversation_id)
    
    if current_user_id not in [conv.participant1_id, conv.participant2_id]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    data = request.get_json()
    text = data.get('text')
    
    if not text:
        return jsonify({"success": False, "message": "Message cannot be empty"}), 400
        
    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user_id,
        message_text=text
    )
    
    db.session.add(msg)
    conv.updated_at = db.func.current_timestamp()
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "text": msg.message_text,
            "is_read": msg.is_read,
            "created_at": msg.created_at.isoformat()
        }
    }), 201

@chat_bp.route('/unread', methods=['GET'])
@jwt_required()
def get_unread_count():
    current_user_id = int(get_jwt_identity())
    
    # We need to count messages where is_read=False, sender_id != current_user_id,
    # and the message belongs to a conversation where the current user is a participant.
    
    unread_count = db.session.query(Message).join(Conversation).filter(
        Message.is_read == False,
        Message.sender_id != current_user_id,
        or_(Conversation.participant1_id == current_user_id,
            Conversation.participant2_id == current_user_id)
    ).count()
    
    return jsonify({"success": True, "unread_count": unread_count}), 200
