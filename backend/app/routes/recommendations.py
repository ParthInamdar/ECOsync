import os
import json
from flask import Blueprint, jsonify, request
from app.extensions import db
from sqlalchemy.orm import joinedload
from app.models.resource import Resource
from app.models.request import Request
from flask_jwt_extended import jwt_required, get_jwt_identity
from groq import Groq
from dotenv import load_dotenv
from app.utils.geo import haversine
import time

load_dotenv()

RECOMMENDATIONS_CACHE = {}
CACHE_TTL = 3600  # 1 hour

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('/', methods=['GET'])
@jwt_required()
def get_recommendations():
    current_user_id = int(get_jwt_identity())
    
    user_lat = request.args.get('lat', type=float)
    user_lon = request.args.get('lon', type=float)
    
    # Check cache first
    cache_key = f"{current_user_id}_{round(user_lat, 2) if user_lat else 'none'}_{round(user_lon, 2) if user_lon else 'none'}"
    current_time = time.time()
    if cache_key in RECOMMENDATIONS_CACHE:
        cached_data = RECOMMENDATIONS_CACHE[cache_key]
        if current_time - cached_data['timestamp'] < CACHE_TTL:
            return jsonify(cached_data['data']), 200
    
    # 1. Check API Key
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key or api_key == 'your_api_key_here':
        return jsonify({"success": False, "message": "Groq API Key not configured."}), 503
        
    client = Groq(api_key=api_key)
    

    # 2. Gather User Context (Past requests)
    past_requests = Request.query.filter_by(requester_id=current_user_id).limit(10).all()
    user_context = [req.resource.title for req in past_requests]
    user_context_str = ", ".join(user_context) if user_context else "No past history."
    
    # 3. Gather Available Resources (Exclude user's own items)
    available = Resource.query.options(joinedload(Resource.category))\
        .filter(Resource.is_available == True, Resource.owner_id != current_user_id).limit(50).all()
    
    if not available:
        return jsonify({"success": True, "recommendations": []}), 200
        
    catalog = []
    for r in available:
        distance = None
        if user_lat is not None and user_lon is not None and r.location_lat is not None and r.location_lon is not None:
            distance = round(haversine(user_lat, user_lon, r.location_lat, r.location_lon), 1)
            
        catalog.append({
            "id": r.id,
            "title": r.title,
            "category": r.category.name if r.category else "Other",
            "listing_type": r.listing_type,
            "price": r.price,
            "distance_km": distance
        })
        
    # 4. Construct Prompt
    prompt = f"""
    You are an AI matchmaking assistant for a local community sharing app.
    A user is looking for items to borrow, rent, or buy.
    
    User's past borrowed/interacted items: {user_context_str}
    User Location provided: {'Yes' if user_lat else 'No'}
    
    Here is the catalog of currently available items (as a JSON array):
    {json.dumps(catalog)}
    
    Analyze the user's past items to infer their interests. 
    Then, select the top 4 most relevant items from the catalog for them.
    
    IMPORTANT RANKING CRITERIA:
    1. Relevance to past interests.
    2. Proximity: If 'distance_km' is available, strongly prioritize items that are closer (e.g. < 5km).
    3. Affordability: Prioritize FREE or DONATE items, or items with lower prices.
    
    If they have no past history, pick 4 diverse, nearby, and affordable/free items.
    
    Return ONLY a raw JSON array of the IDs of the 4 recommended items. 
    Example format: [12, 45, 3, 9]
    Do not include markdown blocks, just the JSON array.
    """
    
    # 5. Call Groq
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that strictly outputs JSON arrays of integers without any other text."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="openai/gpt-oss-120b",
            temperature=0.2,
        )
        
        text_response = chat_completion.choices[0].message.content.strip().replace('```json', '').replace('```', '')

        
        recommended_ids = json.loads(text_response)
        
        # Make sure it's a list
        if not isinstance(recommended_ids, list):
            recommended_ids = [r.id for r in available[:4]]
            
    except Exception as e:
        print(f"Groq API Error: {e}")
        # Fallback: Just return recent available resources
        recommended_ids = [r.id for r in available[:4]]
    # 6. Fetch full resource details for recommended IDs
    recommended_resources = Resource.query.options(joinedload(Resource.category))\
        .filter(Resource.id.in_(recommended_ids)).all()
    
    result = []
    for r in recommended_resources:
        result.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "category": r.category.name if r.category else "Other",
            "condition": r.condition,
            "sharing_type": r.sharing_type,
            "location_name": r.location_name,
            "image_url": r.image_url or "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image",
            "owner_id": r.owner_id
        })
        
    response_data = {
        "success": True, 
        "recommendations": result,
        "ai_reasoning": "Based on your past activity and local availability."
    }
    
    RECOMMENDATIONS_CACHE[cache_key] = {
        "timestamp": current_time,
        "data": response_data
    }
    
    return jsonify(response_data), 200
