from flask import Blueprint, jsonify
from app.extensions import db
from app.models.transaction import Transaction
from flask_jwt_extended import jwt_required, get_jwt_identity

sustainability_bp = Blueprint('sustainability', __name__)

# Mock conversion rates for categories (kg of waste avoided per item reused)
CATEGORY_WASTE_RATES = {
    "Electronics": 5.5,
    "Books": 0.8,
    "Sports": 3.2,
    "Tools": 4.5,
    "Household": 2.0,
    "Vehicles": 1500.0,
    "Fashion": 1.2,
    "Other": 1.0
}

@sustainability_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_impact():
    current_user_id = int(get_jwt_identity())
    
    # Get all transactions where the user was either the lender or borrower
    transactions = Transaction.query.filter(
        (Transaction.lender_id == current_user_id) | (Transaction.borrower_id == current_user_id)
    ).all()
    
    total_items_reused = len(transactions)
    total_waste_avoided_kg = 0.0
    
    # Calculate impact
    for t in transactions:
        category_name = t.request.resource.category.name if t.request.resource.category else "Other"
        waste = CATEGORY_WASTE_RATES.get(category_name, 1.0)
        total_waste_avoided_kg += waste
        
    # Fun metrics
    trees_saved = round(total_waste_avoided_kg * 0.05, 2)
    co2_prevented_kg = round(total_waste_avoided_kg * 2.5, 2)
    
    return jsonify({
        "success": True,
        "impact": {
            "total_items_reused": total_items_reused,
            "total_waste_avoided_kg": round(total_waste_avoided_kg, 2),
            "trees_saved_equivalent": trees_saved,
            "co2_prevented_kg": co2_prevented_kg
        }
    }), 200
