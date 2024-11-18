from rest_framework import serializers
from ..models import Owner, BoardingHouse, Room, Tenant, Guardian, AddOn, Transaction, GcashTransaction, GcashTransactionMonth
from datetime import datetime
import base64

class OwnerSerializer(serializers.ModelSerializer):
    fingerprint = serializers.CharField(required=False, allow_blank=True)
    face_image = serializers.CharField(write_only=True)
    def create(self, validated_data):
        # Decode the Base64 encoded fingerprint only, since face_image is a path now
        if 'fingerprint' in validated_data:
            validated_data['fingerprint'] = base64.b64decode(validated_data['fingerprint'])
        
        # face_image is already a path, so no need to decode it
        return super().create(validated_data)
    
    class Meta: 
        model = Owner
        fields = ['id', 'ownerfirstname', 'ownerlastname', 'owneraddress', 'ownercontact', 'fingerprint', 'face_image']

class RoomSerializer(serializers.ModelSerializer):
    is_full = serializers.BooleanField(read_only=True)  # Simply use read_only=True

    class Meta:
        model = Room
        fields = ['id', 'room_number', 'capacity', 'boarding_house', 'is_full']

class BoardingHouseSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(queryset=Owner.objects.all())
    rooms = RoomSerializer(many=True, read_only=True)  # Ensure you have a related_name='rooms' in your Room model

    class Meta:
        model = BoardingHouse
        fields = ['id', 'bhname', 'bhaddress', 'capacity', 'number_of_tenants', 'bhrooms', 'owner', 'rooms']
    

class AddOnSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddOn
        fields = ['id', 'description', 'amount']

class TenantSerializer(serializers.ModelSerializer):
    add_ons = AddOnSerializer(many=True, required=False)
    owner = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = ['id', 'boarderfirstname', 'boardermiddlename', 'boarderlastname', 'boardergender', 
                  'boarderage', 'boardercourse_profession', 'boarderinstitution', 'boarderaddress', 
                  'boardercontactnumber', 'assigned_room', 'monthly_rent', 'total_monthly_due',
                    'due_date', 'initial_payment', 'add_ons','payment_status', 'passcode', 'boarder_face', 'duedate_updated','owner']
        read_only_fields = ['passcode']  # Make passcode read-only
    
    def get_owner(self, obj):
        """
        Get the owner information via the related assigned_room -> boarding_house -> owner relationship.
        """
        if obj.assigned_room and obj.assigned_room.boarding_house and obj.assigned_room.boarding_house.owner:
            owner = obj.assigned_room.boarding_house.owner
            return OwnerSerializer(owner).data
        return None  # Return None if no owner is assigned
    
    def create(self, validated_data):
        add_ons_data = validated_data.pop('add_ons', [])
        tenant = Tenant.objects.create(**validated_data)
        for add_on_data in add_ons_data:
            AddOn.objects.create(tenant=tenant, **add_on_data)
        return tenant

    def update(self, instance, validated_data):
        add_ons_data = validated_data.pop('add_ons', [])
        instance = super(TenantSerializer, self).update(instance, validated_data)

        # Retrieve existing add-ons for the tenant
        existing_add_ons = {add_on.id: add_on for add_on in instance.add_ons.all()}

        # Track IDs of add-ons that were processed
        processed_add_on_ids = set()

        # Update existing add-ons or create new ones
        for add_on_data in add_ons_data:
            add_on_id = add_on_data.get('id', None)
            if add_on_id:
                # Existing add-on: Update it
                if add_on_id in existing_add_ons:
                    add_on_instance = existing_add_ons[add_on_id]
                    add_on_instance.description = add_on_data.get('description', add_on_instance.description)
                    add_on_instance.amount = add_on_data.get('amount', add_on_instance.amount)
                    add_on_instance.save()
                    processed_add_on_ids.add(add_on_id)
                else:
                    # ID does not exist, so create new add-on
                    AddOn.objects.create(tenant=instance, **add_on_data)
            else:
                # No ID provided, so create new add-on
                AddOn.objects.create(tenant=instance, **add_on_data)

        # Optionally delete add-ons that are not present in the updated data
        for add_on_id, add_on_instance in existing_add_ons.items():
            if add_on_id not in processed_add_on_ids:
                add_on_instance.delete()

        return instance
        
class GuardianSerializer(serializers.ModelSerializer):
    tenant = serializers.PrimaryKeyRelatedField(queryset=Tenant.objects.all())
    class Meta:
        model = Guardian
        fields = ['id', 'guardianfirstname','guardianmiddlename', 'guardianlastname', 'guardiancontactnumber', 'guardianaddress', 'relationship', 'tenant']

class TransactionSerializer(serializers.ModelSerializer):
    transaction_date = serializers.DateField(format='%d-%m-%Y')
    transaction_time = serializers.TimeField(format='%H:%M:%S')
    
    class Meta:
        model = Transaction
        fields = ['id', 'tenant', 'transaction_date', 'transaction_time', 'amount_paid', 'payment_method', 'month_paid_for', 'year_paid_for', 'reference_number']

    def validate(self, data):
        # Ensure amount_paid is a positive number
        if data.get('amount_paid') <= 0:
            raise serializers.ValidationError("Amount paid must be greater than zero.")

        # Ensure unique reference_number
        if Transaction.objects.filter(reference_number=data.get('reference_number')).exists():
            raise serializers.ValidationError("A transaction with this reference number already exists.")
        
        return data

    def validate_month_paid_for(self, value):
        # Ensure month_paid_for is valid (1-12)
        if value < 1 or value > 12:
            raise serializers.ValidationError("Month must be between 1 and 12.")
        return value

    def validate_year_paid_for(self, value):
        # Ensure year_paid_for is a valid year (e.g., greater than or equal to current year)
        if value < datetime.now().year:
            raise serializers.ValidationError("Year cannot be in the past.")
        return value


# Serializer for Gcash Transactions
from rest_framework import serializers

class GcashTransactionMonthSerializer(serializers.ModelSerializer):
    class Meta:
        model = GcashTransactionMonth
        fields = ['month_paid_for', 'year_paid_for']

class GcashTransactionSerializer(serializers.ModelSerializer):
    months = GcashTransactionMonthSerializer(many=True)

    class Meta:
        model = GcashTransaction
        fields = ['id', 'tenant', 'amount_paid', 'payment_method', 'transaction_date', 'transaction_time', 'reference_number', 'status', 'months']

    def create(self, validated_data):
        months_data = validated_data.pop('months')
        gcash_transaction = GcashTransaction.objects.create(**validated_data)
        
        for month_data in months_data:
            GcashTransactionMonth.objects.create(gcash_transaction=gcash_transaction, **month_data)

        return gcash_transaction

class ConfirmTransactionSerializer(serializers.Serializer):
    reference_number = serializers.CharField(max_length=100)
    selected_months = serializers.ListField(child=serializers.DictField())
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)

