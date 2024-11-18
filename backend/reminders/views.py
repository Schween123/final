# /home/pi/Downloads/HyptechVF.2/backend/reminders/views.py
from django.http import JsonResponse
from datetime import date
from posts.models import Tenant
import serial


ser = serial.Serial('/dev/serial0', 9600, timeout=1)


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
    
    
def tenant_due_reminder():
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

    # Return the result of the reminder action (you can also log the response if needed)
    return "SMS reminders sent successfully"

tenant_due_reminder()