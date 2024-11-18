
# textApp/urls.py

from django.urls import path
from .views import send_sms_to_owners, send_welcome_sms, send_tenant_sms_reminders

urlpatterns = [
    path('send_sms_to_owners/', send_sms_to_owners, name='send_sms_to_owners'),
    path('send_sms/<int:tenant_id>/', send_welcome_sms, name='send_welcome_sms'),
    path('send-tenant-sms-reminders/', send_tenant_sms_reminders, name='send_tenant_sms_reminders'),
]
