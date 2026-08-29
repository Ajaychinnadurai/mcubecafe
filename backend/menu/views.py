from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import MenuCategory, MenuItem
from .serializers import (
    MenuCategorySerializer, MenuItemSerializer,
    MenuItemAdminSerializer, MenuCategoryAdminSerializer,
)
from accounts.permissions import IsAdminRole


from django.db.models import Prefetch


@api_view(['GET'])
@permission_classes([AllowAny])
def menu_list(request):
    """Public endpoint: return all active categories with their available items (top selling first)."""
    if not MenuCategory.objects.exists():
        try:
            from django.core.management import call_command
            call_command('seed_data')
        except Exception as e:
            print("Auto-seed error:", e)

    categories = MenuCategory.objects.filter(is_active=True).prefetch_related(
        Prefetch('items', queryset=MenuItem.objects.filter(is_available=True).order_by('-is_bestseller', 'name'))
    )
    serializer = MenuCategorySerializer(categories, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def menu_item_detail(request, item_id):
    """Public endpoint: return a single menu item."""
    item = get_object_or_404(MenuItem, id=item_id, is_available=True)
    serializer = MenuItemSerializer(item, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminRole])
def admin_menu_list(request):
    """Admin-only: list all items or create a new one."""
    if request.method == 'GET':
        items = MenuItem.objects.all().order_by('category__order', 'name')
        serializer = MenuItemSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)

    serializer = MenuItemAdminSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAdminRole])
def admin_menu_item_detail(request, item_id):
    """Admin-only: get, update, or delete a menu item."""
    item = get_object_or_404(MenuItem, id=item_id)

    if request.method == 'GET':
        serializer = MenuItemSerializer(item, context={'request': request})
        return Response(serializer.data)

    if request.method == 'PATCH':
        serializer = MenuItemAdminSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        item.delete()
        return Response({'message': 'Item deleted.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminRole])
def admin_category_list(request):
    """Admin-only: list or create categories."""
    if request.method == 'GET':
        categories = MenuCategory.objects.all()
        serializer = MenuCategoryAdminSerializer(categories, many=True)
        return Response(serializer.data)

    serializer = MenuCategoryAdminSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAdminRole])
def admin_category_detail(request, category_id):
    """Admin-only: update (e.g. toggle active) or delete a category."""
    category = get_object_or_404(MenuCategory, id=category_id)

    if request.method == 'GET':
        return Response(MenuCategoryAdminSerializer(category).data)

    if request.method == 'PATCH':
        serializer = MenuCategoryAdminSerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE — cascade removes the category's menu items
    category.delete()
    return Response({'message': 'Category deleted.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def seed_menu_data(request):
    """Public helper to seed menu data on deployed server if empty."""
    from django.core.management import call_command
    try:
        call_command('seed_data')
        cat_count = MenuCategory.objects.count()
        item_count = MenuItem.objects.count()
        return Response({
            'message': 'Database seeded successfully with Mcubes Cafe menu!',
            'categories': cat_count,
            'items': item_count
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)
