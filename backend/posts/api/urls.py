from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views

from .views import (
    OwnerViewSet, 
    BoardingHouseViewSet, 
    RoomViewSet, 
    TenantViewSet, 
    GuardianViewSet, 
    TransactionViewSet, 
    BillAcceptorView, 
    UltrasonicSensorView, 
    upload_face_image, 
    test_fingerprint_read, 
    check_fingerprint_match,  
    control_relay, 
    DashboardDataViewSet, 
    GcashTransactionViewSet,
    upload_face_tenant,
    face_recognition_view,
    delete_image,
    get_tenant_due,
    confirm_payment,
    gcash_confirm_payment,
    InhibitControlView,
)


router = DefaultRouter()
router.register(r'owner', OwnerViewSet)
router.register(r'boardinghouse', BoardingHouseViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'tenant', TenantViewSet)
router.register(r'guardian', GuardianViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'gcashtransactions', GcashTransactionViewSet, basename='gcashtransaction')


# Add router-generated URLs to urlpatterns
urlpatterns = router.urls

urlpatterns += [
    path('bill-acceptor/', BillAcceptorView.as_view(), name='bill_acceptor'),
    path('sensor/', UltrasonicSensorView.as_view(), name='sensor_data'),
    path('adminfaceimages/', upload_face_image, name='upload_face_image'),
    path('fingerprint_read/', test_fingerprint_read, name='test_fingerprint_read'),
    path('check_fingerprint_match/', check_fingerprint_match, name='check_fingerprint_match'),
    path('control_relay/', control_relay, name='control_relay'),
    path('tenantfaceimages/', upload_face_tenant, name='upload_face_tenant'),
    path('face_recognition/', face_recognition_view, name='face_recognition'),
    path('', include('face_recognition_app.urls')),
    path('textapp/', include('textApp.urls')),
    path('boarder_face_register/', views.boarder_face_register, name='boarder_face_register'),
    path('delete-image/', views.delete_image, name='delete-image'),
    path('send-tenant-sms-reminders/', views.send_tenant_sms_reminders_view, name='send_tenant_sms_reminders'),
    path('tenant/<int:tenant_id>/due/', get_tenant_due, name='get_tenant_due'),
    path('send_due_reminders/', views.tenant_due_reminder, name='send_due_reminders'),
    path('confirm_payment/', confirm_payment, name='confirm_payment'),
    path('gcash_confirm_payment/', gcash_confirm_payment, name='gcash_confirm_payment'),
    path('inhibit-control/', InhibitControlView.as_view(), name='inhibit-control'),
]
