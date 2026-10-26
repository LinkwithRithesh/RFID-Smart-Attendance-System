import os
import time
import threading
import json
import cv2
import requests

from flask import Flask, request, jsonify
from deepface import DeepFace
import numpy as np

# Load OpenCV Haar cascade once into memory for instant face detection (~15ms)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


# ============================================================
# SMARTATTEND BACKEND
# ============================================================

BACKEND_URL = "http://127.0.0.1:5000/api/v1"

# Device registered in SmartAttend
DEVICE_CODE = "ESP32-ECE-01"

# Load .env file locally if present
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ[k.strip()] = v.strip()

# IMPORTANT:
# Put your existing ESP32 device API key here locally.
DEVICE_API_KEY = os.environ.get("DEVICE_API_KEY", "7d5d39b1aaaba5c6c8d2eed73a258635ae6bd770d4c0e1c733f7309228378f69")



# ============================================================
# FLASK SERVER
# ============================================================

app = Flask(__name__)


# ============================================================
# FACE & STUDENT DATABASE
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FACE_FOLDER = os.path.join(BASE_DIR, "faces")
DB_FILE = os.path.join(BASE_DIR, "students.json")

os.makedirs(
    FACE_FOLDER,
    exist_ok=True
)

def get_student_name(card_id):
    if not os.path.exists(DB_FILE):
        return None
    try:
        with open(DB_FILE, "r") as f:
            db = json.load(f)
        return db.get(card_id)
    except Exception:
        return None

def save_student_name(card_id, name):
    db = {}
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r") as f:
                db = json.load(f)
        except Exception:
            db = {}
    db[card_id] = name
    with open(DB_FILE, "w") as f:
        json.dump(db, f, indent=2)


# ============================================================
# SYSTEM MODE
# ============================================================

current_mode = "ATTENDANCE"

mode_lock = threading.Lock()


# ============================================================
# SMARTATTEND API HELPERS
# ============================================================

def backend_headers():
    return {
        "Content-Type": "application/json",
        "X-Device-Code": "ESP32-ECE-01",
        "X-Device-API-Key": "7d5d39b1aaaba5c6c8d2eed73a258635ae6bd770d4c0e1c733f7309228378f69"
    }


def mark_attendance(card_id):
    """
    Send RFID attendance to SmartAttend backend.

    This is called ONLY after:
        1. RFID is valid
        2. Face authentication succeeds
    """

    url = f"{BACKEND_URL}/attendance/mark"

    payload = {
        "rfidCardId": card_id
    }

    try:
        print()
        print("Sending attendance to SmartAttend...")
        print("URL:", url)

        response = requests.post(
            url,
            headers=backend_headers(),
            json=payload,
            timeout=10
        )

        print("Backend HTTP:", response.status_code)
        print("Backend response:", response.text)

        # ----------------------------------------------------
        # SUCCESS
        # ----------------------------------------------------

        if response.status_code in (200, 201):

            try:
                data = response.json()
            except Exception:
                data = {}

            attendance = data.get("data", {})

            status = attendance.get(
                "status",
                "PRESENT"
            )

            print()
            print("==========================================")
            print("ATTENDANCE MARKED")
            print("==========================================")
            print("Status:", status)
            print("Student ID:", attendance.get("userId"))
            print("Session ID:", attendance.get("sessionId"))
            print()

            return "SUCCESS_MATCH"

        # ----------------------------------------------------
        # INVALID RFID
        # ----------------------------------------------------

        if response.status_code == 400:

            print()
            print("INVALID OR INACTIVE RFID")
            print()

            return "INVALID_CARD"

        # ----------------------------------------------------
        # DEVICE AUTHENTICATION ERROR
        # ----------------------------------------------------

        if response.status_code == 401:

            print()
            print("DEVICE AUTHENTICATION FAILED")
            print("Check DEVICE_CODE / DEVICE_API_KEY")
            print()

            return "AUTH_FAILED"

        # ----------------------------------------------------
        # NO ATTENDANCE SESSION
        # ----------------------------------------------------

        if response.status_code == 404:

            print()
            print("NO OPEN ATTENDANCE SESSION")
            print()

            return "NO_SESSION"

        # ----------------------------------------------------
        # ALREADY MARKED
        # ----------------------------------------------------

        if response.status_code == 409:

            print()
            print("ATTENDANCE ALREADY MARKED")
            print()

            return "ALREADY_EXISTS"

        # ----------------------------------------------------
        # OTHER SERVER ERROR
        # ----------------------------------------------------

        print()
        print("SMARTATTEND SERVER ERROR")
        print("HTTP:", response.status_code)
        print()

        return "SERVER_ERROR"

    except requests.RequestException as e:

        print()
        print("SMARTATTEND CONNECTION ERROR")
        print(e)
        print()

        return "NETWORK_ERROR"


# ============================================================
# CHECK RFID
# ============================================================

def check_rfid(card_id):
    """
    Check whether the RFID card is registered in the system.
    Returns True if registered, False otherwise.
    """
    # 1. Check local student database
    name = get_student_name(card_id)
    face_path = os.path.join(FACE_FOLDER, card_id, "face.jpg")

    # Card must exist in student records or have a registered face
    if name is not None or os.path.exists(face_path):
        print()
        print(f"RFID {card_id} is registered ({name or 'Face on disk'}).")
        return True

    print()
    print(f"RFID {card_id} is NOT registered.")
    return False


# ============================================================
# FACE REGISTRATION
# ============================================================

def register_face(card_id, student_name):

    folder = os.path.join(
        FACE_FOLDER,
        card_id
    )

    os.makedirs(
        folder,
        exist_ok=True
    )

    image_path = os.path.join(
        folder,
        "face.jpg"
    )

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():

        print(
            "ERROR: Could not open camera."
        )

        return False

    print()
    print("==========================================")
    print("FACE REGISTRATION")
    print("==========================================")

    print("Student:", student_name)
    print("Card:", card_id)

    print()
    print("Look at the camera.")
    print("Press SPACE to capture.")
    print("Press Q to cancel.")

    while True:

        ret, frame = camera.read()

        if not ret:

            print(
                "Camera read failed."
            )

            break

        display_frame = cv2.flip(
            frame,
            1
        )

        cv2.putText(
            display_frame,
            "FACE REGISTRATION",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )

        cv2.putText(
            display_frame,
            "SPACE = Capture | Q = Cancel",
            (20, 75),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            2
        )

        cv2.imshow(
            "Smart Attendance",
            display_frame
        )

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):

            camera.release()

            cv2.destroyAllWindows()

            return False

        if key == 32:

            print(
                "Checking face..."
            )

            try:

                result = DeepFace.extract_faces(

                    img_path=frame,

                    detector_backend="opencv",

                    enforce_detection=True,

                    align=True
                )

                if len(result) > 0:

                    cv2.imwrite(
                        image_path,
                        frame
                    )

                    print()
                    print(
                        "FACE CAPTURED SUCCESSFULLY"
                    )

                    print(
                        "Saved:",
                        image_path
                    )

                    camera.release()

                    cv2.destroyAllWindows()

                    return True

            except Exception as e:

                print(
                    "Face not detected."
                )

                print(e)

    camera.release()

    cv2.destroyAllWindows()

    return False


# ============================================================
# FACE VERIFICATION
# ============================================================

def verify_face(card_id):

    image_path = os.path.join(
        FACE_FOLDER,
        card_id,
        "face.jpg"
    )

    if not os.path.exists(
        image_path
    ):

        print(
            "No registered face found."
        )

        return False

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():

        print(
            "Could not open camera."
        )

        return False

    print()
    print("==========================================")
    print("FACE AUTHENTICATION")
    print("==========================================")

    print()
    print("Look directly at the camera.")
    print("Press SPACE to verify.")
    print("Press Q to cancel.")

    while True:

        ret, frame = camera.read()

        if not ret:

            print(
                "Camera read failed."
            )

            break

        # Real-time face detection on preview frame
        # minNeighbors=5 and minSize=(80, 80) prevent false detections on shirt collars/background objects
        gray_preview = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        preview_faces = face_cascade.detectMultiScale(
            gray_preview,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80)
        )

        display_frame = cv2.flip(frame, 1)
        h_f, w_f = display_frame.shape[:2]

        # Draw green bounding box around detected face so user knows camera sees them
        face_detected_in_preview = len(preview_faces) > 0
        best_face_box = None
        if face_detected_in_preview:
            bx, by, bw, bh = max(preview_faces, key=lambda b: b[2] * b[3])
            best_face_box = (bx, by, bw, bh)
            # Mirror x coordinates for flipped display
            flip_x = w_f - (bx + bw)
            cv2.rectangle(display_frame, (flip_x, by), (flip_x + bw, by + bh), (0, 255, 0), 2)
            status_text = "FACE DETECTED - PRESS SPACE"
            status_color = (0, 255, 0)
        else:
            status_text = "LOOK AT CAMERA - POSITION FACE"
            status_color = (0, 165, 255)

        cv2.putText(
            display_frame,
            "FACE AUTHENTICATION",
            (20, 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2
        )

        cv2.putText(
            display_frame,
            status_text,
            (20, 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            status_color,
            2
        )

        cv2.putText(
            display_frame,
            "SPACE = Verify | Q = Cancel",
            (20, 105),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (200, 200, 200),
            1
        )

        cv2.imshow(
            "Smart Attendance",
            display_frame
        )

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):

            camera.release()

            cv2.destroyAllWindows()

            return False

        if key == 32:

            print()
            print("Checking face...")
            print("Please wait...")

            camera.release()

            cv2.destroyAllWindows()

            try:
                # If a face box was detected, crop with padding for clean verification
                verify_input = frame
                if best_face_box is not None:
                    bx, by, bw, bh = best_face_box
                    pad_x = int(bw * 0.2)
                    pad_y = int(bh * 0.2)
                    y1 = max(0, by - pad_y)
                    y2 = min(frame.shape[0], by + bh + pad_y)
                    x1 = max(0, bx - pad_x)
                    x2 = min(frame.shape[1], bx + bw + pad_x)
                    cropped = frame[y1:y2, x1:x2]
                    if cropped.size > 0:
                        verify_input = cropped

                # Direct verification with Facenet512
                result = DeepFace.verify(
                    img1_path=image_path,
                    img2_path=verify_input,
                    model_name="Facenet512",
                    detector_backend="opencv",
                    distance_metric="cosine",
                    enforce_detection=False,
                    align=True
                )

                distance = result.get("distance", 1.0)
                # Facenet512 cosine distance:
                # Same person (different lighting/facial expressions): 0.20 - 0.58
                # Different person: 0.68 - 0.95+
                # DeepFace standard Facenet512 threshold is ~0.55-0.60 for webcam conditions.
                VERIFY_THRESHOLD = 0.60
                verified = distance <= VERIFY_THRESHOLD

                # Calculate realistic match confidence
                if distance <= VERIFY_THRESHOLD:
                    confidence = round((1.0 - (distance / VERIFY_THRESHOLD) * 0.4) * 100, 1)
                else:
                    confidence = round(max(0.0, (1.0 - distance)) * 100, 1)

                print()
                print("==========================================")
                print("FACE VERIFICATION RESULT")
                print("==========================================")
                print("Verified:", verified)
                print("Distance:", round(distance, 4))
                print("Threshold:", VERIFY_THRESHOLD)
                print(f"Match Confidence: {confidence}%")
                print("==========================================")

                return verified

            except Exception as e:

                print()
                print("FACE VERIFICATION ERROR")

                print(
                    type(e).__name__
                )

                print(e)

                return False

    camera.release()

    cv2.destroyAllWindows()

    return False


# ============================================================
# PROCESS RFID
# ============================================================

def process_card(card_id):

    global current_mode

    print()
    print("==========================================")
    print("RFID DETECTED:", card_id)
    print("MODE:", current_mode)
    print("==========================================")

    # ========================================================
    # REGISTRATION
    # ========================================================

    if current_mode == "REGISTER":

        print()
        print("Enter student name:")

        student_name = input(
            "> "
        ).strip()

        if not student_name:

            print(
                "Name cannot be empty."
            )

            current_mode = "ATTENDANCE"

            return "FAIL_UNKNOWN"

        print()
        print(
            "Starting face registration..."
        )

        success = register_face(
            card_id,
            student_name
        )

        if not success:

            print(
                "Face registration failed."
            )

            current_mode = "ATTENDANCE"

            return "FAIL_UNKNOWN"

        save_student_name(card_id, student_name)

        print()
        print(f"FACE REGISTERED LOCALLY FOR: {student_name}")
        print()
        print("IMPORTANT:")
        print("Student RFID/registration should now")
        print("be managed through the SmartAttend website.")
        print()

        current_mode = "ATTENDANCE"

        return "SUCCESS_REG"

    # ========================================================
    # ATTENDANCE
    # ========================================================

    print(
        "Checking RFID..."
    )

    if not check_rfid(card_id):

        print(
            "Unknown RFID card."
        )

        return "INVALID_CARD"

    print(
        "RFID received."
    )

    print(
        "Starting face authentication..."
    )

    face_verified = verify_face(
        card_id
    )

    if not face_verified:

        print()
        print(
            "FACE VERIFICATION FAILED."
        )

        return "FACE_FAILED"

    print()
    print("RFID VERIFIED")
    print("FACE VERIFIED")
    print("ACCESS GRANTED")

    # ========================================================
    # SEND TO SMARTATTEND
    # ========================================================

    result = mark_attendance(
        card_id
    )

    return result


# ============================================================
# ESP32 LOOKUP ENDPOINT (Instant LCD feedback)
# ============================================================

@app.route(
    "/lookup",
    methods=["POST"]
)
def lookup_endpoint():

    global current_mode

    data = request.get_json(
        silent=True
    ) or {}

    card_id = str(
        data.get("card_id", "")
    ).strip()

    # If currently in REGISTER mode, notify ESP32 to show UID
    if current_mode == "REGISTER":
        return jsonify({
            "mode": "REGISTER",
            "name": ""
        })

    # Attendance mode: lookup name from local database
    name = get_student_name(card_id) or ""
    return jsonify({
        "mode": "ATTENDANCE",
        "name": name
    })


# ============================================================
# ESP32 HTTP ENDPOINT
# ============================================================

@app.route(
    "/rfid",
    methods=["POST"]
)
def rfid_endpoint():

    global current_mode

    data = request.get_json(
        silent=True
    )

    if not data:

        return "FAIL_UNKNOWN"

    card_id = str(
        data.get("card_id", "")
    ).strip()

    if len(card_id) < 3:

        return "FAIL_UNKNOWN"

    # Protect against two cards being processed
    # simultaneously.

    with mode_lock:

        result = process_card(
            card_id
        )

        current_mode = "ATTENDANCE"

    return result


# ============================================================
# MODE CONTROL
# ============================================================

def keyboard_control():

    global current_mode

    print()
    print("==========================================")
    print("SMART ATTENDANCE SYSTEM")
    print("==========================================")

    print()
    print("Wi-Fi mode enabled.")
    print("Press R = Register")
    print("Press Q = Quit")
    print()

    while True:

        key = input(
            "> "
        ).strip().lower()

        if key == "r":

            with mode_lock:

                current_mode = "REGISTER"

            print()
            print("REGISTER MODE ENABLED")
            print("Scan the new RFID card.")
            print()

        elif key == "q":

            print(
                "Stopping..."
            )

            os._exit(0)


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    keyboard_thread = threading.Thread(
        target=keyboard_control,
        daemon=True
    )

    keyboard_thread.start()

    print()
    print("Pre-warming DeepFace models for instant verification...")
    try:
        DeepFace.build_model("Facenet512")
        # Run dummy verification to pre-warm TensorFlow computation graph and CUDA/CPU caches
        dummy = np.zeros((160, 160, 3), dtype=np.uint8)
        DeepFace.verify(
            img1_path=dummy,
            img2_path=dummy,
            model_name="Facenet512",
            detector_backend="skip",
            enforce_detection=False
        )
        print("Facenet512 engine warmed and ready.")
    except Exception as e:
        print("Warmup notice:", e)

    print()
    print("Starting Wi-Fi server...")
    print()
    print("ESP32 → Python:")
    print("http://0.0.0.0:5001/rfid")
    print()

    app.run(
        host="0.0.0.0",
        port=5001,
        threaded=True
    )