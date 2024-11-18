# signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from .models import Room, BoardingHouse, Tenant, Transaction



@receiver(post_save, sender=Room)
@receiver(post_delete, sender=Room)
def update_boardinghouse_capacity(sender, instance, **kwargs):
    boarding_house = instance.boarding_house
    total_capacity = boarding_house.rooms.aggregate(total_capacity=Sum('capacity'))['total_capacity']
    boarding_house.capacity = total_capacity or 0  # Default to 0 if no rooms
    boarding_house.save()

@receiver(post_save, sender=Tenant)
@receiver(post_delete, sender=Tenant)
def update_boardinghouse_number_of_tenants(sender, instance, **kwargs):
    if instance.assigned_room:
        boarding_house = instance.assigned_room.boarding_house
        total_tenants = boarding_house.rooms.filter(tenant__isnull=False).count()  # Count of tenants in all rooms of the boarding house
        boarding_house.number_of_tenants = total_tenants
        boarding_house.save()


@receiver(post_save, sender=Transaction)
def update_tenant_payment_status(sender, instance, **kwargs):
    tenant = instance.tenant
    tenant.update_payment_status()
    