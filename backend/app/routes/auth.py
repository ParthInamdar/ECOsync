from flask import Blueprint, request, jsonify
from app.extensions import db, jwt
from app.models.user import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import datetime
from datetime import timezone

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"success": False, "message": "Missing required fields", "error_code": "MISSING_FIELDS"}), 400
        
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"success": False, "message": "This username is already taken by another account. Please choose a different username.", "error_code": "USERNAME_EXISTS"}), 409
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"success": False, "message": "This email is already registered. Try logging in instead.", "error_code": "EMAIL_EXISTS"}), 409
        
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
    
    if not user:
        return jsonify({"success": False, "message": "This email is not registered. Please sign up first.", "error_code": "USER_NOT_FOUND"}), 404
        
    if not check_password_hash(user.password_hash, data['password']):
        return jsonify({"success": False, "message": "Invalid password. Please try again.", "error_code": "INVALID_PASSWORD"}), 401
        
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

import random
import smtplib
from email.mime.text import MIMEText
import os

@auth_bp.route('/send-reset-code', methods=['POST'])
def send_reset_code():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        # Don't reveal if account exists or not for security, but we do here for UX
        return jsonify({"success": False, "message": "No account found matching this email"}), 404
        
    # Generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    user.reset_code = code
    user.reset_expiry = datetime.now(timezone.utc) + datetime.timedelta(minutes=15)
    db.session.commit()
    
    # Send email (ensure MAIL_USERNAME and MAIL_PASSWORD are in .env)
    sender_email = os.environ.get('MAIL_USERNAME')
    sender_password = os.environ.get('MAIL_PASSWORD')
    
    if not sender_email or not sender_password:
        print(f"--- MOCK EMAIL --- To: {email} | Code: {code}", flush=True)
        return jsonify({"success": True, "message": "Verification code generated. (Check server console since email isn't configured)"}), 200
        
    try:
        msg = MIMEText(f"Your EcoSync password reset code is: {code}\nThis code expires in 15 minutes.")
        msg['Subject'] = 'EcoSync Password Reset Code'
        msg['From'] = sender_email
        msg['To'] = email
        
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return jsonify({"success": True, "message": "Verification code sent to your email"}), 200
    except Exception as e:
        print(f"Email Error: {e}")
        return jsonify({"success": False, "message": "Failed to send email. Check server configuration."}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    
    email = data.get('email')
    code = data.get('code')
    new_password = data.get('new_password')
    
    if not email or not code or not new_password:
        return jsonify({"success": False, "message": "Email, code, and new password are required"}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"success": False, "message": "No account found"}), 404
        
    if not user.reset_code or not user.reset_expiry:
        return jsonify({"success": False, "message": "No reset request found for this email"}), 400
        
    if datetime.now(timezone.utc) > user.reset_expiry:
        user.reset_code = None
        user.reset_expiry = None
        db.session.commit()
        return jsonify({"success": False, "message": "Verification code has expired"}), 400
        
    if user.reset_code != code:
        return jsonify({"success": False, "message": "Invalid verification code"}), 400
        
    user.password_hash = generate_password_hash(new_password)
    user.reset_code = None
    user.reset_expiry = None
    db.session.commit()
    
    return jsonify({"success": True, "message": "Password reset successfully. You can now login."}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    
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
