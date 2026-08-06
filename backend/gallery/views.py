from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import GalleryImage, Testimonial
from .serializers import GalleryImageSerializer, TestimonialSerializer
from accounts.permissions import IsAdminRole


@api_view(['GET'])
@permission_classes([AllowAny])
def gallery_images(request):
    images = GalleryImage.objects.filter(is_active=True)
    serializer = GalleryImageSerializer(images, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def testimonials(request):
    testimonials = Testimonial.objects.filter(is_active=True)
    serializer = TestimonialSerializer(testimonials, many=True)
    return Response(serializer.data)


# ====== ADMIN GALLERY ENDPOINTS ======


@api_view(['GET', 'POST'])
@permission_classes([IsAdminRole])
def admin_gallery_images(request):
    """Admin: list all gallery images or upload a new one."""
    if request.method == 'GET':
        images = GalleryImage.objects.all().order_by('order')
        serializer = GalleryImageSerializer(images, many=True, context={'request': request})
        return Response(serializer.data)

    # POST: upload new image
    data = request.data.copy()
    if not data.get('order'):
        from django.db.models import Max
        last_order = GalleryImage.objects.aggregate(m=Max('order'))['m'] or 0
        data['order'] = last_order + 1

    serializer = GalleryImageSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdminRole])
def admin_gallery_image_delete(request, image_id):
    """Admin: delete a gallery image."""
    image = get_object_or_404(GalleryImage, id=image_id)
    image.delete()
    return Response({'message': 'Image deleted.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminRole])
def admin_testimonials(request):
    """Admin: list all testimonials or create a new one."""
    if request.method == 'GET':
        testimonials = Testimonial.objects.all()
        serializer = TestimonialSerializer(testimonials, many=True)
        return Response(serializer.data)

    serializer = TestimonialSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdminRole])
def admin_testimonial_delete(request, testimonial_id):
    """Admin: delete a testimonial."""
    testimonial = get_object_or_404(Testimonial, id=testimonial_id)
    testimonial.delete()
    return Response({'message': 'Testimonial deleted.'}, status=status.HTTP_204_NO_CONTENT)
