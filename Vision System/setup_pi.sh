#!/bin/bash

echo "🚀 Setting up GrabCart Raspberry Pi Client"
echo "=========================================="

# Check if running on Raspberry Pi
if [ ! -f /proc/device-tree/model ] || ! grep -q "Raspberry Pi" /proc/device-tree/model; then
    echo "⚠️  Warning: This doesn't appear to be a Raspberry Pi"
    echo "    Continue anyway? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        exit 1
    fi
fi

echo "📦 Installing system dependencies..."
sudo apt update
sudo apt install -y python3-pip python3-venv libopencv-dev python3-opencv

echo "🐍 Setting up Python virtual environment..."
python3 -m venv ~/grabcart-env
source ~/grabcart-env/bin/activate

echo "📚 Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

echo "📷 Testing camera access..."
python3 -c "
import cv2
for i in range(3):
    cap = cv2.VideoCapture(i)
    if cap.isOpened():
        print(f'✅ Camera {i}: Available')
        cap.release()
    else:
        print(f'❌ Camera {i}: Not available')
"

echo "🔧 Creating desktop shortcut..."
mkdir -p ~/Desktop
cat > ~/Desktop/GrabCart-Detector.desktop << EOF
[Desktop Entry]
Name=GrabCart Detector
Comment=Start AprilTag detector for GrabCart
Exec=/home/pi/grabcart-env/bin/python3 $(pwd)/pi_apriltag_detector_usb.py
Icon=camera
Terminal=true
Type=Application
Categories=Development;
EOF

chmod +x ~/Desktop/GrabCart-Detector.desktop

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Connect your USB webcam"
echo "2. Update BACKEND_URL in pi_apriltag_detector_usb.py"
echo "3. Run: source ~/grabcart-env/bin/activate"
echo "4. Run: python3 pi_apriltag_detector_usb.py"
echo "5. Or double-click 'GrabCart Detector' on desktop"
echo ""
echo "🎯 Your Cart ID will be: pi-cart-$(hostname)"
