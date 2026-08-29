from rest_framework import serializers
from .models import MenuCategory, MenuItem


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = ['id', 'category', 'category_name', 'name', 'description',
                  'price', 'image', 'image_url', 'is_bestseller', 'is_veg', 'is_available']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class MenuCategorySerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = MenuCategory
        fields = ['id', 'name', 'slug', 'order', 'items', 'is_active']

    def get_items(self, obj):
        # Public menu only shows available items. Use prefetched cache if available.
        if hasattr(obj, '_prefetched_objects_cache') and 'items' in obj._prefetched_objects_cache:
            items = [item for item in obj.items.all() if item.is_available]
        else:
            items = obj.items.filter(is_available=True).order_by('-is_bestseller', 'name')
        return MenuItemSerializer(items, many=True, context=self.context).data


class MenuItemAdminSerializer(serializers.ModelSerializer):
    """Admin serializer that allows writes on all fields."""

    class Meta:
        model = MenuItem
        fields = ['id', 'category', 'name', 'description', 'price',
                  'image', 'is_bestseller', 'is_veg', 'is_available']

    def create(self, validated_data):
        return MenuItem.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class MenuCategoryAdminSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = MenuCategory
        fields = ['id', 'name', 'slug', 'order', 'is_active', 'item_count']

    def get_item_count(self, obj):
        return obj.items.count()
