from flask import Blueprint, request, jsonify
from app.extensions import db, jwt
from app.models.user import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"success": False, "message": "Missing required fields", "error_code": "MISSING_FIELDS"}), 400
        
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"success": False, "message": "Username already exists", "error_code": "USERNAME_EXISTS"}), 409
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"success": False, "message": "Email already exists", "error_code": "EMAIL_EXISTS"}), 409
        
    hashed_password = generate_password_hash(data['password'])
    
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_password,
        phone=data.get('phone'),
        address=data.get('address')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "success": True, 
        "message": "User registered successfully",
        "user_id": new_user.id
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"success": False, "message": "Missing credentials", "error_code": "MISSING_CREDENTIALS"}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({"success": False, "message": "Invalid email or password", "error_code": "INVALID_CREDENTIALS"}), 401
        
    # Create JWT
    access_token = create_access_token(identity=str(user.id), expires_delta=datetime.timedelta(days=1))
    
    return jsonify({
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"success": False, "message": "User not found", "error_code": "USER_NOT_FOUND"}), 404
        
    return jsonify({
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "address": user.address,
            "role": user.role
        }
    }), 200
