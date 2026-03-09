# GrabCart - Auto Shopping Cart System

## Overview
GrabCart is an automated shopping cart system that uses RFID tag scanning to add items to a digital cart. The system consists of a React frontend and Flask backend.

## Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Flask with SQLAlchemy for database management
- **Database**: SQLite for development
- **Communication**: REST API with CORS support

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- pip and npm installed

### Backend Setup
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. The Flask app will automatically create the SQLite database and add sample products on first run.

### Frontend Setup
1. Install Node.js dependencies:
   ```bash
   npm install
   ```

### Running the Application

#### Option 1: Use startup scripts
- **Windows**: Run `start.bat`
- **Linux/Mac**: Run `./start.sh`

#### Option 2: Manual startup
1. Start the backend:
   ```bash
   python appfinal.py
   ```

2. In a new terminal, start the frontend:
   ```bash
   npm run dev
   ```

### Access Points
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **Dashboard**: http://localhost:5000/dashboard/<cart_id>

## API Endpoints

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Add a new product

### Cart Operations
- `POST /api/detect` - Scan/add item to cart
  ```json
  {
    "cart_id": "optional-cart-id",
    "tag_id": 123
  }
  ```
- `GET /api/cart/<cart_id>` - Get cart contents
- `POST /api/cart/<cart_id>/clear` - Clear cart

### Sample Product Tag IDs
The system comes with sample products:
- 101: Chips (AED 5.00)
- 102: Chocolate (AED 8.00)
- 103: Glue Gun (AED 45.00)
- 104: Maggi (AED 3.50)
- 105: Five Star (AED 6.00)

## Features
- **Mock Scanning**: Click "Mock Scan Item" to simulate RFID scanning
- **Real-time Cart Updates**: Cart updates automatically when items are scanned
- **Digital Receipts**: Generate and print digital receipts
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Development Notes
- The backend runs on port 5000
- The frontend runs on port 8080
- CORS is configured to allow frontend-backend communication
- The database file (`shopping.db`) is created automatically
- Sample products are added on first startup

## Troubleshooting
1. **CORS Issues**: Ensure the Flask backend is running before starting the frontend
2. **Database Issues**: Delete `shopping.db` and restart the backend to recreate the database
3. **Port Conflicts**: Make sure ports 5000 and 8080 are available

## Future Enhancements
- Real RFID hardware integration
- Payment gateway integration
- Inventory management
- User authentication
- Multi-store support
