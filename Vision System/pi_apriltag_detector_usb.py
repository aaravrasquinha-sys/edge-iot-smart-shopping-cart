# pi_apriltag_detector_usb.py
# Requirements: python3, opencv-python, apriltag, requests
# Run in Thonny or terminal: python3 pi_apriltag_detector_usb.py

import cv2
import time
import requests
import socket
from collections import defaultdict

# ---------------- CONFIG ----------------

# Auto-discover backend server or use fallback
BACKEND_URL = "http://localhost:5000"  # Fallback to localhost
CART_ID = f"pi-cart-{socket.gethostname()}"  # Unique ID per Pi
SEND_INTERVAL_S = 3.0                         # Don't re-send same tag within this window
CAM_INDEX = 0                                 # USB webcam index (usually 0)
DETECTION_CONFIDENCE = 0.5                    # Minimum detection confidence
# ----------------------------------------

def discover_backend():
    """Try to discover the backend server"""
    possible_urls = [
        "http://localhost:5000",
        "http://raspberrypi.local:5000", 
        "http://192.168.1.100:5000",  # Change to your server IP
        "http://10.0.0.100:5000",     # Change to your server IP
    ]
    
    for url in possible_urls:
        try:
            response = requests.get(f"{url}/api/products", timeout=2.0)
            if response.status_code == 200:
                print(f"✅ Backend found at: {url}")
                return url
        except:
            continue
    
    print(f"⚠️  Backend auto-discovery failed, using fallback: {BACKEND_URL}")
    return BACKEND_URL

def load_sample_tags():
    """Load sample product tags for testing"""
    return {
        101: "Chips - AED 5.00",
        102: "Chocolate - AED 8.00", 
        103: "Glue Gun - AED 45.00",
        104: "Maggi - AED 3.50",
        105: "Five Star - AED 6.00"
    }

def detect_and_send():
    # Open the USB webcam
    cap = cv2.VideoCapture(CAM_INDEX)
    if not cap.isOpened():
        print("ERROR: camera not opened. Check USB connection or try another CAM_INDEX.")
        print("Available camera indices:")
        for i in range(3):
            test_cap = cv2.VideoCapture(i)
            if test_cap.isOpened():
                print(f"  Camera {i}: Available")
                test_cap.release()
            else:
                print(f"  Camera {i}: Not available")
        return

    # Initialize the AprilTag detector
    try:
        import apriltag
        detector = apriltag.Detector()
        print("✅ AprilTag detector initialized")
    except ImportError:
        print("ERROR: apriltag python package not found. Run: pip install apriltag")
        return

    # Discover backend server
    backend_url = discover_backend()
    
    # Load sample tags for reference
    sample_tags = load_sample_tags()
    print("📦 Sample product tags loaded:")
    for tag_id, description in sample_tags.items():
        print(f"  Tag {tag_id}: {description}")
    
    last_seen = defaultdict(lambda: 0.0)  # tag_id -> last send time
    detection_count = defaultdict(int)   # tag_id -> detection count

    print(f"\n🎯 Starting detection loop for Cart ID: {CART_ID}")
    print("Press ESC to exit, 's' to show stats, 'c' to clear detection counts\n")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("⚠️  Failed to read from camera")
            time.sleep(0.1)
            continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        results = detector.detect(gray)

        now = time.time()
        new_detections = []
        
        for r in results:
            tag_id = int(r.tag_id)
            detection_count[tag_id] += 1
            
            # Check if we should send this detection
            if now - last_seen[tag_id] < SEND_INTERVAL_S:
                continue
            
            last_seen[tag_id] = now
            new_detections.append(tag_id)
            
            # Get product name if it's a known tag
            product_name = sample_tags.get(tag_id, f"Unknown Product")
            print(f"🏷️  Detected tag {tag_id} ({product_name}) - sending to backend")

            # Send to backend
            payload = {"cart_id": CART_ID, "tag_id": tag_id}
            try:
                resp = requests.post(f"{backend_url}/api/detect", json=payload, timeout=2.0)
                if resp.status_code == 200:
                    data = resp.json()
                    print(f"✅ Backend acknowledged: {data.get('msg', 'OK')}")
                    print(f"   Cart ID: {data.get('cart_id', 'N/A')}")
                else:
                    print(f"❌ Backend error: {resp.status_code} - {resp.text}")
            except requests.exceptions.Timeout:
                print(f"⏰ Backend timeout for tag {tag_id}")
            except requests.exceptions.ConnectionError:
                print(f"🔌 Connection failed for tag {tag_id}")
            except Exception as e:
                print(f"💥 Error sending tag {tag_id}: {e}")

        # Draw rectangles and tag IDs on the frame
        for r in results:
            (ptA, ptB, ptC, ptD) = r.corners
            ptA = tuple(map(int, ptA))
            ptB = tuple(map(int, ptB))
            ptC = tuple(map(int, ptC))
            ptD = tuple(map(int, ptD))
            
            # Draw detection box
            cv2.line(frame, ptA, ptB, (0, 255, 0), 2)
            cv2.line(frame, ptB, ptC, (0, 255, 0), 2)
            cv2.line(frame, ptC, ptD, (0, 255, 0), 2)
            cv2.line(frame, ptD, ptA, (0, 255, 0), 2)
            
            # Add tag ID and product info
            tag_id = int(r.tag_id)
            product_name = sample_tags.get(tag_id, "Unknown")
            text = f"ID:{tag_id} {product_name[:20]}"
            cv2.putText(frame, text, (ptA[0], ptA[1]-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            
            # Highlight newly detected tags
            if tag_id in new_detections:
                cv2.putText(frame, "NEW!", (ptA[0], ptA[1]-30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        # Add status overlay
        status_text = f"Cart: {CART_ID} | Backend: {backend_url.split('//')[1]}"
        cv2.putText(frame, status_text, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Add detection stats
        if detection_count:
            total_detections = sum(detection_count.values())
            unique_tags = len(detection_count)
            stats_text = f"Detections: {total_detections} | Tags: {unique_tags}"
            cv2.putText(frame, stats_text, (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        # Show the camera feed
        cv2.imshow("AprilTag Detector - USB Webcam", frame)

        # Handle key presses
        key = cv2.waitKey(1) & 0xFF
        if key == 27:  # ESC key to quit
            break
        elif key == ord('s'):  # Show stats
            print("\n📊 Detection Statistics:")
            for tag_id, count in sorted(detection_count.items()):
                product_name = sample_tags.get(tag_id, "Unknown")
                print(f"  Tag {tag_id} ({product_name}): {count} detections")
            print()
        elif key == ord('c'):  # Clear stats
            detection_count.clear()
            print("🗑️  Detection statistics cleared")

    cap.release()
    cv2.destroyAllWindows()
    print("\n👋 Camera feed closed. Goodbye!")

if __name__ == "__main__":
    print("🚀 Starting GrabCart AprilTag Detector for Raspberry Pi")
    print("=" * 50)
    detect_and_send()
