import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

ai_helpers_bp = Blueprint('ai_helpers', __name__)

@ai_helpers_bp.route('/generate-description', methods=['POST'])
@jwt_required()
def generate_description():
    data = request.get_json()
    title = data.get('title')
    category = data.get('category')
    condition = data.get('condition')
    
    if not title or not category:
        return jsonify({"success": False, "message": "Title and category are required"}), 400
        
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key or api_key == 'your_api_key_here':
        return jsonify({"success": False, "message": "Groq API Key not configured."}), 503
        
    client = Groq(api_key=api_key)
    
    prompt = f"""
    You are an expert copywriter for a community marketplace called EcoSync.
    Write a persuasive, engaging, and clear description for the following item:
    Title: {title}
    Category: {category}
    Condition: {condition}
    
    The description should:
    1. Highlight the potential benefits and uses of the item.
    2. Mention the condition '{condition}' naturally.
    3. Be friendly and encourage community sharing.
    4. Be around 3-4 short paragraphs (max 150 words).
    
    Return ONLY the raw description text without any formatting, quotes, or markdown wrappers. Do not say "Here is your description".
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a direct output assistant. Output only the requested text."},
                {"role": "user", "content": prompt}
            ],
            model="openai/gpt-oss-120b",
            temperature=0.7,
        )
        
        description = chat_completion.choices[0].message.content.strip()
        return jsonify({"success": True, "description": description}), 200
        
    except Exception as e:
        print(f"Groq API Error: {e}")
        return jsonify({"success": False, "message": "Failed to generate description"}), 500

@ai_helpers_bp.route('/suggest-price', methods=['POST'])
@jwt_required()
def suggest_price():
    data = request.get_json()
    title = data.get('title')
    category = data.get('category')
    condition = data.get('condition')
    listing_type = data.get('listing_type', 'SELL') # SELL or RENT
    
    if not title or not category:
        return jsonify({"success": False, "message": "Title and category are required"}), 400
        
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key or api_key == 'your_api_key_here':
        return jsonify({"success": False, "message": "Groq API Key not configured."}), 503
        
    client = Groq(api_key=api_key)
    
    prompt = f"""
    You are an AI pricing expert for a second-hand marketplace in India (prices in INR ₹).
    Suggest a fair {listing_type.lower()} price for the following item:
    Title: {title}
    Category: {category}
    Condition: {condition}
    
    If listing_type is SELL, suggest the outright sale price.
    If listing_type is RENT, suggest a reasonable per day rental price.
    
    Output ONLY a single integer number representing the suggested price in INR. 
    Do NOT include the ₹ symbol, commas, words, or explanations. Just the number.
    Example output: 1500
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a direct output assistant. Output only the requested integer."},
                {"role": "user", "content": prompt}
            ],
            model="openai/gpt-oss-120b",
            temperature=0.3,
        )
        
        price_str = chat_completion.choices[0].message.content.strip()
        # Clean up any potential non-numeric characters just in case
        price_digits = ''.join(filter(str.isdigit, price_str))
        
        if not price_digits:
            return jsonify({"success": False, "message": "AI failed to generate a numeric price"}), 500
            
        return jsonify({"success": True, "suggested_price": int(price_digits)}), 200
        
    except Exception as e:
        print(f"Groq API Error: {e}")
        return jsonify({"success": False, "message": "Failed to suggest price"}), 500
