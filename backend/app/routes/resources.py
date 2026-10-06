from flask import Blueprint, request, jsonify
from app.extensions import db
from sqlalchemy.orm import joinedload, selectinload
from app.models.resource import Resource
from app.models.category import Category
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.transaction import Transaction
from app.models.request import Request
from flask_jwt_extended import verify_jwt_in_request
from app.utils.geo import haversine
from app.models.review import Review

resources_bp = Blueprint('resources', __name__)

@resources_bp.route('/', methods=['GET'])
def get_resources():
    # Simple fetching for now (we'll add search/filtering later in Phase 5)
    resources = Resource.query.filter_by(is_available=True)\
        .options(joinedload(Resource.category), selectinload(Resource.images))\
        .order_by(Resource.created_at.desc()).all()
    
    result = []
    for r in resources:
        result.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "category": r.category.name if r.category else "Other",
            "condition": r.condition,
            "listing_type": r.listing_type,
            "sharing_type": r.sharing_type, # fallback
            "price": r.price,
            "price_unit": r.price_unit,
            "security_deposit": r.security_deposit,
            "location_name": r.location_name,
            "image_url": r.image_url or "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image",
            "images": [img.image_url for img in r.images],
            "owner_id": r.owner_id,
            "created_at": r.created_at.isoformat()
        })
        
    return jsonify({"success": True, "resources": result}), 200

@resources_bp.route('/search', methods=['GET'])
def search_resources():
    query = request.args.get('q', '')
    category_name = request.args.get('category', '')
    sharing_type = request.args.get('sharing_type', '')
    
    base_query = Resource.query.filter_by(is_available=True)\
        .options(joinedload(Resource.category), selectinload(Resource.images))
    
    if query:
        base_query = base_query.filter(Resource.title.ilike(f'%{query}%') | Resource.description.ilike(f'%{query}%'))
        
    if category_name:
        # Need to join with Category table to filter by category name
        base_query = base_query.join(Category).filter(Category.name.ilike(f'{category_name}'))
        
    if sharing_type:
        base_query = base_query.filter((Resource.sharing_type == sharing_type) | (Resource.listing_type == sharing_type))
        
    listing_type = request.args.get('listing_type', '')
    if listing_type:
        base_query = base_query.filter_by(listing_type=listing_type)
        
    resources = base_query.order_by(Resource.created_at.desc()).all()
    
    user_lat = request.args.get('lat', type=float)
    user_lon = request.args.get('lon', type=float)
    radius = request.args.get('radius', type=float)
    
    result = []
    for r in resources:
        distance = None
        if user_lat is not None and user_lon is not None and r.location_lat is not None and r.location_lon is not None:
            distance = haversine(user_lat, user_lon, r.location_lat, r.location_lon)
            if radius is not None and distance > radius:
                continue # Skip outside radius
                
        result.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "category": r.category.name if r.category else "Other",
            "condition": r.condition,
            "listing_type": r.listing_type,
            "sharing_type": r.sharing_type,
            "price": r.price,
            "price_unit": r.price_unit,
            "location_name": r.location_name,
            "distance": round(distance, 1) if distance is not None else None,
            "image_url": r.image_url or "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image",
            "owner_id": r.owner_id,
            "created_at": r.created_at.isoformat()
        })
        
    if user_lat is not None and user_lon is not None:
        # Sort by distance
        result.sort(key=lambda x: x['distance'] if x['distance'] is not None else 999999)
        
    return jsonify({"success": True, "resources": result}), 200

@resources_bp.route('/nearby', methods=['GET'])
def get_nearby():
    # Similar to search but strictly for nearby queries
    return search_resources()

@resources_bp.route('/<int:resource_id>', methods=['GET'])
def get_resource(resource_id):
    r = Resource.query.options(
        joinedload(Resource.category), 
        selectinload(Resource.images),
        joinedload(Resource.owner)
    ).filter_by(id=resource_id).first_or_404()
    
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            current_user_id = int(identity)
    except Exception:
        pass
        
    # Location Privacy: Only show exact location to the owner
    is_owner = (current_user_id == r.owner_id)
    safe_lat = r.location_lat
    safe_lon = r.location_lon
    
    if not is_owner and safe_lat is not None and safe_lon is not None:
        # Approximate to ~1.1km by rounding to 2 decimal places
        safe_lat = round(safe_lat, 2)
        safe_lon = round(safe_lon, 2)
        
    # Owner Rating
    transactions = Transaction.query.filter((Transaction.lender_id == r.owner_id) | (Transaction.borrower_id == r.owner_id)).all()
    transaction_ids = [t.id for t in transactions]
    reviews = Review.query.filter(Review.transaction_id.in_(transaction_ids), Review.reviewer_id != r.owner_id).all()
    
    total_rating = sum([rev.rating for rev in reviews])
    avg_rating = round(total_rating / len(reviews), 1) if reviews else 0.0
    
    # Request Status
    has_requested = False
    if current_user_id and not is_owner:
        existing_request = Request.query.filter_by(
            resource_id=resource_id, 
            requester_id=current_user_id
        ).filter(Request.status.in_(['PENDING', 'ACCEPTED'])).first()
        has_requested = bool(existing_request)
    
    return jsonify({
        "success": True,
        "resource": {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "category": r.category.name if r.category else "Other",
            "category_id": r.category_id,
            "condition": r.condition,
            "listing_type": r.listing_type,
            "sharing_type": r.sharing_type,
            "price": r.price,
            "price_unit": r.price_unit,
            "security_deposit": r.security_deposit,
            "ai_condition_assessment": r.ai_condition_assessment,
            "is_available": r.is_available,
            "location_name": r.location_name,
            "location_lat": safe_lat,
            "location_lon": safe_lon,
            "image_url": r.image_url or "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image",
            "images": [img.image_url for img in r.images],
            "owner_id": r.owner_id,
            "owner_name": r.owner.username, # Assumes backref exists
            "owner_rating": avg_rating,
            "owner_reviews": len(reviews),
            "owner_member_since": r.owner.created_at.year if r.owner.created_at else 2026,
            "has_requested": has_requested,
            "created_at": r.created_at.isoformat()
        }
    }), 200

@resources_bp.route('/<int:resource_id>/availability', methods=['GET'])
def get_resource_availability(resource_id):
    transactions = Transaction.query.join(Request).filter(
        Request.resource_id == resource_id,
        Transaction.status == 'ACTIVE'
    ).all()
    
    booked_dates = []
    for t in transactions:
        if t.start_date and t.expected_return_date:
            booked_dates.append({
                "start_date": t.start_date.isoformat(),
                "end_date": t.expected_return_date.isoformat()
            })
            
    return jsonify({"success": True, "booked_dates": booked_dates}), 200

@resources_bp.route('/<int:resource_id>/status', methods=['PUT'])
@jwt_required()
def update_resource_status(resource_id):
    current_user_id = int(get_jwt_identity())
    resource = Resource.query.get_or_404(resource_id)
    
    if resource.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403
        
    data = request.get_json()
    if 'is_available' in data:
        resource.is_available = bool(data['is_available'])
        db.session.commit()
        
    return jsonify({"success": True, "is_available": resource.is_available}), 200

@resources_bp.route('/', methods=['POST'])
@jwt_required()
def create_resource():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('category_id'):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
        
    price = float(data.get('price') or 0.0)
    deposit = float(data.get('security_deposit') or 0.0)
    lat = data.get('location_lat')
    lon = data.get('location_lon')
    listing_type = data.get('listing_type', 'FREE')
    
    if price < 0:
        return jsonify({"success": False, "message": "Price cannot be negative"}), 422
    if deposit < 0:
        return jsonify({"success": False, "message": "Security deposit cannot be negative"}), 422
        
    if lat is not None:
        try:
            lat = float(lat)
            if lat < -90 or lat > 90:
                return jsonify({"success": False, "message": "Invalid latitude"}), 422
        except ValueError:
            return jsonify({"success": False, "message": "Invalid latitude format"}), 422
            
    if lon is not None:
        try:
            lon = float(lon)
            if lon < -180 or lon > 180:
                return jsonify({"success": False, "message": "Invalid longitude"}), 422
        except ValueError:
            return jsonify({"success": False, "message": "Invalid longitude format"}), 422
            
    if listing_type not in ['SELL', 'RENT', 'BORROW', 'DONATE', 'FREE']:
        return jsonify({"success": False, "message": "Invalid listing type"}), 422
        
    from app.models.resource_image import ResourceImage
    
    new_resource = Resource(
        title=data['title'],
        description=data.get('description', ''),
        category_id=data['category_id'],
        owner_id=current_user_id,
        condition=data.get('condition', 'Good'),
        listing_type=data.get('listing_type', 'FREE'),
        sharing_type=data.get('sharing_type', 'Borrow'),
        price=float(data.get('price') or 0.0),
        price_unit=data.get('price_unit'),
        security_deposit=float(data.get('security_deposit') or 0.0),
        ai_condition_assessment=data.get('ai_condition_assessment'),
        location_name=data.get('location_name', 'Unknown Location'),
        location_lat=data.get('location_lat'),
        location_lon=data.get('location_lon'),
        image_url=data.get('image_url')
    )
    
    db.session.add(new_resource)
    db.session.commit()
    
    # Handle multiple images
    images = data.get('images', [])
    for img_url in images:
        if img_url:
            new_img = ResourceImage(resource_id=new_resource.id, image_url=img_url)
            db.session.add(new_img)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": "Resource created successfully",
        "resource_id": new_resource.id
    }), 201

@resources_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    result = [{"id": c.id, "name": c.name} for c in categories]
    return jsonify({"success": True, "categories": result}), 200
