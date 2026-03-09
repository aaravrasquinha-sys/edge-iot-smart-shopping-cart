# Raspberry Pi AprilTag Detector for GrabCart

## Overview
This Raspberry Pi client detects AprilTags using a USB webcam and automatically adds items to the GrabCart system by communicating with the Flask backend.

## Hardware Requirements
- Raspberry Pi 3B+ or newer (recommended Pi 4)
- USB webcam (compatible with Linux UVC)
- AprilTag tags (printed and attached to products)

## Software Setup

### 1. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python packages
pip3 install -r requirements.txt

# Or install manually:
pip3 install opencv-python apriltag requests numpy
```

### 2. Camera Setup
```bash
# Test camera access
python3 -c "import cv2; print(cv2.VideoCapture(0).isOpened())"

# List available cameras (run if camera index 0 doesn't work)
python3 -c "
import cv2
for i in range(3):
    cap = cv2.VideoCapture(i)
    print(f'Camera {i}: {\"Available\" if cap.isOpened() else \"Not available\"}')
    cap.release()
"
```

### 3. Configure Backend URL
Edit `pi_apriltag_detector_usb.py` and update the `BACKEND_URL`:
- For local development: `http://localhost:5000`
- For network setup: `http://YOUR_SERVER_IP:5000`
- For Raspberry Pi network: `http://raspberrypi.local:5000`

## Usage

### Running the Detector
```bash
cd raspberry_pi
python3 pi_apriltag_detector_usb.py
```

### Controls
- **ESC**: Exit the program
- **S**: Show detection statistics
- **C**: Clear detection counts

### Sample Product Tags
The system comes with pre-configured product tags:
- Tag 101: Chips - AED 5.00
- Tag 102: Chocolate - AED 8.00
- Tag 103: Glue Gun - AED 45.00
- Tag 104: Maggi - AED 3.50
- Tag 105: Five Star - AED 6.00

## Integration with GrabCart

### How it Works
1. **Detection**: Pi detects AprilTag using webcam
2. **Communication**: Sends tag ID to Flask backend via HTTP POST
3. **Backend Processing**: Flask adds item to cart based on tag ID
4. **Frontend Update**: React UI automatically updates in real-time

### API Communication
- **Endpoint**: `POST /api/detect`
- **Payload**: `{"cart_id": "pi-cart-hostname", "tag_id": 123}`
- **Response**: Backend confirms item addition

### Real-time Updates
- The React frontend automatically refreshes when items are added
- Multiple Raspberry Pis can work with different cart IDs
- Cart state persists across the network

## Troubleshooting

### Camera Issues
```bash
# Check if camera is detected
ls /dev/video*

# Test with different camera indices
# Change CAM_INDEX in the script (0, 1, 2, etc.)
```

### Backend Connection Issues
```bash
# Test backend connectivity
curl -X GET http://localhost:5000/api/products

# Test POST endpoint
curl -X POST http://localhost:5000/api/detect \
  -H "Content-Type: application/json" \
  -d '{"cart_id": "test", "tag_id": 101}'
```

### AprilTag Detection Issues
- Ensure good lighting
- Use high-contrast printed tags
- Keep tags flat and facing the camera
- Maintain 20-50cm distance from camera

## Advanced Configuration

### Custom Tag IDs
To add new products, update the Flask backend:
```python
# In appfinal.py, add to sample_products:
Product(tag_id=106, name="New Product", price=10.00)
```

### Multiple Cameras
```python
# For multiple cameras, modify the script:
CAM_INDEX = 1  # Use second camera
# Or cycle through cameras automatically
```

### Network Setup
For production deployment:
1. Set up static IP for the backend server
2. Configure firewall to allow port 5000
3. Use HTTPS for secure communication
4. Add authentication for production use

## Performance Tips
- Use Pi 4 for better performance
- Reduce camera resolution if CPU is high
- Adjust SEND_INTERVAL_S to balance responsiveness vs. load
- Use external USB camera with better quality

## Development Notes
- Each Pi gets a unique cart ID based on hostname
- Detection debouncing prevents duplicate sends
- Auto-discovery tries multiple backend URLs
- Visual feedback shows detected tags and status

## Production Deployment
For production use:
1. Set up as systemd service for auto-start
2. Add logging for monitoring
3. Implement error recovery
4. Add hardware watchdog for reliability
