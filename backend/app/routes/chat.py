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
    
    from sqlalchemy.orm import joinedload
    
    # Eager load listing
    conversations = Conversation.query.options(joinedload(Conversation.listing)).filter(
        or_(Conversation.participant1_id == current_user_id,
            Conversation.participant2_id == current_user_id)
    ).order_by(Conversation.updated_at.desc()).all()
    
    if not conversations:
        return jsonify({"success": True, "conversations": []}), 200
        
    conv_ids = [c.id for c in conversations]
    
    # Batch load users
    user_ids = set()
    for c in conversations:
        user_ids.add(c.participant1_id)
        user_ids.add(c.participant2_id)
    users = {u.id: u for u in User.query.filter(User.id.in_(user_ids)).all()}
    
    # Batch load unread counts
    unread_counts_raw = db.session.query(
        Message.conversation_id, db.func.count(Message.id)
    ).filter(
        Message.conversation_id.in_(conv_ids),
        Message.is_read == False,
        Message.sender_id != current_user_id
    ).group_by(Message.conversation_id).all()
    unread_counts = {c_id: count for c_id, count in unread_counts_raw}
    
    # Batch load latest messages
    latest_msg_subq = db.session.query(
        Message.conversation_id, db.func.max(Message.created_at).label('max_date')
    ).filter(Message.conversation_id.in_(conv_ids)).group_by(Message.conversation_id).subquery()
    
    latest_msgs = db.session.query(Message).join(
        latest_msg_subq,
        and_(
            Message.conversation_id == latest_msg_subq.c.conversation_id,
            Message.created_at == latest_msg_subq.c.max_date
        )
    ).all()
    latest_msg_map = {m.conversation_id: m for m in latest_msgs}
    
    result = []
    for conv in conversations:
        other_user_id = conv.participant2_id if conv.participant1_id == current_user_id else conv.participant1_id
        other_user = users.get(other_user_id)
        
        latest_msg = latest_msg_map.get(conv.id)
        unread = unread_counts.get(conv.id, 0)
        
        result.append({
            "id": conv.id,
            "listing_id": conv.listing_id,
            "listing_title": conv.listing.title if conv.listing else "Deleted Item",
            "listing_image": conv.listing.image_url if conv.listing else None,
            "other_user_id": other_user_id,
            "other_user_name": other_user.username if other_user else "Unknown User",
            "updated_at": conv.updated_at.isoformat(),
            "latest_message": latest_msg.message_text if latest_msg else "No messages yet",
            "unread_count": unread
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
        
    p1 = min(current_user_id, owner_id)
    p2 = max(current_user_id, owner_id)
    
    # Check if conversation already exists
    conv = Conversation.query.filter_by(
        listing_id=listing_id,
        participant1_id=p1,
        participant2_id=p2
    ).first()
    
    if not conv:
        conv = Conversation(
            listing_id=listing_id,
            participant1_id=p1,
            participant2_id=p2
        )
        db.session.add(conv)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            conv = Conversation.query.filter_by(listing_id=listing_id, participant1_id=p1, participant2_id=p2).first()
        
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
        
    # Limit to last 200 messages for performance
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.desc()).limit(200).all()
    messages.reverse() # return in ascending order
    
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
