# backend/app.py
from flask import Flask, request, jsonify, render_template_string
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func
import uuid

app = Flask(__name__)
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
        data = request.json
        tag_id = data.get("tag_id")
        name = data.get("name")
        price = float(data.get("price", 0))
        if tag_id is None or name is None:
            return jsonify({"error": "tag_id and name required"}), 400
        p = Product(tag_id=tag_id, name=name, price=price)
        db.session.add(p)
        db.session.commit()
        return jsonify({"msg":"created"}), 201

@app.route("/api/detect", methods=["POST"])
def detect():
    data = request.json or {}
    cart_id = data.get("cart_id") or str(uuid.uuid4())
    tag_id = data.get("tag_id")
    if tag_id is None:
        return jsonify({"error":"tag_id required"}), 400

    cart = get_or_create_cart(cart_id)
    product = Product.query.filter_by(tag_id=tag_id).first()
    if not product:
        return jsonify({"error":"unknown tag", "tag_id": tag_id}), 404

    # Update or create cart item
    ci = CartItem.query.filter_by(cart_id=cart.id, product_id=product.id).first()
    if ci:
        ci.quantity += 1
    else:
        ci = CartItem(cart_id=cart.id, product_id=product.id, quantity=1)
        db.session.add(ci)
    db.session.commit()
    return jsonify({"msg":"ok", "cart_id": cart.id}), 200

@app.route("/api/cart/<cart_id>", methods=["GET"])
def get_cart(cart_id):
    cart = Cart.query.get(cart_id)
    if not cart:
        return jsonify({"error":"cart not found"}), 404
    items = []
    total = 0.0
    cis = CartItem.query.filter_by(cart_id=cart.id).all()
    for c in cis:
        p = Product.query.get(c.product_id)
        subtotal = p.price * c.quantity
        total += subtotal
        items.append({
            "tag_id": p.tag_id,
            "name": p.name,
            "price": p.price,
            "quantity": c.quantity,
            "subtotal": subtotal
        })
    return jsonify({"cart_id": cart.id, "items": items, "total": total})

@app.route("/api/cart/<cart_id>/clear", methods=["POST"])
def clear_cart(cart_id):
    CartItem.query.filter_by(cart_id=cart_id).delete()
    db.session.commit()
    return jsonify({"msg":"cleared"}), 200

# ----------------- Optional: simple dashboard -----------------
@app.route("/dashboard/<cart_id>")
def dashboard(cart_id):
    cart = Cart.query.get(cart_id)
    if not cart:
        return "Cart not found", 404
    cis = CartItem.query.filter_by(cart_id=cart.id).all()
    total = sum([Product.query.get(c.product_id).price * c.quantity for c in cis])
    html = "<h1>Shopping Cart: {}</h1><table border=1><tr><th>Tag ID</th><th>Name</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr>".format(cart.id)
    for c in cis:
        p = Product.query.get(c.product_id)
        html += f"<tr><td>{p.tag_id}</td><td>{p.name}</td><td>{p.price}</td><td>{c.quantity}</td><td>{p.price*c.quantity}</td></tr>"
    html += f"<tr><td colspan=4><b>Total</b></td><td><b>{total}</b></td></tr></table>"
    return html

# ----------------- Run server -----------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)
