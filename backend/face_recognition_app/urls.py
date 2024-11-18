from django.urls import path
from . import views

urlpatterns = [
    path('start-live-feed/', views.start_live_feed, name='start-live-feed'),
    path('reload_faces/', views.reload_faces, name='reload_faces'),
]
