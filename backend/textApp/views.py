from posts.models import Owner, Tenant
import serial
import time
from django.http import JsonResponse
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def send_sms_to_owners(request):
    # Set up the serial connection to SIM800L
    SERIAL_PORT = '/dev/ttyAMA0'  # Adjust if necessary
    BAUD_RATE = 9600

    try:
        # Initialize the serial connection
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)

        def send_sms(phone_number, message):
            try:
                # Prepare AT commands
                ser.write(b'AT\r')
                time.sleep(1)
                ser.write(b'AT+CMGF=1\r')  # Set SMS to text mode
                time.sleep(1)
                ser.write(f'AT+CMGS="{phone_number}"\r'.encode())
                time.sleep(1)
                ser.write((message + "\x1A").encode())  # Send message and Ctrl+Z to send
                time.sleep(3)  # Wait for the message to send
                return True
            except Exception as e:
                return False

        # Get the current month and year
        current_month = datetime.now().month
        current_year = datetime.now().year
        month_name = datetime(1, current_month, 1).strftime('%B')

        # Fetch all tenants and categorize by room
        tenants = Tenant.objects.all()
        room_categories = {}

        for tenant in tenants:
            # Check if the tenant has paid for the current month and year
            payment_status = tenant.payment_status.get(str(current_year), {})
            has_paid = payment_status.get(month_name, 'unpaid') == 'paid'

            # Create a room identifier
            room_id = tenant.assigned_room  # Assuming assigned_room is an object; adjust if it's an ID

            # Create a room entry if it doesn't exist
            if room_id not in room_categories:
                room_categories[room_id] = {"paid": [], "unpaid": []}

            # Add tenant to the appropriate list
            tenant_name = f"{tenant.boarderfirstname} {tenant.boarderlastname}"  # Full name
            if has_paid:
                room_categories[room_id]["paid"].append(tenant_name)
            else:
                room_categories[room_id]["unpaid"].append(tenant_name)

        # Fetch all owners
        owners = Owner.objects.all()
        sent_sms = []

        for owner in owners:
            # Construct the message for each owner
            message = f"Hello {owner.ownerfirstname},\n\nHere are the payment statuses of your tenants for {month_name} {current_year}:\n"

            for room, statuses in room_categories.items():
                room_info = f"Room {room}:\n"  # Adjust this if room_id needs more info
                room_info += f"  Paid: {', '.join(statuses['paid']) if statuses['paid'] else 'None'}\n"
                room_info += f"  Unpaid: {', '.join(statuses['unpaid']) if statuses['unpaid'] else 'None'}\n"
                message += room_info

            # Send the message to the owner's contact number
            result = send_sms(owner.ownercontact, message)  # Use the updated contact field
            sent_sms.append({"owner": owner.ownercontact, "status": "success" if result else "failed"})

        return JsonResponse({"status": "completed", "results": sent_sms})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})

# Uncomment to run the function
#send_sms_to_owners()

# Function to send SMS reminders 10 days before the due date
def send_tenant_sms_reminders():
    current_date = now()
    # Set timezone if needed
    timezone = pytz.timezone("Asia/Manila")
    current_date = current_date.astimezone(timezone)

    ten_days_later = current_date + timedelta(days=10)

    tenants = Tenant.objects.filter(due_date=ten_days_later.date())
    for tenant in tenants:
        message = f"Hi {tenant.boarderfirstname}, this is a reminder that your rent is due in 10 days on {tenant.due_date}. Please ensure your payment is on time. Thank you."
        send_sms(tenant.boardercontactnumber, message)

    return f"{tenants.count()} tenants notified."


@csrf_exempt
def send_welcome_sms(request, tenant_id):
    if request.method == "POST":
        try:
            # Fetch tenant information
            tenant = Tenant.objects.get(id=tenant_id)

            # Prepare and send SMS for the tenant
            tenant_message = f"Welcome {tenant.boarderfirstname}! Your passcode is {tenant.passcode}."
            send_sms(tenant.boardercontactnumber, tenant_message)

            print(f"Successfully sent welcome message to Tenant ID: {tenant_id} ({tenant.boarderfirstname} {tenant.boarderlastname}).")
            return JsonResponse({"status": "success", "message": "Welcome message sent!"})

        except Tenant.DoesNotExist:
            print(f"Error: Tenant with ID {tenant_id} does not exist.")
            return JsonResponse({"status": "error", "message": "Tenant not found."})
        except Exception as e:
            print(f"Error sending welcome message: {str(e)}")
            return JsonResponse({"status": "error", "message": str(e)})

    print("Invalid request method.")
    return JsonResponse({"status": "error", "message": "Invalid request."})


def send_welcome_message(tenant):
    contact_number = tenant.boardercontactnumber
    message = f"Welcome {tenant.boarderfirstname}! Your passcode is {tenant.passcode}."
    send_sms(contact_number, message)  # Call your SMS function here


# This is your actual SMS sending function

def send_sms(contact_number, message):
    # Set up the serial connection to SIM800L
    SERIAL_PORT = '/dev/ttyAMA0'  # Adjust if necessary
    BAUD_RATE = 9600

    try:
        # Initialize the serial connection
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)

        def send_sms_to_number(phone_number, message_text):
            try:
                # Send initial AT command to check connection
                ser.write(b'AT\r')
                time.sleep(1)
                ser.write(b'AT+CMGF=1\r')  # Set SMS to text mode
                time.sleep(1)

                # Send the SMS command with phone number
                ser.write(f'AT+CMGS="{phone_number}"\r'.encode())
                time.sleep(1)

                # Send the message and terminate with Ctrl+Z
                ser.write((message_text + "\x1A").encode())
                time.sleep(3)  # Wait for the message to send

                # Reading the response (optional for logging or error checking)
                response = ser.read(ser.inWaiting()).decode()
                print(f"Response after sending SMS: {response}")

                return True  # Assuming success if no exception
            except Exception as e:
                print(f"Failed to send SMS to {phone_number}: {str(e)}")
                return False

        # Sending SMS to the given contact number
        result = send_sms_to_number(contact_number, message)

        if result:
            print(f"SMS successfully sent to {contact_number}: {message}")
        else:
            print(f"Failed to send SMS to {contact_number}")

        return result

    except Exception as e:
        print(f"Error in sending SMS: {str(e)}")
        return False
