from django.contrib import admin
from .models import Owner, BoardingHouse, Room, Tenant, Guardian, AddOn, Transaction, GcashTransaction

class AddOnInline(admin.TabularInline):
    model = AddOn
    extra = 1  # Specifies the number of blank forms to display by default

class RoomInline(admin.TabularInline):
    model = Room
    extra = 1 # You can adjust this to change the number of empty forms displayed.


@admin.register(Owner)
class OwnerAdmin(admin.ModelAdmin):
    list_display = ('ownerfirstname', 'ownerlastname', 'owneraddress', 'ownercontact', 'face_image')
    search_fields = ('ownerfirstname', 'ownerlastname', 'owneraddress', 'ownercontact', 'face_image')

@admin.register(BoardingHouse)
class BoardingHouseAdmin(admin.ModelAdmin):
    list_display = ('bhname', 'bhaddress', 'capacity', 'number_of_tenants', 'bhrooms', 'owner')
    search_fields = ('bhname', 'address', 'owner__firstname', 'owner__lastname')
    list_filter = ('capacity', 'number_of_tenants', 'bhrooms')
    inlines = [RoomInline]

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'capacity','boarding_house')
    search_fields = ('room_number', 'capacity')
    list_filter = ('room_number', 'capacity')

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('boarderfirstname', 'boardermiddlename', 'boarderlastname', 'boardergender', 
                    'boarderage', 'boardercourse_profession', 'boarderinstitution', 'boarderaddress', 
                    'boardercontactnumber', 'assigned_room', 'monthly_rent', 'total_monthly_due', 
                    'due_date', 'initial_payment', 'boarder_face')
    search_fields = ('assigned_room', 'boarderfirstname', 'boarderlastname', 'boardergender', 'boardercourse_profession', 'boarderinstitution', 'boarderaddress', 'boardercontactnumber')
    list_filter = ('assigned_room', 'boardergender', 'boarderage', 'boardercourse_profession', 'boarderinstitution')
    inlines = [AddOnInline]  # Include the add-on inline

@admin.register(Guardian)
class GuardianAdmin(admin.ModelAdmin):
    list_display = ('guardianfirstname', 'guardianmiddlename' ,'guardianlastname', 'guardiancontactnumber', 'guardianaddress', 'relationship', 'tenant')
    search_fields = ('guardianfirstname', 'guardianlastname', 'guardiancontactnumber', 'guardianaddress', 'relationship', 'tenant__boarderfirstname', 'tenant__boarderlastname')
    list_filter = ('guardianfirstname', 'tenant__boarderfirstname')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'id', 'transaction_date', 'transaction_time', 'amount_paid','month_paid_for', 'year_paid_for', 'payment_method', 'reference_number')
    list_filter = ('tenant__boarderfirstname', 'tenant__boarderlastname','payment_method', 'transaction_date')
    search_fields = ('tenant__boarderfirstname', 'tenant__boarderlastname', 'payment_method', 'reference_number')
    date_hierarchy = 'transaction_date'

@admin.register(GcashTransaction)
class GcashTransactionAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'id', 'transaction_date', 'transaction_time', 'amount_paid' , 'payment_method', 'reference_number')
    list_filter = ('tenant__boarderfirstname', 'tenant__boarderlastname','payment_method', 'transaction_date')
    search_fields = ('tenant__boarderfirstname', 'tenant__boarderlastname','payment_method', 'reference_number')
    date_hierarchy = 'transaction_date'

