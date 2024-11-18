from datetime import date
from posts.models import Tenant
from .views import send_sms  # Assuming send_sms is defined in views.py

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

    return "SMS reminders sent successfully"
