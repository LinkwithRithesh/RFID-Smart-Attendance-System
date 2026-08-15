import os
import time
import threading

import cv2
import requests

from flask import Flask, request

from deepface import DeepFace


# ============================================================
# GOOGLE APPS SCRIPT
# ============================================================

GOOGLE_SCRIPT_URL = (
    "https://script.google.com/macros/s/AKfycbzRpJuvbE3jGExTgZ1GCDTKDMa7q39bUlVMR65285_e_GMpzJ1zGBENRBHde5J5B5q8/exec"
)


# ============================================================
# FLASK SERVER
# ============================================================

app = Flask(__name__)


# ============================================================
# FACE DATABASE
# ============================================================

FACE_FOLDER = "faces"

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
# GOOGLE SHEETS
# ============================================================

def send_to_google(
    action,
    card_id,
    name=""
):

    payload = {

        "action": action,

        "card_id": card_id,

        "name": name
    }


    try:

        response = requests.post(
            GOOGLE_SCRIPT_URL,
            json=payload,
            timeout=10
        )


        reply = response.text.strip()


        print(
            "Google Response:",
            reply
        )


        return reply


    except requests.RequestException as e:

        print(
            "Google connection error:"
        )

        print(e)

        return "NETWORK_ERROR"


# ============================================================
# FACE REGISTRATION
# ============================================================

def register_face(
    card_id,
    student_name
):

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
    print(
        "=========================================="
    )
    print(
        "FACE REGISTRATION"
    )
    print(
        "=========================================="
    )

    print(
        "Student:",
        student_name
    )

    print(
        "Card:",
        card_id
    )

    print()
    print(
        "Look at the camera."
    )

    print(
        "Press SPACE to capture."
    )

    print(
        "Press Q to cancel."
    )


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
    print(
        "=========================================="
    )

    print(
        "FACE AUTHENTICATION"
    )

    print(
        "=========================================="
    )

    print()

    print(
        "Look directly at the camera."
    )

    print(
        "Press SPACE to verify."
    )

    print(
        "Press Q to cancel."
    )


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
            print(
                "Checking face..."
            )

            print(
                "Please wait..."
            )


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
                print(
                    "=========================================="
                )

                print(
                    "FACE VERIFICATION RESULT"
                )

                print(
                    "=========================================="
                )


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
                print(
                    "FACE VERIFICATION ERROR"
                )

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
    print(
        "=========================================="
    )

    print(
        "RFID DETECTED:",
        card_id
    )

    print(
        "MODE:",
        current_mode
    )

    print(
        "=========================================="
    )


    # ========================================================
    # REGISTRATION
    # ========================================================

    if current_mode == "REGISTER":

        print()
        print(
            "Enter student name:"
        )


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


        reply = send_to_google(
            "REGISTER",
            card_id,
            student_name
        )


        if reply == "SUCCESS_REG":

            print()
            print(
                "REGISTRATION SUCCESSFUL"
            )


            current_mode = "ATTENDANCE"

            return "SUCCESS_REG"


        if reply == "ALREADY_EXISTS":

            print(
                "Card already exists."
            )


            current_mode = "ATTENDANCE"

            return "ALREADY_EXISTS"


        print(
            "Google registration failed."
        )


        current_mode = "ATTENDANCE"

        return "FAIL_UNKNOWN"


    # ========================================================
    # ATTENDANCE
    # ========================================================

    print(
        "Checking RFID..."
    )


    reply = send_to_google(
        "CHECK_CARD",
        card_id
    )


    if reply != "CARD_FOUND":

        print(
            "Unknown RFID card."
        )

        return "FAIL_UNKNOWN"


    print(
        "RFID verified."
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

        return "FAIL_UNKNOWN"


    print()
    print(
        "RFID VERIFIED"
    )

    print(
        "FACE VERIFIED"
    )

    print(
        "ACCESS GRANTED"
    )


    reply = send_to_google(
        "ATTENDANCE",
        card_id
    )


    if reply == "SUCCESS_MATCH":

        print(
            "Attendance marked."
        )

        return "SUCCESS_MATCH"


    print(
        "Could not mark attendance."
    )

    return "FAIL_UNKNOWN"


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
    print(
        "=========================================="
    )

    print(
        "SMART ATTENDANCE SYSTEM"
    )

    print(
        "=========================================="
    )

    print()

    print(
        "Wi-Fi mode enabled."
    )

    print(
        "Press R = Register"
    )

    print(
        "Press Q = Quit"
    )

    print()


    while True:

        key = input(
            "> "
        ).strip().lower()


        if key == "r":

            with mode_lock:

                current_mode = "REGISTER"


            print()
            print(
                "REGISTER MODE ENABLED"
            )

            print(
                "Scan the new RFID card."
            )

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
    print(
        "Starting Wi-Fi server..."
    )

    print(
        "Laptop server:"
    )

    print(
        "http://0.0.0.0:5000"
    )

    print()


    app.run(
        host="0.0.0.0",
        port=5000,
        threaded=True
    )

