import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required

upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif', 'heic'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/image', methods=['POST'])
@jwt_required()
def upload_image():
    if 'image' not in request.files:
        return jsonify({"success": False, "message": "No image part"}), 400
        
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"success": False, "message": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        file.seek(0, os.SEEK_END)
        size = file.tell()
        if size > 5 * 1024 * 1024:
            return jsonify({"success": False, "message": "File too large. Maximum size is 5MB."}), 413
        file.seek(0)
        # Create unique filename to prevent overwrites
        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{ext}"
        
        # Ensure upload dir exists
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, unique_filename)
        
        is_prod = os.environ.get('FLASK_ENV') == 'production' or os.environ.get('RENDER') == 'true'
        
        if is_prod:
            # Use Cloudinary in production
            import cloudinary
            import cloudinary.uploader
            
            cloudinary.config(
                cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
                api_key=os.environ.get('CLOUDINARY_API_KEY'),
                api_secret=os.environ.get('CLOUDINARY_API_SECRET')
            )
            
            # File object is at EOF from size check, seek to 0 again just in case
            file.seek(0)
            result = cloudinary.uploader.upload(file)
            file_url = result.get('secure_url')
        else:
            # Use local filesystem in development
            file.seek(0)
            file.save(file_path)
            
            # Use environment variable or dynamic host URL for the uploaded file link
            base_url = os.environ.get('PUBLIC_API_URL', request.host_url.rstrip('/'))
            file_url = f"{base_url}/static/uploads/{unique_filename}"
        
        return jsonify({
            "success": True,
            "url": file_url
        }), 201
        
    return jsonify({"success": False, "message": f"File type not allowed. File name was: {file.filename}"}), 400
