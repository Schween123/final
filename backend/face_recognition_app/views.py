from django.http import JsonResponse
import face_recognition
import cv2
import numpy as np
import os
import time

# Load known faces once when the app starts
known_faces = []
known_names = []
known_statuses = []  # To store status (owner/tenant)

def load_known_faces():
    # Load tenants
    tenants_directory = '/home/pi/Downloads/HyptechVF.2/Faces/Tenants'
    for filename in os.listdir(tenants_directory):
        if filename.endswith('.jpg'):
            image = face_recognition.load_image_file(os.path.join(tenants_directory, filename))
            encodings = face_recognition.face_encodings(image)
            if encodings:
                known_faces.append(encodings[0])
                known_names.append(filename[:-4])  # Remove .jpg from filename
                known_statuses.append('tenant')  # Set status as tenant

    # Load owners
    owners_directory = '/home/pi/Downloads/HyptechVF.2/Faces/Admin'
    for filename in os.listdir(owners_directory):
        if filename.endswith('.jpg'):
            image = face_recognition.load_image_file(os.path.join(owners_directory, filename))
            encodings = face_recognition.face_encodings(image)
            if encodings:
                known_faces.append(encodings[0])
                known_names.append(filename[:-4])  # Remove .jpg from filename
                known_statuses.append('owner')  # Set status as owner

    print(f"Loaded {len(known_faces)} known faces.")

load_known_faces()

def recognize_faces_from_live_feed():
    video_capture = cv2.VideoCapture(0)

    print("Camera initialized and face recognition started.")

    start_time = time.time()  # Start the timer

    while True:
        ret, frame = video_capture.read()

        if not ret:
            print("Failed to grab frame from camera.")
            break

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        if face_encodings:
            for face_encoding in face_encodings:
                matches = face_recognition.compare_faces(known_faces, face_encoding, tolerance=0.6)
                face_distances = face_recognition.face_distance(known_faces, face_encoding)

                best_match_index = np.argmin(face_distances)

                if matches[best_match_index]:
                    name = known_names[best_match_index]
                    status = known_statuses[best_match_index]  # Get the status
                    print(f"Face detected: {name} ({status})")  # Log the detected face name
                    video_capture.release()
                    return {'name': name, 'status': status}  # Return name and status
        else:
            # No faces detected, check if 5 seconds have passed
            if time.time() - start_time > 5:
                print("No face detected for 5 seconds, stopping.")
                video_capture.release()
                return {'name': None, 'status': 'none'}  # No face detected in 5 seconds

        # Optional: Sleep for a short duration to reduce CPU usage
        time.sleep(0.1)

    video_capture.release()
    print("Face recognition stopped and camera released.")
    return {'name': None, 'status': 'none'}


def start_live_feed(request):
    detection_result = recognize_faces_from_live_feed()
    return JsonResponse(detection_result, status=200)

def reload_faces(request):
    directory = '/home/pi/Downloads/HyptechVF.2/Faces/Tenants'

    # Track the previous count of known faces
    previous_count = len(known_names)

    # Iterate through the files in the directory
    for filename in os.listdir(directory):
        if filename.endswith('.jpg'):
            face_name = filename[:-4]  # Get the name without the .jpg extension
            
            # Only process if the face name is not already known
            if face_name not in known_names:
                image = face_recognition.load_image_file(os.path.join(directory, filename))
                encodings = face_recognition.face_encodings(image)

                # Ensure encodings are found
                if encodings:
                    known_faces.append(encodings[0])  # Store the encoding
                    known_names.append(face_name)  # Add the new name to known_names

    # Print the total count of known faces after the reload
    current_count = len(known_names)
    print(f"Total known faces: {current_count}")

    return JsonResponse({
        'status': 'success',
        'message': 'Faces reloaded successfully',
        'total_known_faces': current_count  # Total count of known faces
    }, status=200)
