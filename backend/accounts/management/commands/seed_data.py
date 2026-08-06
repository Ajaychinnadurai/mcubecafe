from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from menu.models import MenuCategory, MenuItem
from gallery.models import GalleryImage, Testimonial

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with real Mcubes Cafe menu data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database with Mcubes Cafe menu...')

        # Create admin user
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@mcubes.com',
                password='admin123!',
                role='admin',
                phone_number='+919999999999',
                whatsapp_number='+919999999999',
            )
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin.username} / admin123!'))

        # Create sample customer
        if not User.objects.filter(username='vishal').exists():
            customer = User.objects.create_user(
                username='vishal',
                email='vishal@example.com',
                password='customer123!',
                phone_number='+918888888888',
                whatsapp_number='+918888888888',
                role='customer',
            )
            self.stdout.write(self.style.SUCCESS(f'Created customer: {customer.username} / customer123!'))

        # Clear old menu data and recreate
        self.stdout.write('  Clearing old menu data...')
        MenuItem.objects.all().delete()
        MenuCategory.objects.all().delete()

        # ============================================================
        # REAL MCUBES CAFE MENU — 18 Categories, ~151 Items
        # ============================================================
        categories_data = [
            {'name': 'Mojito', 'slug': 'mojito', 'order': 1},
            {'name': 'Fresh Juice', 'slug': 'fresh-juice', 'order': 2},
            {'name': 'Shakes', 'slug': 'shakes', 'order': 3},
            {'name': 'Lassi', 'slug': 'lassi', 'order': 4},
            {'name': 'Ice Cream', 'slug': 'ice-cream', 'order': 5},
            {'name': 'Special Drinks', 'slug': 'special-drinks', 'order': 6},
            {'name': 'Falooda', 'slug': 'falooda', 'order': 7},
            {'name': 'Soda', 'slug': 'soda', 'order': 8},
            {'name': 'Chats', 'slug': 'chats', 'order': 9},
            {'name': 'Maggi', 'slug': 'maggi', 'order': 10},
            {'name': 'Rice', 'slug': 'rice', 'order': 11},
            {'name': 'Momos', 'slug': 'momos', 'order': 12},
            {'name': 'Hot Beverages', 'slug': 'hot-beverages', 'order': 13},
            {'name': 'Burger', 'slug': 'burger', 'order': 14},
            {'name': 'Noodles', 'slug': 'noodles', 'order': 15},
            {'name': 'Sandwich', 'slug': 'sandwich', 'order': 16},
            {'name': 'Tasty Bites', 'slug': 'tasty-bites', 'order': 17},
            {'name': 'Snacks', 'slug': 'snacks', 'order': 18},
        ]

        categories = {}
        for cat_data in categories_data:
            cat = MenuCategory.objects.create(**cat_data)
            categories[cat.slug] = cat
            self.stdout.write(f'  Created category: {cat.name}')

        # --- Mojito (11 items) ---
        mojito_items = [
            {'name': 'Virgin Mojito', 'price': 49, 'is_bestseller': True},
            {'name': 'Blue Curacao', 'price': 59},
            {'name': 'Grape Mojito', 'price': 59},
            {'name': 'Rose Mojito', 'price': 59},
            {'name': 'Strawberry Mojito', 'price': 59},
            {'name': 'Mint Mojito', 'price': 59},
            {'name': 'Black Current', 'price': 69},
            {'name': 'Raspberry', 'price': 69},
            {'name': 'Ginger', 'price': 59},
            {'name': 'Mango Mojito', 'price': 69},
            {'name': 'Chilly Mojito', 'price': 69},
        ]

        # --- Fresh Juice (16 items) ---
        juice_items = [
            {'name': 'Lemon Juice', 'price': 30},
            {'name': 'Watermelon Juice', 'price': 40},
            {'name': 'Muskmelon Juice (Seasonal)', 'price': 40},
            {'name': 'Mint Lime', 'price': 40},
            {'name': 'Grapes (Seasonal)', 'price': 50},
            {'name': 'Orange Juice', 'price': 60},
            {'name': 'Mosambi Juice', 'price': 60},
            {'name': 'Pineapple Juice', 'price': 60},
            {'name': 'Apple Juice', 'price': 80},
            {'name': 'Pomegranate Juice', 'price': 80},
            {'name': 'Mango Juice (Seasonal)', 'price': 80},
            {'name': 'Watermelon Mint', 'price': 50},
            {'name': 'Lime Ginger', 'price': 60},
            {'name': 'Lime Watermelon', 'price': 50},
            {'name': 'Ginger Watermelon', 'price': 50},
            {'name': 'Lime Pineapple', 'price': 70},
        ]

        # --- Shakes (9 items) ---
        shakes_items = [
            {'name': 'Vanilla Milkshake', 'price': 79},
            {'name': 'Mango Milkshake', 'price': 99, 'is_bestseller': True},
            {'name': 'Strawberry Milkshake', 'price': 89},
            {'name': 'Oreo Milkshake', 'price': 99, 'is_bestseller': True},
            {'name': 'Kit-Kat Milkshake', 'price': 109},
            {'name': 'Pista Milkshake', 'price': 119},
            {'name': 'Chocolate Milkshake', 'price': 119},
            {'name': 'Butterscotch Milkshake', 'price': 129},
            {'name': 'Black Current Milkshake', 'price': 139},
        ]

        # --- Lassi (10 items) ---
        lassi_items = [
            {'name': 'Classic Lassi', 'price': 49, 'is_bestseller': True},
            {'name': 'Mango Lassi', 'price': 59},
            {'name': 'Chocolate Lassi', 'price': 69},
            {'name': 'Vanilla Lassi', 'price': 65},
            {'name': 'Strawberry Lassi', 'price': 65},
            {'name': 'Butterscotch Lassi', 'price': 69},
            {'name': 'Pista Lassi', 'price': 79},
            {'name': 'Badham Lassi', 'price': 89},
            {'name': 'Black Current Lassi', 'price': 69},
            {'name': "MCube's Special Lassi", 'price': 99, 'is_bestseller': True},
        ]

        # --- Ice Cream (7 items) ---
        icecream_items = [
            {'name': 'Vanilla Ice Cream', 'price': 40},
            {'name': 'Strawberry Ice Cream', 'price': 50},
            {'name': 'Mango Ice Cream', 'price': 60},
            {'name': 'Butterscotch Ice Cream', 'price': 60},
            {'name': 'Chocolate Ice Cream', 'price': 70},
            {'name': 'Pista Ice Cream', 'price': 80},
            {'name': 'Black Current Ice Cream', 'price': 80},
        ]

        # --- Special Drinks (5 items) ---
        special_items = [
            {'name': 'Badam Milk', 'price': 50, 'is_bestseller': True},
            {'name': 'Rose Milk', 'price': 50},
            {'name': 'Cold Boost', 'price': 60},
            {'name': 'Cold Horlicks', 'price': 60},
            {'name': 'Cold Coffee', 'price': 80, 'is_bestseller': True},
        ]

        # --- Falooda (5 items) ---
        falooda_items = [
            {'name': 'Royal Falooda', 'price': 179, 'is_bestseller': True},
            {'name': 'Rose Falooda', 'price': 159},
            {'name': "Luxe Falooda (MCube's Special)", 'price': 199, 'is_bestseller': True},
            {'name': 'Chocolate Falooda', 'price': 159},
            {'name': 'Classic Falooda', 'price': 139},
        ]

        # --- Soda (2 items) ---
        soda_items = [
            {'name': 'Lemon Soda (Sweet / Salt / Sweet & Salt)', 'price': 40},
            {'name': 'Lemon Mint (Sweet / Salt / Sweet & Salt)', 'price': 50},
        ]

        # --- Chats (11 items) ---
        chats_items = [
            {'name': 'Paani Poori', 'price': 30, 'is_bestseller': True},
            {'name': 'Bhel Poori', 'price': 40},
            {'name': 'Masala Poori', 'price': 40},
            {'name': 'Egg Bhel Poori', 'price': 60},
            {'name': 'Samosa Chat', 'price': 60},
            {'name': 'Kaalan', 'price': 60},
            {'name': 'Mushroom Chilli', 'price': 60},
            {'name': 'Cauliflower Chilli', 'price': 60},
            {'name': 'Dahi Poori', 'price': 50},
            {'name': 'Egg Kalan', 'price': 75},
            {'name': 'Padi Chat', 'price': 50},
        ]

        # --- Maggi (7 items) ---
        maggi_items = [
            {'name': 'Plain Maggi', 'price': 39},
            {'name': 'Masala Maggi', 'price': 49},
            {'name': 'Egg Maggi', 'price': 59},
            {'name': 'Cheese Maggi', 'price': 69},
            {'name': 'Egg & Cheese Maggi', 'price': 89},
            {'name': 'Chicken Maggi', 'price': 89, 'is_bestseller': True},
            {'name': 'Chicken Cheese Maggi', 'price': 109, 'is_bestseller': True},
        ]

        # --- Rice (5 items) ---
        rice_items = [
            {'name': 'Veg Rice', 'price': 70},
            {'name': 'Egg Rice', 'price': 80},
            {'name': 'Gobi Rice', 'price': 90},
            {'name': 'Mushroom Rice', 'price': 90},
            {'name': 'Chicken Rice', 'price': 100, 'is_bestseller': True},
        ]

        # --- Momos (6 items) ---
        momos_items = [
            {'name': 'Chicken Momos', 'price': 80, 'is_bestseller': True},
            {'name': 'Chicken Peri Peri Momos', 'price': 90, 'is_bestseller': True},
            {'name': 'Paneer Momos', 'price': 95},
            {'name': 'Veg Momos', 'price': 65},
            {'name': 'Corn & Cheese Momos', 'price': 100},
            {'name': 'Steamed Momos (Extra)', 'price': 15, 'description': 'Additional steamed momos on top'},
        ]

        # --- Hot Beverages (16 items) ---
        hot_items = [
            {'name': 'Black Tea', 'price': 10, 'is_bestseller': True},
            {'name': 'Tea', 'price': 15},
            {'name': 'Rajasthani Ginger Tea', 'price': 20},
            {'name': 'Brown Sugar Tea', 'price': 18},
            {'name': 'Lemon Tea', 'price': 15},
            {'name': 'Sukku Milk', 'price': 20},
            {'name': 'Milk', 'price': 15},
            {'name': 'Brown Sugar Milk', 'price': 20},
            {'name': 'Black Coffee', 'price': 15},
            {'name': 'Coffee', 'price': 25},
            {'name': 'Brown Sugar Coffee', 'price': 25},
            {'name': 'Boost', 'price': 25},
            {'name': 'Horlicks', 'price': 25},
            {'name': 'Hot Badam Milk', 'price': 25},
            {'name': 'Varasukku', 'price': 15},
            {'name': 'Masala Tea', 'price': 25},
        ]

        # --- Burger (6 items) ---
        burger_items = [
            {'name': 'Veg Burger', 'price': 69},
            {'name': 'Veg Cheese Burger', 'price': 89},
            {'name': 'Paneer Burger', 'price': 99},
            {'name': 'Paneer Cheese Burger', 'price': 119},
            {'name': 'Chicken Burger', 'price': 89, 'is_bestseller': True},
            {'name': 'Chicken Cheese Burger', 'price': 109, 'is_bestseller': True},
        ]

        # --- Noodles (5 items) ---
        noodles_items = [
            {'name': 'Veg Noodles', 'price': 70},
            {'name': 'Egg Noodles', 'price': 80},
            {'name': 'Gobi Noodles', 'price': 90},
            {'name': 'Mushroom Noodles', 'price': 90},
            {'name': 'Chicken Noodles', 'price': 100, 'is_bestseller': True},
        ]

        # --- Sandwich (10 items) ---
        sandwich_items = [
            {'name': 'Veg Sandwich', 'price': 69},
            {'name': 'Veg Cheese Sandwich', 'price': 89},
            {'name': 'Egg Sandwich', 'price': 79},
            {'name': 'Egg Cheese Sandwich', 'price': 99},
            {'name': 'Paneer Sandwich', 'price': 119},
            {'name': 'Paneer Cheese Sandwich', 'price': 139},
            {'name': 'Mushroom Sandwich', 'price': 89},
            {'name': 'Mushroom Cheese Sandwich', 'price': 109},
            {'name': 'Chicken Sandwich', 'price': 99, 'is_bestseller': True},
            {'name': 'Chicken Cheese Sandwich', 'price': 119, 'is_bestseller': True},
        ]

        # --- Tasty Bites (7 items) ---
        bites_items = [
            {'name': 'Bread Omelette', 'price': 50},
            {'name': 'Cheese Bread Omelette', 'price': 90},
            {'name': 'Chicken Bread Omelette', 'price': 120},
            {'name': 'French Fries', 'price': 60, 'is_bestseller': True},
            {'name': 'Peri-Peri Masala Fries', 'price': 70, 'is_bestseller': True},
            {'name': 'Chicken Nuggets (5 pcs)', 'price': 70},
            {'name': 'Smily Fries (6 pcs)', 'price': 80},
        ]

        # --- Snacks (7 items) ---
        snacks_items = [
            {'name': 'Aaloo Samosa', 'price': 15, 'is_bestseller': True},
            {'name': 'Veg Puff', 'price': 20},
            {'name': 'Mushroom Puff', 'price': 22},
            {'name': 'Egg Puff', 'price': 25},
            {'name': 'Chicken Puff', 'price': 35},
            {'name': 'Salt Biscuits', 'price': 60},
            {'name': 'Onion Samosa', 'price': 10},
        ]

        # Map category slugs to their item lists
        menu_by_category = {
            'mojito': mojito_items,
            'fresh-juice': juice_items,
            'shakes': shakes_items,
            'lassi': lassi_items,
            'ice-cream': icecream_items,
            'special-drinks': special_items,
            'falooda': falooda_items,
            'soda': soda_items,
            'chats': chats_items,
            'maggi': maggi_items,
            'rice': rice_items,
            'momos': momos_items,
            'hot-beverages': hot_items,
            'burger': burger_items,
            'noodles': noodles_items,
            'sandwich': sandwich_items,
            'tasty-bites': bites_items,
            'snacks': snacks_items,
        }

        total_items = 0
        for slug, items in menu_by_category.items():
            cat = categories[slug]
            for item_data in items:
                description = item_data.pop('description', f'Delicious {item_data["name"]} at Mcubes Cafe')
                is_bestseller = item_data.pop('is_bestseller', False)
                MenuItem.objects.create(
                    category=cat,
                    name=item_data['name'],
                    description=description,
                    price=item_data['price'],
                    is_bestseller=is_bestseller,
                    is_available=True,
                )
                total_items += 1

        self.stdout.write(self.style.SUCCESS(f'  Created {total_items} menu items across {len(categories_data)} categories!'))

        # Create testimonials
        testimonials_data = [
            {'customer_name': 'Priya K.', 'content': 'Best filter coffee near the university! The cozy vibe and student-friendly prices keep me coming back every week.', 'rating': 5},
            {'customer_name': 'Arun M.', 'content': 'The Oreo shake and grilled sandwich combo is unbeatable. Perfect hangout spot for friends!', 'rating': 5},
            {'customer_name': 'Sneha R.', 'content': 'Love the ambiance and the music. Their chocolate brownie with ice cream is a must-try!', 'rating': 4},
            {'customer_name': 'Karthik S.', 'content': 'Great place to study or catch up with friends. The cold brew is excellent and the staff is super friendly.', 'rating': 5},
        ]

        for t in testimonials_data:
            testimonial, created = Testimonial.objects.get_or_create(
                customer_name=t['customer_name'],
                defaults=t
            )
            if created:
                self.stdout.write(f'  Created testimonial from: {t["customer_name"]}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('[OK] Database seeded successfully with real Mcubes Cafe menu!'))
        self.stdout.write('')
        self.stdout.write(f'  [STATS] {total_items} menu items across {len(categories_data)} categories')
        self.stdout.write('  [USER] Admin:     admin / admin123!')
        self.stdout.write('  [USER] Customer:  vishal / customer123!')
        self.stdout.write('  [WEB] Menu:      http://localhost:5173/menu')
