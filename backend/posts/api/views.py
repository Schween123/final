import json
import os
import random  # Import random module
import time
import base64
import serial
import logging
import numpy as np
import requests
import atexit
import traceback
import pytz

from django.views import View
from django.http import JsonResponse
from django.utils.timezone import now
from django.utils.decorators import method_decorator
from datetime import datetime, timedelta, date
from django.views.decorators.csrf import csrf_exempt

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from ..utils import send_sms
 
import RPi.GPIO as GPIO
import adafruit_fingerprint
from pyfingerprint.pyfingerprint import PyFingerprint
import face_recognition
import threading


# Import models
from ..models import (
    Owner,
    BoardingHouse,
    Room,
    Tenant,
    Guardian,
    Transaction, 
    GcashTransaction,
    GcashTransactionMonth,
    
)

# Import serializers
from .serializers import (
    OwnerSerializer,
    BoardingHouseSerializer,
    RoomSerializer,
    TenantSerializer, 
    GuardianSerializer,
    TransactionSerializer,
    GcashTransactionSerializer,
    
)


def setup_gpio(pins, mode):
    GPIO.setmode(mode)
    for pin in pins:
        GPIO.setup(pin, GPIO.OUT)

class OwnerViewSet(viewsets.ModelViewSet):
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer

class BoardingHouseViewSet(viewsets.ModelViewSet):
    queryset = BoardingHouse.objects.all()
    serializer_class = BoardingHouseSerializer

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def create(self, request, *args, **kwargs):
        if isinstance(request.data, list):  # Check if the data is a list (bulk create)
            serializers = [self.get_serializer(data=item) for item in request.data]
            for serializer in serializers:
                serializer.is_valid(raise_exception=True)
            self.perform_bulk_create(serializers)
            return Response([serializer.data for serializer in serializers], status=status.HTTP_201_CREATED)
        else:  # Single object creation
            return super().create(request, *args, **kwargs)

    def perform_bulk_create(self, serializers):
        rooms = [serializer.save() for serializer in serializers]
        

class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer

    def create(self, request, *args, **kwargs):
        passcode = "{:04d}".format(random.randint(0, 9999))
        while Tenant.objects.filter(passcode=passcode).exists():
            passcode = "{:04d}".format(random.randint(0, 9999))
        data = request.data.copy()
        data['passcode'] = passcode
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        # Include the newly created tenant's ID in the response
        headers = self.get_success_headers(serializer.data)
        response_data = {
            'id': serializer.instance.id,  # Get the newly created tenant's ID
            **serializer.data  # Include the other serialized data
            }
            
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Get the assigned room from the request data
        room_id = request.data.get('assigned_room')

        if room_id:
            try:
                room = Room.objects.get(id=room_id)
                
                # Check if the room is fully occupied
                if room.tenant_set.count() >= room.capacity:
                    return Response(
                        {'error': f'Room {room.room_number} is fully occupied'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Room.DoesNotExist:
                return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        # If the room is not full, proceed with the update
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Update payment status after any update
        instance.update_payment_status()

        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='payment-status')
    def payment_status(self, request, pk=None):
        tenant = self.get_object()
        tenant.update_payment_status()  # Ensure the payment status is up-to-date
        return Response(tenant.payment_status)

    @action(detail=True, methods=['post'])
    def update_payment_status(self, request, pk=None):
        tenant = self.get_object()
        data = request.data
        tenant.payment_status.update(data)
        tenant.save()
        return Response({'status': 'Payment status updated'})

    @action(detail=False, methods=['get'], url_path=r'room/(?P<room_id>\d+)')
    def tenants_by_room(self, request, room_id=None):
        """Get all tenants assigned to a specific room."""
        if room_id is not None:
            tenants = self.queryset.filter(assigned_room_id=room_id)
            serializer = self.get_serializer(tenants, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Room ID is required."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='login-with-passcode')
    def login_with_passcode(self, request):
        """Login with tenant passcode."""
        tenant_id = request.data.get('tenant_id')
        passcode = request.data.get('passcode')

        if tenant_id and passcode:
            try:
                tenant = Tenant.objects.get(id=tenant_id)
                if passcode == tenant.passcode:
                    return Response({'status': 'Login successful'}, status=status.HTTP_200_OK)
                else:
                    return Response({'error': 'Invalid passcode'}, status=status.HTTP_400_BAD_REQUEST)
            except Tenant.DoesNotExist:
                return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'error': 'Tenant ID and passcode are required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='verify-passcode')
    def verify_passcode(self, request):
        """Verify passcode."""
        tenant_id = request.data.get('tenantId')
        passcode = request.data.get('passcode')

        if tenant_id and passcode:
            try:
                tenant = Tenant.objects.get(id=tenant_id)
                if passcode == tenant.passcode:
                    # Include boarderfirstname in the response
                    return Response({
                        'tenantId': tenant.id,
                        'boarderfirstname': tenant.boarderfirstname  # Add first name to response
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({'message': 'Invalid passcode'}, status=status.HTTP_400_BAD_REQUEST)
            except Tenant.DoesNotExist:
                return Response({'message': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'message': 'Tenant ID and passcode are required'}, status=status.HTTP_400_BAD_REQUEST)
    
class GuardianViewSet(viewsets.ModelViewSet):
    queryset = Guardian.objects.all()
    serializer_class = GuardianSerializer

     # Custom action to get guardian by tenant ID
    def guardian_list(request):
        tenant_id = request.GET.get('tenant')
        guardians = get_list_or_404(Guardian, tenant_id=tenant_id)
        serializer = GuardianSerializer(guardians, many=True)
        return Response(serializer.data)


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

    def get_queryset(self):
        tenant_id = self.request.query_params.get('tenantId')
        if tenant_id:
            return Transaction.objects.filter(tenant_id=tenant_id)
        return Transaction.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()  # Make a mutable copy of request.dat

        # Convert 'transaction_date' to the actual transaction date (e.g., today)
        if 'transaction_date' in data:
            try:
                data['transaction_date'] = datetime.strptime(data['transaction_date'], '%d-%m-%Y').date()
            except ValueError:
                data['transaction_date'] = datetime.now().date()
        else:
            data['transaction_date'] = datetime.now().date()

        # Ensure 'transaction_time' is set to the current time if not provided
        if 'transaction_time' in data:
            try:
                data['transaction_time'] = datetime.strptime(data['transaction_time'], '%H:%M:%S').time()
            except ValueError:
                data['transaction_time'] = datetime.now().time()
        else:
            data['transaction_time'] = datetime.now().time()

    # Ensure 'month_paid_for' and 'year_paid_for' are taken from request
        if 'month_paid_for' not in data:
            data['month_paid_for'] = datetime.now().month  # Set default if missing
        if 'year_paid_for' not in data:
            data['year_paid_for'] = datetime.now().year  # Set default if missing


        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            # Save the transaction
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class DashboardDataViewSet(viewsets.ViewSet):
    def list(self, request):
        current_month = now().month
        current_year = now().year
        
        total_tenants = Tenant.objects.count()
        paid_tenants = Transaction.objects.filter(
            is_paid=True,
            transaction_date__month=current_month,
            transaction_date__year=current_year
        ).count()
        unpaid_tenants = total_tenants - paid_tenants

        data = {
            'total_tenants': total_tenants,
            'paid_tenants': paid_tenants,
            'unpaid_tenants': unpaid_tenants
        }
        return Response(data)


class GcashTransactionViewSet(viewsets.ModelViewSet):
    queryset = GcashTransaction.objects.all()
    serializer_class = GcashTransactionSerializer

    def get_queryset(self):
        tenant_id = self.request.query_params.get('tenantId')
        if tenant_id:
            return GcashTransaction.objects.filter(tenant_id=tenant_id)
        return GcashTransaction.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        if 'transaction_date' in data:
            try:
                data['transaction_date'] = datetime.strptime(data['transaction_date'], '%d/%m/%Y').date()
            except ValueError:
                return Response({'error': 'Invalid date format for transaction_date'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            data['transaction_date'] = datetime.now().date()

        if 'transaction_time' in data:
            try:
                data['transaction_time'] = datetime.strptime(data['transaction_time'], '%H:%M:%S').time()
            except ValueError:
                return Response({'error': 'Invalid time format for transaction_time'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            data['transaction_time'] = datetime.now().time()

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Function-based views (these are registered using path)
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        try:
            transaction = self.get_object()

            # Check if the transaction is already confirmed
            if transaction.status == 'CONFIRMED':
                return Response({"error": "Transaction already confirmed"})

            # Update the transaction status to 'CONFIRMED'
            transaction.status = 'CONFIRMED'
            transaction.save()

            # Get the related months and years using the related name 'months'
            months_paid_for = transaction.months.values_list('month_paid_for', flat=True)
            years_paid_for = transaction.months.values_list('year_paid_for', flat=True)

            # Debugging logs
            print(f"Months paid for: {months_paid_for}")
            print(f"Years paid for: {years_paid_for}")

            # Check for any mismatch
            if len(months_paid_for) != len(years_paid_for):
                return Response({"error": "Mismatch between months_paid_for and years_paid_for"}, status=status.HTTP_400_BAD_REQUEST)

            # Calculate the amount per month
            amount_per_month = transaction.amount_paid / len(months_paid_for)
            print(f"Amount per month: {amount_per_month}")

            # Create Transaction records
            for month, year in zip(months_paid_for, years_paid_for):
                Transaction.objects.create(
                    tenant=transaction.tenant,
                    amount_paid=amount_per_month,
                    payment_method=transaction.payment_method,
                    month_paid_for=month,
                    year_paid_for=year,
                    
                )

            return Response({"message": "Transaction confirmed and recorded successfully."}, status=status.HTTP_200_OK)

        except GcashTransaction.DoesNotExist:
            return Response({"error": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error confirming transaction: {str(e)}")  # For debugging
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        try:
            transaction = self.get_object()
            if transaction.status == 'REJECTED':
                return Response({"error": "Transaction already rejected"}, status=status.HTTP_400_BAD_REQUEST)

            transaction.status = 'REJECTED'
            transaction.save()
            
            return Response({"message": "Transaction rejected successfully."}, status=status.HTTP_200_OK)
        except GcashTransaction.DoesNotExist:
            return Response({"error": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class BillAcceptorView(APIView):
    billAcceptorPin = 7  # Physical Pin 7 (GPIO4)
    pulseDtct = 0        # Counter for consecutive pulses
    lastPulseTime = 0    # Stores the time when the last pulse was detected
    pulseDelay = 0.5     # Maximum delay between pulses in seconds
    detection_lock = threading.Lock()  # Ensure single access to pulse detection

    def setup_gpio(self):
        GPIO.setmode(GPIO.BOARD)
        GPIO.setup(self.billAcceptorPin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        time.sleep(0.5)  # Add a short delay to ensure the bill acceptor is ready
        print("GPIO setup complete")

    def detect_bill(self):
        with self.detection_lock:  # Prevent overlapping detections
            start_time = time.time()
            bill_value = 0
            self.pulseDtct = 0
            pulse_detected = False

            while time.time() - start_time < 30:  # Timeout after 30 seconds
                pinState = GPIO.input(self.billAcceptorPin)
                currentTime = time.time()

                if pinState == GPIO.LOW:  # Pulse detected
                    if currentTime - self.lastPulseTime <= self.pulseDelay:
                        self.pulseDtct += 1
                        print(self.pulseDtct)
                    else:
                        self.pulseDtct = 1  # Reset pulse count if the delay is too long

                    self.lastPulseTime = currentTime
                    pulse_detected = True

                if pulse_detected and (currentTime - self.lastPulseTime > self.pulseDelay):
                    # Map pulse count to bill values based on the ranges
                    if self.pulseDtct == 2:
                        bill_value = 20
                    elif self.pulseDtct == 5:
                        bill_value = 50
                    elif 8 <= self.pulseDtct <= 12:
                        bill_value = 100
                    elif 15 <= self.pulseDtct <= 25:
                        bill_value = 200
                    elif 40 <= self.pulseDtct <= 60:
                        bill_value = 500
                    elif 75 <= self.pulseDtct <= 110:
                        bill_value = 1000
                    else:
                        bill_value = 0  # Invalid bill value, not in the expected pulse ranges

                    # Print pulse count and corresponding bill value
                    print(f"Pulse detected! Pulse count: {self.pulseDtct}, Bill value: {bill_value}")

                    break

                time.sleep(0.05)  # Small delay between readings to prevent overloading CPU

            self.pulseDtct = 0  # Reset pulse count after reading
            return bill_value

    def get(self, request, format=None):
        try:
            self.setup_gpio()  # Initialize GPIO setup
            bill_value = self.detect_bill()  # Run bill detection
            return Response({'bill_value': bill_value}, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            GPIO.cleanup()  # Clean up GPIO setup after use

# Ultrasonic Sensor GPIO Interaction
class UltrasonicSensorView(APIView):
    atexit.register(GPIO.cleanup)
    def initialize_gpio(self):
        GPIO.setmode(GPIO.BCM)
        self.GPIO_TRIGGER = 23
        self.GPIO_ECHO = 24
        GPIO.setup(self.GPIO_TRIGGER, GPIO.OUT)
        GPIO.setup(self.GPIO_ECHO, GPIO.IN)

    def get_distance(self):
        GPIO.output(self.GPIO_TRIGGER, True)
        time.sleep(0.00001)
        GPIO.output(self.GPIO_TRIGGER, False)

        start_time = time.time()
        stop_time = time.time()

        while GPIO.input(self.GPIO_ECHO) == 0:
            start_time = time.time()

        while GPIO.input(self.GPIO_ECHO) == 1:
            stop_time = time.time()

        time_elapsed = stop_time - start_time
        distance = (time_elapsed * 34300) / 2
        return distance

    def get(self, request, format=None):
        try:
            self.initialize_gpio()
            distance = self.get_distance()
        finally:
            GPIO.cleanup()
        return Response({'distance': distance}, status=status.HTTP_200_OK)


# Face Image Upload
@api_view(['POST'])
def upload_face_image(request):
    image = request.FILES.get('image')
    first_name = request.POST.get('ownerfirstname', 'undefined')

    if image:
        filename = f"{first_name}.jpg"
        save_path = os.path.join('/home/pi/Downloads/HyptechVF.2/Faces/Admin', filename)
        with open(save_path, 'wb+') as destination:
            for chunk in image.chunks():
                destination.write(chunk)
        return JsonResponse({'status': 'success', 'message': 'Image uploaded successfully'})
    return JsonResponse({'status': 'error', 'message': 'No image uploaded'})

# Face Image Upload Boarders
@api_view(['POST'])
def upload_face_tenant(request):
    tenant_id = request.POST.get('tenantId')  # Assuming the tenant ID is sent as part of the POST data
    image = request.FILES.get('image')
    
    # Log the incoming data
    print(f"Received tenant ID: {tenant_id}")
    print(f"Received image: {image}")
    

    if image:
        filename = f"{tenant_id}.jpg"
        save_path = os.path.join('/home/pi/Downloads/HyptechVF.2/Faces/Tenants', filename)
        with open(save_path, 'wb+') as destination:
            for chunk in image.chunks():
                destination.write(chunk)
        return JsonResponse({'status': 'success', 'message': 'Image uploaded successfully'})
    return JsonResponse({'status': 'error', 'message': 'No image uploaded'})



# Initialize serial connection with Arduino on /dev/ttyACM0
try:
    uart = serial.Serial("/dev/ttyACM0", baudrate=9600, timeout=1)
    time.sleep(2)  # Give the connection some time to settle
except Exception as e:
    uart = None
    print(f"Error initializing serial connection: {e}")

# Helper function to send a command and read the response from the Arduino
def send_command(command):
    uart.write(command.encode() + b'\n')  # Send the command to Arduino

    # Wait for a response from the Arduino
    response_lines = []
    while True:
        if uart.in_waiting > 0:
            line = uart.readline().decode().strip()  # Read a line from the Arduino
            if line:
                print(line)  # Debugging: print the response
                response_lines.append(line)
                
                # Check for specific messages in the response
                if "Waiting for valid finger" in line:
                    print("Please place your finger on the sensor.")
                elif line == "Enrollment complete.":
                    return {'status': 'success', 'message': 'Enrollment complete.'}
                elif line == "Enrollment failed.":
                    return {'status': 'error', 'message': 'Enrollment failed. Please try again.'}
                elif line == "No match found.":
                    return {'status': 'error', 'message': 'No match found.'}
                elif "Found a match" in line:
                    return {'status': 'success', 'message': line}  # Includes match info
                elif "Choose an option:" in line:
                    break  # End the loop when the prompt appears again

    # Default case if no specific response is found
    return {'status': 'error', 'message': 'No valid response from Arduino'}

# API to handle fingerprint enrollment
@api_view(['GET'])
def test_fingerprint_read(request):
    if uart is None:
        return Response({'status': 'error', 'message': 'Serial connection failed'}, status=500)

    # Send the ENROLL command
    print("Sending ENROLL command to Arduino...")
    result = send_command("ENROLL")
    
    # Return the result based on the Arduino's response
    if result['status'] == 'success':
        return Response(result)
    else:
        return Response(result, status=400 if 'failed' in result['message'] else 500)

# API to handle fingerprint matching
@api_view(['GET'])
def check_fingerprint_match(request):
    if uart is None:
        return Response({'status': 'error', 'message': 'Serial connection failed'}, status=500)

    # Send the MATCH command
    print("Sending MATCH command to Arduino...")
    result = send_command("MATCH")
    
    # Return the result based on the Arduino's response
    if result['status'] == 'success':
        return Response(result)
    else:
        return Response(result, status=404 if 'No match' in result['message'] else 500)


def setup_relay():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(27, GPIO.OUT)  # Set relay pin to OUTPUT
    GPIO.output(27, GPIO.HIGH)
    
# Disable GPIO warnings
GPIO.setwarnings(False)

setup_relay()

@api_view(['POST'])
def control_relay(request):
    
    setup_relay()
    
    state = request.data.get('state')
    
    if state == 'off':
        GPIO.output(27, GPIO.HIGH)  # Turn relay on
        print("Relay is turned on")
        return Response({"message": "Relay turned off"}, status=status.HTTP_200_OK)
    
    elif state == 'on':
        GPIO.output(27, GPIO.LOW)  # Turn relay off
        print("Relay is turned off")
        return Response({"message": "Relay turned on"}, status=status.HTTP_200_OK)

    # If the state is invalid
    return Response({"error": "Invalid state. Use 'on' or 'off'."}, status=status.HTTP_400_BAD_REQUEST)

# Register cleanup
atexit.register(GPIO.cleanup)

#facerec
@csrf_exempt  # Disable CSRF only for testing purposes
def face_recognition_view(request):
    if request.method == 'POST' and request.FILES.get('image'):
        # Get the image from the request
        image = request.FILES['image']
        
        # Prepare the file for forwarding to Flask
        files = {'image': image}
        
        # Send the image to the Flask service
        response = requests.post('http://localhost:8000/recognize-face', files=files)
        
        # Return the response from Flask back to the frontend
        return JsonResponse(response.json(), status=response.status_code)
    else:
        return JsonResponse({'error': 'No image provided'}, status=400)
    
@csrf_exempt
def boarder_face_register(request):
    if request.method == 'POST':
        tenant_id = request.POST.get('tenantId')
        image = request.FILES.get('image')

        if not tenant_id:
            return JsonResponse({'message': 'Tenant ID not provided'}, status=400)

        if not image:
            return JsonResponse({'message': 'No image provided'}, status=400)

        try:
            # Assuming the folder structure '/home/pi/Desktop/HyptechVF.2/Faces/Tenants/{tenantId}.jpg'
            save_path = os.path.join('/home/pi/Downloads/HyptechVF.2/Faces/Tenants', f'{tenant_id}.jpg')
            
            # Saving the image to the specified path
            with open(save_path, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)

            # Print the image path to the console for debugging
            print(f'Image saved at: {save_path}')

            # Update the Tenant model with the saved image path
            tenant = Tenant.objects.get(id=tenant_id)
            tenant.boarder_face = save_path
            tenant.save()

            return JsonResponse({'message': 'Image path saved successfully'}, status=200)

        except Tenant.DoesNotExist:
            return JsonResponse({'message': 'Tenant not found'}, status=404)
        except Exception as e:
            print(f'Error: {e}')
            return JsonResponse({'message': 'Error saving image path'}, status=500)
    else:
        return JsonResponse({'message': 'Invalid request method'}, status=405)


@api_view(['DELETE'])
def delete_image(request):
    image_path = request.data.get('imagePath')
    print(image_path)
    if not image_path:
        return JsonResponse({'error': 'Image path is required.'}, status=400)

    try:
        if os.path.exists(image_path):
            os.remove(image_path)  # Delete the image file
            return JsonResponse({'success': 'Image deleted successfully.'}, status=200)
        else:
            return JsonResponse({'error': 'Image not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# Initialize the serial connection globally
ser = serial.Serial('/dev/serial0', 9600, timeout=1)

@csrf_exempt
def send_tenant_sms_reminders_view(request):
    if request.method == "POST":
        try:
            current_date = now()
            timezone = pytz.timezone("Asia/Manila")
            current_date = current_date.astimezone(timezone)
            print(f"Current Date: {current_date}")  # Debugging line

            # Fetch all tenants
            tenants = Tenant.objects.all()
            print(f"Total Tenants: {len(tenants)}")  # Debugging line

            # Notify owners about the remaining days until due dates for all tenants
            owners = Owner.objects.all()
            for owner in owners:
                message = f"Hello {owner.ownerfirstname}, here are the remaining days until due dates for your tenants:\n"
                for tenant in tenants:
                    days_left = (tenant.due_date - current_date.date()).days
                    print(f"Tenant: {tenant.boarderfirstname}, Due Date: {tenant.due_date}, Days Left: {days_left}")  # Debugging line
                    # Add tenant information only if days_left is non-negative
                    if days_left >= 0:
                        message += f"- {tenant.boarderfirstname} {tenant.boarderlastname}: {days_left} days left until due date on {tenant.due_date}.\n"
                
                # Send the SMS only if the message is not empty
                if message.strip():  # Check if the message is not just whitespace
                    send_sms(owner.ownercontact, message)

            return JsonResponse({"status": "success", "message": "Owners notified about tenants' due dates."})

        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)})
    else:
        return JsonResponse({"status": "error", "message": "Invalid request method."})


def send_sms(phone_number, message_text):
    try:
        ser.write(b'AT\r')
        time.sleep(1)
        response = ser.read(ser.inWaiting()).decode()
        print(f"Initial AT Response: {response}")  # Log initial response

        ser.write(b'AT+CMGF=1\r')
        time.sleep(2)
        response = ser.read(ser.inWaiting()).decode()
        print(f"CMGF Set Response: {response}")  # Log response after setting SMS mode

        ser.write(f'AT+CMGS="{phone_number}"\r'.encode())
        time.sleep(2)
        response = ser.read(ser.inWaiting()).decode()
        print(f"Phone Number Set Response: {response}")  # Log response after entering number

        ser.write((message_text + "\x1A").encode())
        time.sleep(5)  # Wait for longer duration to ensure send completes
        response = ser.read(ser.inWaiting()).decode()
        print(f"Message Send Response: {response}")  # Log response after sending message

        return "OK" in response  # Check if the response contains "OK"
    except Exception as e:
        print(f"Failed to send SMS to {phone_number}: {str(e)}")
        return False

def get_tenant_due(request, tenant_id):
    try:
        tenant = Tenant.objects.get(id=tenant_id)
        current_date = now()  # Get the current date with timezone information
        total_due = calculate_total_due(tenant, current_date)  # Call your function here

        # Calculate remaining days before the due date
        due_date = tenant.due_date
        if isinstance(due_date, date) and not isinstance(due_date, datetime):
            due_date = datetime.combine(due_date, datetime.min.time())

        # Ensure due_date is timezone-aware
        if due_date.tzinfo is None:
            due_date = pytz.timezone('Asia/Manila').localize(due_date)

        remaining_days = (due_date - current_date).days

        # Send message via GSM module here (pseudo-code)
        # gsm_module.send_message(f"Your total payable amount is: {total_due}")

        return JsonResponse({'total_due': total_due, 'remaining_days': remaining_days})
    except Tenant.DoesNotExist:
        return JsonResponse({'error': 'Tenant not found'}, status=404)
    


def tenant_due_reminder(request):
    # Get today's date
    today = date.today()
    
    tenant_due_data = []  # For backend response with remaining days per tenant

    # Check all tenants and send reminders if needed
    tenants = Tenant.objects.all()
    for tenant in tenants:
        if tenant.duedate_updated:
            remaining_days = (tenant.duedate_updated - today).days

            # Collect tenant due data regardless of remaining days
            tenant_due_data.append({
                "tenant_id": tenant.id,
                "tenant_name": f"{tenant.boarderfirstname}",
                "remaining_days": remaining_days,
                "due_date": tenant.duedate_updated
            })

            # Send SMS only if remaining days are 31 or fewer
            if 0 < remaining_days <= 10:
                tenant_message = (
                    f"Hello {tenant.boarderfirstname}. "
                    f"You have {remaining_days} day(s) left until the due date on {tenant.duedate_updated}. "
                    "Please don't forget to bring payment next time."
                )
                send_sms(tenant.boardercontactnumber, tenant_message)

    # Response with tenant due information
    return JsonResponse({
        "status": "SMS reminders sent to tenants with 31 or fewer days until due date.",
        "tenant_due_data": tenant_due_data
    })

logger = logging.getLogger(__name__)



@api_view(['POST'])
def confirm_payment(request):
    if request.method == 'POST':
        # Extracting data from the request
        tenant_id = request.data.get('tenant')  # Get tenant ID from request
        amount_paid = request.data.get('amount_paid')  # Get the amount paid
        transaction_date = request.data.get('transaction_date')  # Get transaction date
        transaction_time = request.data.get('transaction_time')  # Get transaction time

        try:
            # Get tenant information
            tenant = Tenant.objects.get(id=tenant_id)

            # Prepare SMS for tenant
            tenant_message = (
                f"Hello {tenant.boarderfirstname}, you have paid {amount_paid} "
                f"on {transaction_date} at {transaction_time}.\n\nPlease do not delete this message."
            )
            send_sms(tenant.boardercontactnumber, tenant_message)  # Send SMS to tenant
            
            guardian = tenant.guardian_set.first()  # Assuming each tenant can have one guardian
            if guardian:
                guardian_message = (
                    f"Dear {guardian.guardianfirstname}, "
                    f"your child, {tenant.boarderfirstname} has paid {amount_paid} her/his Boarding House due on {transaction_date} at {transaction_time}."
                )
                send_sms(guardian.guardiancontactnumber, guardian_message)
            else:
                # Handle the case where there is no guardian
                pass

        
            # Get all owners and send them a notification
            owners = Owner.objects.all()
            owner_message = (
                f"Tenant {tenant.boarderfirstname} {tenant.boarderlastname} has paid "
                f"P{amount_paid} on {transaction_date} at {transaction_time}."
            )
            for owner in owners:
                send_sms(owner.ownercontact, owner_message)  # Send SMS to each owner

            return JsonResponse({"status": "Payment confirmed and SMS notifications sent."}, status=200)
        except Exception as e:
            # Log the error details here for further debugging
            logger.error(f"Error confirming payment: {str(e)}")
            return Response({"error": "Internal Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Tenant.DoesNotExist:
            return JsonResponse({"error": "Tenant not found."}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method."}, status=400)



@api_view(['POST'])
def gcash_confirm_payment(request):
    if request.method == 'POST':
        tenant_id = request.data.get('tenant')
        amount_paid = request.data.get('amount_paid')
        transaction_date = request.data.get('transaction_date')
        transaction_time = request.data.get('transaction_time')
        reference_number = request.data.get('reference_number')

        try:
            tenant = Tenant.objects.get(id=tenant_id)

            # Prepare SMS for tenant
            tenant_message = (
                f"Hello {tenant.boarderfirstname}, you have paid {amount_paid} through Gcash with the reference number {reference_number} on {transaction_date} at {transaction_time}."
                f"Please do not delete this message."
            )
            send_sms(tenant.boardercontactnumber, tenant_message)

            guardian = tenant.guardian_set.first()  # Assuming each tenant can have one guardian
            if guardian:
                guardian_message = (
                    f"Dear {guardian.guardianfirstname}, "
                    f"your son/daughter, {tenant.boarderfirstname} has paid {amount_paid} through Gcash with reference number {reference_number} on {transaction_date} at {transaction_time}."
                )
                send_sms(guardian.guardiancontactnumber, guardian_message)
            else:
                # Handle the case where there is no guardian
                pass


            # Send SMS to owners
            owners = Owner.objects.all()
            owner_message = (
                f"Tenant {tenant.boarderfirstname} {tenant.boarderlastname} has paid through Gcash with the reference number {reference_number}."
                "Please confirm it on our website or in our Hyptech system."
            )
            for owner in owners:
                send_sms(owner.ownercontact, owner_message)

            return JsonResponse({"status": "Payment confirmed and SMS notifications sent."}, status=200)

        except Tenant.DoesNotExist:
            return JsonResponse({"error": "Tenant not found."}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method."}, status=400)



# Set up GPIO globally
GPIO.setwarnings(False)
INHIBIT_PIN = 17  # BCM pin number for inhibit (GPIO17)

setup_gpio([INHIBIT_PIN], GPIO.BCM)
GPIO.output(INHIBIT_PIN, GPIO.HIGH)  # Set inhibit pin to ON by default

def cleanup_gpio():
    """Cleanup GPIO resources on exit."""
    GPIO.cleanup()

# Register cleanup function to run when the program exits
atexit.register(cleanup_gpio)


# inhibit
class InhibitControlView(APIView):
    def post(self, request, format=None):
        action = request.data.get('action')  # Get the action from the request data

        if action not in ['on', 'off']:
            return Response({'error': 'Invalid action. Use "on" or "off".'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if action == 'on':
                GPIO.output(INHIBIT_PIN, GPIO.HIGH)  # Turn inhibit pin ON
                message = "Inhibit pin turned ON."
            elif action == 'off':
                GPIO.output(INHIBIT_PIN, GPIO.LOW)  # Turn inhibit pin OFF
                message = "Inhibit pin turned OFF."

            current_state = GPIO.input(INHIBIT_PIN)
            return Response({'message': message, 'pin_state': current_state}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
