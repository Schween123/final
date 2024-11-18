# utils.py
import serial

def send_sms(contact_number, message):
    # Set up serial communication with the GSM module (adjust settings as needed)
    ser = serial.Serial('/dev/ttyAMA0', baudrate=9600, timeout=1)  
    ser.write(b'AT+CMGF=1\r')  # Set SMS text mode
    ser.write(b'AT+CMGS="' + contact_number.encode() + b'"\r')
    ser.write(message.encode() + b'\x1A')  # Send message with termination character
    ser.close()
