from flask import Flask, request, jsonify, render_template_string
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.sql import func
import uuid

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///shopping.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ----------------- Models -----------------
class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tag_id = db.Column(db.Integer, unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False)

class Cart(db.Model):
    id = db.Column(db.String(64), primary_key=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.String(64), db.ForeignKey('cart.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    added_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

# ----------------- Helpers -----------------
def get_or_create_cart(cart_id=None):
    if not cart_id:
        cart_id = str(uuid.uuid4())
    cart = Cart.query.get(cart_id)
    if not cart:
        cart = Cart(id=cart_id)
        db.session.add(cart)
        db.session.commit()
    return cart

# ----------------- API Endpoints -----------------
@app.route("/api/products", methods=["GET", "POST"])
def products():
    if request.method == "GET":
        prods = Product.query.all()
        return jsonify([{"tag_id": p.tag_id, "name": p.name, "price": p.price} for p in prods])
    else:
        data = request.json or {}
        tag_id = data.get("tag_id")
        name = data.get("name")
        price = float(data.get("price", 0))
        if not all([tag_id, name]):
            return jsonify({"error": "tag_id and name are required"}), 400
        try:
            p = Product(tag_id=tag_id, name=name, price=price)
            db.session.add(p)
            db.session.commit()
            return jsonify({"msg": "Product created", "id": p.id}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

@app.route("/api/detect", methods=["POST"])
def detect():
    try:
        data = request.json or {}
        cart_id = data.get("cart_id") or str(uuid.uuid4())
        tag_id = data.get("tag_id")
        
        if not tag_id:
            return jsonify({"error": "tag_id is required"}), 400

        cart = get_or_create_cart(cart_id)
        product = Product.query.filter_by(tag_id=tag_id).first()
        
        if not product:
            return jsonify({"error": "Product not found", "tag_id": tag_id}), 404

        cart_item = CartItem.query.filter_by(cart_id=cart.id, product_id=product.id).first()
        if cart_item:
            cart_item.quantity += 1
        else:
            cart_item = CartItem(cart_id=cart.id, product_id=product.id, quantity=1)
            db.session.add(cart_item)
        
        db.session.commit()
        return jsonify({
            "msg": "Product added to cart",
            "cart_id": cart.id,
            "product": {
                "tag_id": product.tag_id,
                "name": product.name,
                "price": product.price,
                "quantity": cart_item.quantity
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/api/cart/<cart_id>", methods=["GET"])
def get_cart(cart_id):
    try:
        cart = Cart.query.get(cart_id)
        if not cart:
            return jsonify({"error": "Cart not found"}), 404
        
        items = []
        total = 0.0
        cart_items = CartItem.query.filter_by(cart_id=cart.id).all()
        
        for item in cart_items:
            product = Product.query.get(item.product_id)
            if not product:
                continue
                
            subtotal = product.price * item.quantity
            total += subtotal
            items.append({
                "tag_id": product.tag_id,
                "name": product.name,
                "price": product.price,
                "quantity": item.quantity,
                "subtotal": round(subtotal, 2)
            })
            
        return jsonify({
            "cart_id": cart.id,
            "items": items,
            "total": round(total, 2),
            "item_count": len(items)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/cart/<cart_id>/clear", methods=["POST"])
def clear_cart(cart_id):
    try:
        deleted = CartItem.query.filter_by(cart_id=cart_id).delete()
        db.session.commit()
        return jsonify({
            "msg": "Cart cleared",
            "items_removed": deleted
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/api/cart/<cart_id>/remove", methods=["POST"])
def remove_item(cart_id):
    try:
        data = request.get_json()
        if not data or "tag_id" not in data:
            return jsonify({"error": "tag_id is required"}), 400
        
        tag_id = data["tag_id"]
        
        # Find the product
        product = Product.query.filter_by(tag_id=tag_id).first()
        if not product:
            return jsonify({"error": "Product not found", "tag_id": tag_id}), 404
        
        # Find the cart item
        cart_item = CartItem.query.filter_by(cart_id=cart_id, product_id=product.id).first()
        if not cart_item:
            return jsonify({"error": "Item not in cart", "tag_id": tag_id}), 404
        
        # Decrement quantity or remove if quantity is 1
        if cart_item.quantity > 1:
            cart_item.quantity -= 1
            db.session.commit()
            action = "decremented"
        else:
            db.session.delete(cart_item)
            db.session.commit()
            action = "removed"
        
        return jsonify({
            "msg": f"Item {action}",
            "tag_id": tag_id,
            "product": {
                "name": product.name,
                "price": product.price,
                "quantity": cart_item.quantity if cart_item.quantity > 0 else 0
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ----------------- Dashboard -----------------
@app.route("/dashboard/<cart_id>")
def dashboard(cart_id):
    cart = Cart.query.get(cart_id)
    if not cart:
        return "Cart not found", 404
    
    cart_items = CartItem.query.filter_by(cart_id=cart.id).all()
    items = []
    total = 0.0
    
    for item in cart_items:
        product = Product.query.get(item.product_id)
        if product:
            subtotal = product.price * item.quantity
            total += subtotal
            items.append({
                "name": product.name,
                "price": product.price,
                "quantity": item.quantity,
                "subtotal": subtotal
            })
    
    return render_template_string("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Shopping Cart</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .total { font-weight: bold; }
            .header { margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Shopping Cart: {{ cart_id }}</h1>
            <p>Created: {{ cart_created }}</p>
        </div>
        <table>
            <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
            </tr>
            {% for item in items %}
            <tr>
                <td>{{ item.name }}</td>
                <td>${{ "%.2f"|format(item.price) }}</td>
                <td>{{ item.quantity }}</td>
                <td>${{ "%.2f"|format(item.subtotal) }}</td>
            </tr>
            {% endfor %}
            <tr class="total">
                <td colspan="3">Total</td>
                <td>${{ "%.2f"|format(total) }}</td>
            </tr>
        </table>
    </body>
    </html>
    """, 
    items=items, 
    total=total,
    cart_id=cart_id,
    cart_created=cart.created_at.strftime('%Y-%m-%d %H:%M:%S'))

# ----------------- Run server -----------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        
        # Add sample products if none exist
        if Product.query.count() == 0:
            sample_products = [
                Product(tag_id=101, name="Chips", price=5.00),
                Product(tag_id=102, name="Chocolate", price=8.00),
                Product(tag_id=103, name="Glue Gun", price=45.00),
                Product(tag_id=104, name="Maggi", price=3.50),
                Product(tag_id=105, name="Five Star", price=6.00),
            ]
            for product in sample_products:
                db.session.add(product)
            db.session.commit()
            print("Sample products added to database:")
            for product in sample_products:
                print(f"  Tag {product.tag_id}: {product.name} - AED {product.price}")
        else:
            print(f"Database ready with {Product.query.count()} products")
    
    app.run(host="0.0.0.0", port=5000, debug=True)