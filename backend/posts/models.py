from django.db import models
from django.utils import timezone
from datetime import datetime, date
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid
import re
import random
from django.core.exceptions import ValidationError
from dateutil.relativedelta import relativedelta  # Import this from the dateutil library



class Owner(models.Model):
    ownerfirstname = models.CharField(max_length=255)
    ownerlastname = models.CharField(max_length=255)
    owneraddress = models.CharField(max_length=255)
    ownercontact = models.CharField(max_length=15)
    fingerprint = models.BinaryField(null=True, blank=True)
    face_image = models.CharField(max_length=255, null=True, blank=True)


    def __str__(self):
        return f"{self.ownerfirstname} {self.ownerlastname}"

class BoardingHouse(models.Model):
    id = models.AutoField(primary_key=True)
    bhname = models.CharField(max_length=255, unique=True)
    bhaddress = models.CharField(max_length=255)
    capacity = models.IntegerField(default=0)
    number_of_tenants = models.IntegerField(default=0)
    bhrooms = models.IntegerField(default=0)
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE)

    def __str__(self):
        return self.bhname

class Room(models.Model):
    id = models.AutoField(primary_key=True)
    room_number = models.CharField(max_length=15)
    capacity = models.IntegerField(default=0)
    boarding_house = models.ForeignKey(BoardingHouse, related_name='rooms', on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.room_number} - {self.boarding_house.bhname}'

    @property
    def is_full(self):
        # Count how many tenants are currently assigned to this room
        return self.tenant_set.count() >= self.capacity

class Tenant(models.Model):
    boarderfirstname = models.CharField(max_length=100)
    boardermiddlename = models.CharField(max_length=10, blank=True, null=True)
    boarderlastname = models.CharField(max_length=100)
    boardergender = models.CharField(max_length=50)
    boarderage = models.IntegerField()
    boarderaddress = models.CharField(max_length=200)
    boardercontactnumber = models.CharField(max_length=15)
    boardercourse_profession = models.CharField(max_length=200)
    boarderinstitution = models.CharField(max_length=200)
    assigned_room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    monthly_rent = models.FloatField(null=True, blank=True)
    total_monthly_due = models.FloatField(null=True, blank=True)
    initial_payment = models.FloatField(null=True, blank=True)
    due_date = models.DateField(default=date.today)
    payment_status = models.JSONField(default=dict)  # Store payment status by month
    passcode = models.CharField(max_length=4, unique=True)  # New field for passcode
    boarder_face = models.CharField(max_length=255, null=True, blank=True)
    duedate_updated = models.DateField(null=True, blank=True)  # Dynamically updated due date
    

    def save(self, *args, **kwargs):
        # If passcode is empty, generate a new unique passcode
        if not self.passcode:
            self.passcode = self.generate_unique_passcode()
            #Set the initial duedate_updated to one month after the original due_date
        if not self.duedate_updated:
             self.duedate_updated = self.due_date + relativedelta(months=1)
        super().save(*args, **kwargs)
        

    def generate_unique_passcode(self):
        while True:
            # Generate a random 4-digit passcode
            passcode = str(random.randint(1000, 9999))
            # Ensure the passcode is unique
            if not Tenant.objects.filter(passcode=passcode).exists():
                return passcode


    def __str__(self):
        return f"{self.boarderfirstname} {self.boarderlastname}"
    
    def update_payment_status(self):
        transactions = Transaction.objects.filter(tenant=self)
        status = {}
        
        for transaction in transactions:
            # Get the month name for the transaction month
            month_name = datetime(1, transaction.month_paid_for, 1).strftime('%B')
            
            if transaction.year_paid_for not in status:
                status[transaction.year_paid_for] = {}
            
            # Mark the month as paid
            status[transaction.year_paid_for][month_name] = 'paid'
        
        # Update the payment status JSON field
        self.payment_status = status
        self.save()
        
        # After updating payment status, ensure that due date is moved to the next unpaid month
        self.update_duedate_updated()

    def has_paid_for_month(self, month, year):
        return Transaction.objects.filter(
            tenant=self,
            month_paid_for=month,
            year_paid_for=year
        ).exists()
    
    
    def update_duedate_updated(self):
        """
        Update the duedate_updated to the next month based on payment status.
        """
        # Use the due_date field to calculate the next due date, not the current date.
        current_due_date = self.duedate_updated or (self.due_date + relativedelta(months=1))
        
        # Retain the original day from the due_date
        original_day = self.due_date.day
        
        # Extract the month and year of the current due date
        month = current_due_date.month
        year = current_due_date.year

        # Default next_due_date to the current_due_date
        next_due_date = current_due_date  # Default to the current due date if not updated

        # Check if the payment status for the current month is marked as "paid"
        if self.has_paid_for_month(month, year):
            # If paid, move the due date to the next month
            next_due_date = current_due_date + relativedelta(months=1)
            
            # Ensure the next due date retains the original day
            try:
                next_due_date = next_due_date.replace(day=original_day)
            except ValueError:
                # If the next month doesn't have the original day (e.g., February 30th), set to the last day of the month
                next_due_date = next_due_date + relativedelta(day=31)

        # Update the duedate_updated field
        self.duedate_updated = next_due_date
        self.save()

    
class AddOn(models.Model):
    tenant = models.ForeignKey(Tenant, related_name='add_ons', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.description}: ${self.amount}"


class Guardian(models.Model):
    guardianfirstname = models.CharField(max_length=255)
    guardianmiddlename = models.CharField(max_length=200)
    guardianlastname = models.CharField(max_length=255)
    guardiancontactnumber = models.CharField(max_length=15)
    guardianaddress = models.CharField(max_length=255)
    relationship = models.CharField(max_length=255)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.guardianfirstname} {self.guardianlastname}"
    
class Transaction(models.Model):
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    transaction_date = models.DateField(auto_now_add=True)  # Automatically set to today's date
    transaction_time = models.TimeField(auto_now_add=True)  # Automatically set to the current time
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=100)
    month_paid_for = models.IntegerField(choices=[(i, i) for i in range(1, 13)])  # 1 for January, 12 for December
    year_paid_for = models.IntegerField()
    reference_number = models.CharField(max_length=100, unique=True, blank=True, null=True)
    


    def save(self, *args, **kwargs):
        if not self.reference_number:
            initials = f"{self.tenant.boarderfirstname[0]}{self.tenant.boarderlastname[0]}"
            uuid_part = re.sub(r'[^0-9]', '', str(uuid.uuid4()))[:8]  # Shortened UUID with only numbers
            self.reference_number = f"{initials}{uuid_part}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.tenant.boarderfirstname} - {self.amount_paid} for {self.get_month_paid_for_display()}/{self.year_paid_for}' 
    def has_paid_for_month(self, month, year):
        return self.transactions.filter(month_paid_for=month, year_paid_for=year).exists()


class GcashTransaction(models.Model):
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=10, default='GCash')
    transaction_date = models.DateField()
    transaction_time = models.TimeField()
    reference_number = models.CharField(max_length=100)
    status = models.CharField(max_length=10, default='pending')
    
    def __str__(self):
        return f'{self.tenant} - {self.reference_number}'

class GcashTransactionMonth(models.Model):
    gcash_transaction = models.ForeignKey(GcashTransaction, related_name="months", on_delete=models.CASCADE)
    month_paid_for = models.IntegerField()  # Store the month as an integer (1 for January, 12 for December)
    year_paid_for = models.IntegerField()  # Store the year as an integer
    
    def __str__(self):
        return f'{self.month_paid_for}/{self.year_paid_for} for transaction {self.gcash_transaction.reference_number}'
    
    

class BillRecord(models.Model):
    amount = models.IntegerField()

