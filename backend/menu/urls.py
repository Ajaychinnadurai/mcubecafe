from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('menu/', views.menu_list, name='menu-list'),
    path('menu/seed/', views.seed_menu_data, name='seed-menu-data'),
    path('menu/<int:item_id>/', views.menu_item_detail, name='menu-item-detail'),

    # Admin
    path('admin/menu/', views.admin_menu_list, name='admin-menu-list'),
    path('admin/menu/<int:item_id>/', views.admin_menu_item_detail, name='admin-menu-item-detail'),
    path('admin/menu/categories/', views.admin_category_list, name='admin-category-list'),
    path('admin/menu/categories/<int:category_id>/', views.admin_category_detail, name='admin-category-detail'),
]
