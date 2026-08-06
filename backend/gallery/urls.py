from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('gallery/', views.gallery_images, name='gallery-images'),
    path('testimonials/', views.testimonials, name='testimonials'),
    # Admin
    path('admin/gallery/', views.admin_gallery_images, name='admin-gallery-images'),
    path('admin/gallery/<int:image_id>/', views.admin_gallery_image_delete, name='admin-gallery-image-delete'),
    path('admin/testimonials/', views.admin_testimonials, name='admin-testimonials'),
    path('admin/testimonials/<int:testimonial_id>/', views.admin_testimonial_delete, name='admin-testimonial-delete'),
]
