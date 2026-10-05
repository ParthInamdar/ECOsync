from flask import Blueprint, jsonify
from app.extensions import db
from app.models.user import User
from app.models.resource import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity

admin_bp = Blueprint('admin', __name__)

def is_admin(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'ADMIN'

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    users = User.query.all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at.isoformat()
        })
    return jsonify({"success": True, "users": result}), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    if current_user_id == user_id:
        return jsonify({"success": False, "message": "Cannot delete yourself"}), 400
        
    user = User.query.get_or_404(user_id)
    
    # In a real app we'd handle cascading deletes or soft deletes carefully
    db.session.delete(user)
    db.session.commit()
    return jsonify({"success": True, "message": "User deleted"}), 200

@admin_bp.route('/resources', methods=['GET'])
@jwt_required()
def get_resources():
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    resources = Resource.query.all()
    result = []
    for r in resources:
        result.append({
            "id": r.id,
            "title": r.title,
            "owner": r.owner.username if r.owner else "Unknown",
            "is_available": r.is_available,
            "created_at": r.created_at.isoformat()
        })
    return jsonify({"success": True, "resources": result}), 200

@admin_bp.route('/resources/<int:resource_id>', methods=['DELETE'])
@jwt_required()
def delete_resource(resource_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    resource = Resource.query.get_or_404(resource_id)
    db.session.delete(resource)
    db.session.commit()
    return jsonify({"success": True, "message": "Resource deleted"}), 200

from app.models.activity import ActivityLog

@admin_bp.route('/activities', methods=['GET'])
@jwt_required()
def get_activities():
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    # Order by newest first
    activities = ActivityLog.query.order_by(ActivityLog.created_at.desc()).all()
    result = [a.to_dict() for a in activities]
    
    return jsonify({"success": True, "activities": result}), 200

from app.models.issue import Issue

@admin_bp.route('/issues', methods=['GET'])
@jwt_required()
def get_issues():
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    issues = Issue.query.order_by(Issue.created_at.desc()).all()
    result = []
    for i in issues:
        result.append({
            "id": i.id,
            "username": i.user.username if i.user else "Guest",
            "description": i.description,
            "ai_response": i.ai_response,
            "status": i.status,
            "created_at": i.created_at.isoformat()
        })
        
    return jsonify({"success": True, "issues": result}), 200
