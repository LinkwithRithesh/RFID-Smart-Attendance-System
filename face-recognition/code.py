import os
import time
import threading
import cv2
import requests

from flask import Flask, request
from deepface import DeepFace


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
DEVICE_API_KEY = os.environ.get("DEVICE_API_KEY", "PLACEHOLDER_KEY")


# ============================================================
# FLASK SERVER
# ============================================================

app = Flask(__name__)


# ============================================================
# FACE DATABASE
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FACE_FOLDER = os.path.join(BASE_DIR, "faces")

os.makedirs(
    FACE_FOLDER,
    exist_ok=True
)


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
        "X-Device-API-Key": DEVICE_API_KEY
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
    Check whether the RFID card exists in SmartAttend.

    We use the attendance endpoint for this system rather
    than maintaining a second Google Sheets RFID database.

    NOTE:
    The actual attendance endpoint itself performs the final
    authoritative RFID validation.

    This function therefore currently returns True and lets
    /attendance/mark perform the final validation after face
    authentication.
    """

    print()
    print("RFID received:", card_id)
    print("RFID validation will be performed by SmartAttend backend.")

    return True


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

                    detector_backend="retinaface",

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

        display_frame = cv2.flip(
            frame,
            1
        )

        cv2.putText(
            display_frame,
            "FACE AUTHENTICATION",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )

        cv2.putText(
            display_frame,
            "SPACE = Verify | Q = Cancel",
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

            print()
            print("Checking face...")
            print("Please wait...")

            camera.release()

            cv2.destroyAllWindows()

            try:

                result = DeepFace.verify(

                    img1_path=image_path,

                    img2_path=frame,

                    model_name="Facenet512",

                    detector_backend="retinaface",

                    enforce_detection=True,

                    align=True
                )

                print()
                print("==========================================")
                print("FACE VERIFICATION RESULT")
                print("==========================================")

                print(
                    "Verified:",
                    result["verified"]
                )

                print(
                    "Distance:",
                    result.get("distance")
                )

                print(
                    "Threshold:",
                    result.get("threshold")
                )

                return result["verified"]

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

        print()
        print("FACE REGISTERED LOCALLY")
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