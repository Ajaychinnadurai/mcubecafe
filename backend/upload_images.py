"""Upload downloaded images to menu items and gallery via API."""
import requests
import os
import mimetypes

BASE = 'http://localhost:8000/api'
MEDIA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'media')

print(f'Media path: {MEDIA_DIR}')
print(f'Media dir exists: {os.path.isdir(MEDIA_DIR)}')

# Login as admin
s = requests.Session()
login_resp = s.post(f'{BASE}/auth/login/', json={
    'email': 'admin@mcubes.com',
    'password': 'admin123!'
}, headers={'Content-Type': 'application/json'})
print(f'Login status: {login_resp.status_code}')

# Extract token from cookie and set as Bearer header
access_token = s.cookies.get('access_token')
if access_token:
    s.headers.update({'Authorization': f'Bearer {access_token}'})
    print(f'Got access token (length: {len(access_token)})')
else:
    print('No access token in cookies, trying response data...')

# Get all menu items
menu_resp = s.get(f'{BASE}/admin/menu/')
print(f'Menu response: {menu_resp.status_code}')
if menu_resp.ok:
    items = menu_resp.json()
    print(f'Menu items count: {len(items)}')
else:
    print(f'Failed to get menu: {menu_resp.text[:200]}')
    items = []

if items:
    # Print first few items to verify
    for it in items[:3]:
        print(f'  Item: {it["name"]} (ID: {it["id"]})')

    # Map images to item names (fuzzy match)
    image_map = {
        'mojito.jpg': 'Virgin Mojito',
        'coffee.jpg': 'Cold Coffee',
        'burger.jpg': 'Chicken Burger',
        'fries.jpg': 'French Fries',
        'icecream.jpg': 'Chocolate Ice Cream',
        'sandwich.jpg': 'Chicken Sandwich',
    }

    menu_dir = os.path.join(MEDIA_DIR, 'menu')
    for filename, item_name in image_map.items():
        filepath = os.path.join(menu_dir, filename)
        if not os.path.exists(filepath):
            print(f'  SKIP {filename} - file not found at {filepath}')
            continue

        # Find matching item
        matches = [it for it in items if item_name.lower() in it['name'].lower()]
        if not matches:
            print(f'  SKIP {filename} - no item matching "{item_name}"')
            continue

        item = matches[0]
        print(f'  Uploading {filename} to "{item["name"]}" (ID: {item["id"]})...')

        with open(filepath, 'rb') as f:
            mime_type = mimetypes.guess_type(filepath)[0] or 'image/jpeg'
            resp = s.patch(
                f'{BASE}/admin/menu/{item["id"]}/',
                files={'image': (filename, f, mime_type)}
            )

        if resp.status_code == 200:
            print(f'    [OK] Uploaded!')
        else:
            print(f'    [FAIL] Status {resp.status_code}: {resp.text[:150]}')

    # Upload gallery images
    gallery_images = [
        ('cafe-interior.jpg', 'Cozy cafe interior with warm lighting'),
        ('snacks-platter.jpg', 'Fresh snacks and bites platter'),
        ('dessert.jpg', 'Delicious dessert specials'),
        ('milkshake.jpg', 'Refreshing milkshakes'),
        ('outdoor-seating.jpg', 'Outdoor seating area'),
    ]

    gallery_dir = os.path.join(MEDIA_DIR, 'gallery')
    print('\n--- Uploading Gallery Images ---')
    for filename, caption in gallery_images:
        filepath = os.path.join(gallery_dir, filename)
        if not os.path.exists(filepath):
            print(f'  SKIP {filename} - file not found at {filepath}')
            continue

        filesize = os.path.getsize(filepath)
        if filesize < 100:  # Too small - broken download
            print(f'  SKIP {filename} - too small ({filesize} bytes)')
            continue

        print(f'  Uploading {filename} ({filesize} bytes)...')
        with open(filepath, 'rb') as f:
            mime_type = mimetypes.guess_type(filepath)[0] or 'image/jpeg'
            resp = s.post(
                f'{BASE}/admin/gallery/',
                data={'caption': caption},
                files={'image': (filename, f, mime_type)}
            )

        if resp.status_code == 201:
            print(f'    [OK] Uploaded as gallery image!')
        else:
            print(f'    [FAIL] Status {resp.status_code}: {resp.text[:150]}')

print('\n[OK] Done!')
