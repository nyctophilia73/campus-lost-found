"""
Campus Lost & Found - Backend Application
=========================================
A lightweight Flask web application for managing campus lost and found items.
Uses a flat JSON file (items.json) as the data store without external databases.
Designed for 3rd-semester CSE Software Engineering micro-projects.
"""

import json
import os
from flask import Flask, render_template, request, jsonify

# Initialize Flask application
app = Flask(__name__)

# Path to the JSON data file
DATA_FILE = os.path.join(os.path.dirname(__file__), 'items.json')


def load_items():
    """
    Reads and returns the list of items from items.json.
    If the file is missing or corrupted, returns an empty list or initializes it.
    """
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except (json.JSONDecodeError, IOError):
        # Gracefully handle file read or parsing errors
        return []


def save_items(items):
    """
    Writes the list of items to items.json formatted with 2-space indentation.
    """
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(items, f, indent=2, ensure_ascii=False)
        return True
    except IOError:
        return False


# ============================================================================
# FRONTEND ROUTE
# ============================================================================

@app.route('/')
def index():
    """Renders the main single-page web interface."""
    return render_template('index.html')


# ============================================================================
# RESTful API ENDPOINTS
# ============================================================================

@app.route('/api/items', methods=['GET'])
def get_all_items():
    """
    GET /api/items
    Returns all items stored in the JSON file.
    Optional query parameters:
      - type: 'lost' or 'found'
      - category: filter by category name
      - status: 'Active' or 'Resolved'
      - q: search query matching name, location, or description
    """
    items = load_items()

    item_type = request.args.get('type')
    category = request.args.get('category')
    status = request.args.get('status')
    search_query = request.args.get('q', '').strip().lower()

    filtered = items

    # Optional server-side filters if requested
    if item_type and item_type.lower() != 'all':
        filtered = [item for item in filtered if item.get('type', '').lower() == item_type.lower()]

    if category and category.lower() != 'all':
        filtered = [item for item in filtered if item.get('category', '').lower() == category.lower()]

    if status and status.lower() != 'all':
        filtered = [item for item in filtered if item.get('status', '').lower() == status.lower()]

    if search_query:
        filtered = [
            item for item in filtered
            if search_query in item.get('item_name', '').lower()
            or search_query in item.get('category', '').lower()
            or search_query in item.get('location', '').lower()
            or search_query in item.get('description', '').lower()
            or search_query in item.get('identifying_details', '').lower()
        ]

    return jsonify({
        'success': True,
        'count': len(filtered),
        'items': filtered
    }), 200


@app.route('/api/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    """
    GET /api/items/<item_id>
    Fetches details of a single item by its unique ID.
    """
    items = load_items()
    item = next((i for i in items if i.get('id') == item_id), None)

    if not item:
        return jsonify({
            'success': False,
            'error': f'Item with ID {item_id} not found.'
        }), 404

    return jsonify({
        'success': True,
        'item': item
    }), 200


@app.route('/api/items', methods=['POST'])
def add_item():
    """
    POST /api/items
    Adds a new lost or found item.
    Expects a JSON body with required fields:
      - item_name, type ('lost'|'found'), category, location, date, contact
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({
            'success': False,
            'error': 'Invalid request payload. Expected JSON body.'
        }), 400

    # Required field validation
    required_fields = ['item_name', 'type', 'category', 'location', 'date', 'contact', 'student_name']
    missing_fields = [field for field in required_fields if not str(data.get(field, '')).strip()]

    if missing_fields:
        return jsonify({
            'success': False,
            'error': f"Missing required fields: {', '.join(missing_fields)}"
        }), 400

    # Validate type
    item_type = data.get('type', '').strip().lower()
    if item_type not in ['lost', 'found']:
        return jsonify({
            'success': False,
            'error': "Field 'type' must be either 'lost' or 'found'."
        }), 400

    items = load_items()

    # Generate auto-incrementing ID
    new_id = max([i.get('id', 0) for i in items], default=0) + 1

    new_item = {
        'id': new_id,
        'type': item_type,
        'item_name': data.get('item_name', '').strip(),
        'category': data.get('category', '').strip(),
        'description': data.get('description', '').strip(),
        'location': data.get('location', '').strip(),
        'date': data.get('date', '').strip(),
        'identifying_details': data.get('identifying_details', '').strip(),
        'student_name': data.get('student_name', '').strip(),
        'contact': data.get('contact', '').strip(),
        'status': data.get('status', 'Active').strip().capitalize()
    }

    items.append(new_item)

    if not save_items(items):
        return jsonify({
            'success': False,
            'error': 'Failed to save item to data file.'
        }), 500

    return jsonify({
        'success': True,
        'message': f"Successfully reported {item_type} item.",
        'item': new_item
    }), 201


@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    """
    PUT /api/items/<item_id>
    Updates an existing item's attributes.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({
            'success': False,
            'error': 'Invalid request payload. Expected JSON body.'
        }), 400

    items = load_items()
    item_index = next((idx for idx, i in enumerate(items) if i.get('id') == item_id), None)

    if item_index is None:
        return jsonify({
            'success': False,
            'error': f'Item with ID {item_id} not found.'
        }), 404

    target = items[item_index]

    # Update allowable fields if provided
    updatable_fields = [
        'item_name', 'category', 'description', 'location',
        'date', 'identifying_details', 'student_name', 'contact', 'status', 'type'
    ]

    for field in updatable_fields:
        if field in data and str(data[field]).strip() != '':
            if field == 'type':
                val = data[field].strip().lower()
                if val in ['lost', 'found']:
                    target[field] = val
            elif field == 'status':
                val = data[field].strip().capitalize()
                if val in ['Active', 'Resolved']:
                    target[field] = val
            else:
                target[field] = str(data[field]).strip()

    items[item_index] = target

    if not save_items(items):
        return jsonify({
            'success': False,
            'error': 'Failed to update item in data file.'
        }), 500

    return jsonify({
        'success': True,
        'message': 'Listing updated successfully.',
        'item': target
    }), 200


@app.route('/api/items/<int:item_id>/resolve', methods=['PUT'])
def resolve_item(item_id):
    """
    PUT /api/items/<item_id>/resolve
    Marks an item as 'Resolved'.
    """
    items = load_items()
    item = next((i for i in items if i.get('id') == item_id), None)

    if not item:
        return jsonify({
            'success': False,
            'error': f'Item with ID {item_id} not found.'
        }), 404

    item['status'] = 'Resolved'

    if not save_items(items):
        return jsonify({
            'success': False,
            'error': 'Failed to save updated status.'
        }), 500

    return jsonify({
        'success': True,
        'message': 'Item marked as resolved successfully.',
        'item': item
    }), 200


@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    """
    DELETE /api/items/<item_id>
    Deletes an item from the JSON file by ID.
    """
    items = load_items()
    initial_length = len(items)
    items = [i for i in items if i.get('id') != item_id]

    if len(items) == initial_length:
        return jsonify({
            'success': False,
            'error': f'Item with ID {item_id} not found.'
        }), 404

    if not save_items(items):
        return jsonify({
            'success': False,
            'error': 'Failed to remove item from data file.'
        }), 500

    return jsonify({
        'success': True,
        'message': f'Item with ID {item_id} deleted successfully.'
    }), 200


# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == '__main__':
    # Running in debug mode for local development
    # Host 127.0.0.1, Port 5000
    print("==================================================")
    print(" Campus Lost & Found Web Application Starting")
    print(" Local URL: http://127.0.0.1:5000")
    print(" Data Store: items.json")
    print("==================================================")
    app.run(debug=True, host='127.0.0.1', port=5000)
