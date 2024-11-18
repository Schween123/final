import requests
import time

# Replace this URL with the actual IP/URL for your Raspberry Pi
API_URL = "http://127.0.0.1:8000/api/poll_transactions/"

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

def check_for_confirmed_rejected_transactions():
    try:
        response = requests.get(API_URL)
        transactions = response.json().get('transactions', [])

        for transaction in transactions:
            # Prepare message for tenant based on transaction status
            status = transaction['status']
            tenant_id = transaction['tenant']
            amount_paid = transaction['amount_paid']
            transaction_date = transaction['transaction_date']
            transaction_time = transaction['transaction_time']
            reference_number = transaction['reference_number']
            
            # Example message template
            message = (
                f"Your GCash transaction with reference {reference_number} has been {status.lower()}. "
                f"Amount: {amount_paid}. Date: {transaction_date} at {transaction_time}."
            )
            # Replace tenant_phone_number with actual phone retrieval based on tenant_id
            tenant_phone_number = "09472956882"  # Placeholder; get actual number
            send_sms(tenant_phone_number, message)

    except Exception as e:
        print(f"Error fetching transactions: {e}")

# Polling loop
while True:
    check_for_confirmed_rejected_transactions()
    time.sleep(60)  # Wait 1 minute before checking again
