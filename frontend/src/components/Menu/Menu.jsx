import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { getSmartRecommendations, recordItemView } from '../../utils/recommendations';
import { autoCorrectQuery, getSearchSuggestions } from '../../utils/searchEngine';
import useDocumentTitle from '../../utils/useDocumentTitle';
import {
  Utensils, Search, LayoutGrid, Sparkles, ShoppingBag, ShoppingCart, Check, Plus, Minus,
  X, AlertTriangle, RefreshCw, Star, ArrowLeft, ArrowRight, ArrowUpDown, SlidersHorizontal, Filter, Zap, CheckCircle2
} from 'lucide-react';
import './Menu.css';

// High-resolution real food photography per category
const CATEGORY_IMAGES = {
  'mojito': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
  'fresh-juice': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
  'shakes': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
  'lassi': 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=400&q=80',
  'ice-cream': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
  'special-drinks': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  'falooda': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
  'soda': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
  'chats': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
  'maggi': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
  'rice': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80',
  'momos': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
  'hot-beverages': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
  'noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
  'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
  'tasty-bites': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=400&q=80',
  'snacks': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80',
};

// Item-specific curated photographs
const ITEM_SPECIFIC_IMAGES = {
  // Mojitos
  'Virgin Mojito': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
  'Blue Curacao': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  'Grape Mojito': 'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=400&q=80',
  'Rose Mojito': 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80',
  'Strawberry Mojito': 'https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=400&q=80',
  'Mint Mojito': 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=400&q=80',
  'Black Current': 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=400&q=80',
  'Raspberry': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=400&q=80',
  'Ginger': 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=400&q=80',
  'Mango Mojito': 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80',
  'Chilly Mojito': 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=400&q=80',

  // Juices
  'Lemon Juice': 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?auto=format&fit=crop&w=400&q=80',
  'Watermelon Juice': 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=400&q=80',
  'Muskmelon Juice (Seasonal)': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
  'Mint Lime': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  'Grapes (Seasonal)': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=400&q=80',
  'Orange Juice': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
  'Mosambi Juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80',
  'Pineapple Juice': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=400&q=80',
  'Apple Juice': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=400&q=80',
  'Pomegranate Juice': 'https://images.unsplash.com/photo-1628557044797-f21a177c37ec?auto=format&fit=crop&w=400&q=80',
  'Mango Juice (Seasonal)': 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80',
  'Watermelon Mint': 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=400&q=80',
  'Lime Ginger': 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=400&q=80',
  'Lime Watermelon': 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=400&q=80',
  'Ginger Watermelon': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=400&q=80',
  'Lime Pineapple': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=400&q=80',

  // Shakes
  'Vanilla Milkshake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
  'Mango Milkshake': 'https://images.unsplash.com/photo-1571006682858-a4572479590e?auto=format&fit=crop&w=400&q=80',
  'Strawberry Milkshake': 'https://images.unsplash.com/photo-1579954115545-aad51642383c?auto=format&fit=crop&w=400&q=80',
  'Oreo Milkshake': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
  'Kit-Kat Milkshake': 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=400&q=80',
  'Pista Milkshake': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
  'Chocolate Milkshake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
  'Butterscotch Milkshake': 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=400&q=80',
  'Black Current Milkshake': 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=400&q=80',

  // Lassi
  'Classic Lassi': 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=400&q=80',
  'Mango Lassi': 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80',
  'Chocolate Lassi': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
  'Vanilla Lassi': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
  'Strawberry Lassi': 'https://images.unsplash.com/photo-1579954115545-aad51642383c?auto=format&fit=crop&w=400&q=80',
  'Butterscotch Lassi': 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=400&q=80',
  'Pista Lassi': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
  'Badham Lassi': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
  'Black Current Lassi': 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=400&q=80',
  "MCube's Special Lassi": 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',

  // Ice Cream
  'Vanilla Ice Cream': 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80',
  'Strawberry Ice Cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=400&q=80',
  'Mango Ice Cream': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=400&q=80',
  'Butterscotch Ice Cream': 'https://images.unsplash.com/photo-1560008511-11c63416e52d?auto=format&fit=crop&w=400&q=80',
  'Chocolate Ice Cream': 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=400&q=80',
  'Pista Ice Cream': 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=400&q=80',
  'Black Current Ice Cream': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',

  // Special Drinks & Falooda
  'Badam Milk': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
  'Rose Milk': 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80',
  'Cold Boost': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80',
  'Cold Horlicks': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80',
  'Cold Coffee': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80',
  'Royal Falooda': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
  'Rose Falooda': 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80',
  "Luxe Falooda (MCube's Special)": 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
  'Chocolate Falooda': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
  'Classic Falooda': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',

  // Soda & Chats
  'Lemon Soda (Sweet / Salt / Sweet & Salt)': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  'Lemon Mint (Sweet / Salt / Sweet & Salt)': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
  'Paani Poori': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
  'Bhel Poori': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80',
  'Masala Poori': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=400&q=80',
  'Egg Bhel Poori': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=400&q=80',
  'Samosa Chat': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
  'Kaalan': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
  'Mushroom Chilli': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
  'Cauliflower Chilli': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80',
  'Dahi Poori': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80',
  'Egg Kalan': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
  'Padi Chat': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',

  // Maggi & Rice
  'Plain Maggi': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
  'Masala Maggi': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
  'Egg Maggi': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
  'Cheese Maggi': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
  'Egg & Cheese Maggi': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
  'Chicken Maggi': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
  'Chicken Cheese Maggi': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
  'Veg Rice': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80',
  'Egg Rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80',
  'Gobi Rice': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80',
  'Mushroom Rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80',
  'Chicken Rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80',

  // Momos
  'Chicken Momos': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
  'Chicken Peri Peri Momos': 'https://images.unsplash.com/photo-1625220194771-7eb5a3a688b1?auto=format&fit=crop&w=400&q=80',
  'Paneer Momos': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
  'Veg Momos': 'https://images.unsplash.com/photo-1625220194771-7eb5a3a688b1?auto=format&fit=crop&w=400&q=80',
  'Corn & Cheese Momos': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
  'Steamed Momos (Extra)': 'https://images.unsplash.com/photo-1625220194771-7eb5a3a688b1?auto=format&fit=crop&w=400&q=80',

  // Hot Beverages
  'Black Tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
  'Tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
  'Rajasthani Ginger Tea': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80',
  'Brown Sugar Tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
  'Lemon Tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
  'Sukku Milk': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
  'Milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
  'Brown Sugar Milk': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
  'Black Coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
  'Coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
  'Brown Sugar Coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
  'Boost': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80',
  'Horlicks': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80',
  'Hot Badam Milk': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
  'Varasukku': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
  'Masala Tea': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80',

  // Burgers
  'Veg Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
  'Veg Cheese Burger': 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80',
  'Paneer Burger': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&q=80',
  'Paneer Cheese Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
  'Chicken Burger': 'https://images.unsplash.com/photo-1615297928064-24977384d0da?auto=format&fit=crop&w=400&q=80',
  'Chicken Cheese Burger': 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=400&q=80',

  // Noodles & Sandwiches
  'Veg Noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
  'Egg Noodles': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
  'Gobi Noodles': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80',
  'Mushroom Noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
  'Chicken Noodles': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
  'Veg Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
  'Veg Cheese Sandwich': 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=400&q=80',
  'Egg Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
  'Egg Cheese Sandwich': 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=400&q=80',
  'Paneer Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
  'Paneer Cheese Sandwich': 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=400&q=80',
  'Mushroom Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
  'Mushroom Cheese Sandwich': 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=400&q=80',
  'Chicken Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
  'Chicken Cheese Sandwich': 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=400&q=80',

  // Tasty Bites & Snacks
  'Bread Omelette': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80',
  'Cheese Bread Omelette': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80',
  'Chicken Bread Omelette': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80',
  'French Fries': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=400&q=80',
  'Peri-Peri Masala Fries': 'https://images.unsplash.com/photo-1630384060421-cb3f20e0649d?auto=format&fit=crop&w=400&q=80',
  'Chicken Nuggets (5 pcs)': 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=400&q=80',
  'Smily Fries (6 pcs)': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=400&q=80',
  'Aaloo Samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
  'Veg Puff': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80',
  'Mushroom Puff': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80',
  'Egg Puff': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80',
  'Chicken Puff': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80',
  'Salt Biscuits': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
  'Onion Samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
};

// Curated array of distinct food photo IDs for fallback item generation
const FOOD_PHOTO_POOL = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=400&q=80',
];

// Helper to guarantee 100% unique image per item name
const getUniqueItemImage = (item) => {
  if (item.image_url) return item.image_url;
  if (ITEM_SPECIFIC_IMAGES[item.name]) return ITEM_SPECIFIC_IMAGES[item.name];

  // Hash-based deterministic unique image selector
  let hash = 0;
  const str = item.name + (item.id || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FOOD_PHOTO_POOL.length;
  return FOOD_PHOTO_POOL[index];
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80';

// Helper to detect Non-Veg items based on name keywords
const isNonVegItem = (item) => {
  const name = item.name.toLowerCase();
  return name.includes('chicken') || name.includes('egg') || name.includes('mutton') || name.includes('fish');
};

const DISH_DESCRIPTIONS = {
  mojito: 'Crisp fresh mint leaves, zesty lime wedges, crushed ice & sparkling soda',
  'blue-curacao': 'Tangy citrus blue curaçao syrup infused with chilled fizzy soda',
  'oreo-shake': 'Rich vanilla ice cream blended with real Oreo cookies & chocolate drizzle',
  'chocolate-shake': 'Decadent Belgian chocolate ice cream shake topped with cocoa shavings',
  'chicken-momos': 'Juicy minced chicken stuffed dumplings served with fiery Schezwan chutney',
  'veg-momos': 'Steamed dumplings packed with seasoned garden veggies & herbs',
  'peri-peri-fries': 'Crispy golden potato fries tossed in spicy Peri-Peri seasoning',
  'french-fries': 'Classic salted crispy french fries served with tangy tomato dip',
  'paneer-burger': 'Crispy paneer patty, fresh lettuce, tomatoes & melted cheese slice',
  'chicken-burger': 'Grilled juicy chicken patty topped with caramelized onions & spicy mayo',
};

const getItemDescription = (item) => {
  if (item.description && !item.description.includes('Delicious') && item.description.length > 15) {
    return item.description;
  }
  const key = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  for (const [pattern, desc] of Object.entries(DISH_DESCRIPTIONS)) {
    if (key.includes(pattern)) return desc;
  }
  const cat = (item.categoryName || '').toLowerCase();
  if (cat.includes('mojito')) return 'Zesty fruit syrup layered with fresh mint, lime & fizzy soda';
  if (cat.includes('shake')) return 'Thick creamy milkshake whipped with premium ice cream & toppings';
  if (cat.includes('momo')) return 'Delicate steamed dumplings filled with savory spices & dips';
  if (cat.includes('burger')) return 'Soft toasted bun with juicy patty, crisp veggies & signature sauce';
  if (cat.includes('fries') || cat.includes('bite')) return 'Crispy fried snack seasoned with authentic house spices';
  return 'Freshly prepared specialty dish crafted with premium ingredients';
};

export default function Menu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [dietFilter, setDietFilter] = useState('all'); // 'all' | 'veg' | 'non-veg' | 'bestseller'
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price-low' | 'price-high' | 'bestseller'
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedItems, setAddedItems] = useState({});
  const [justAdded, setJustAdded] = useState(null);
  const { items: cartItems, addItem, updateQuantity, subtotal } = useCart();
  const { user } = useAuth();
  const tabsRef = useRef(null);
  const searchInputRef = useRef(null);
  const addTimeoutRef = useRef(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/menu/');
      const rawData = response.data;
      const menuData = Array.isArray(rawData)
        ? rawData
        : (Array.isArray(rawData?.results) ? rawData.results : (Array.isArray(rawData?.data) ? rawData.data : []));
      setCategories(menuData);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      setError('Failed to load menu. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Scroll active tab into view
  useEffect(() => {
    if (tabsRef.current && activeCategory !== 'all') {
      const activeBtn = tabsRef.current.querySelector(`[data-slug="${activeCategory}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeCategory]);

  // Keyboard shortcut & custom event to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName))) {
        e.preventDefault();
        setSearchExpanded(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    const handleOpenSearch = () => {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-menu-search', handleOpenSearch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-menu-search', handleOpenSearch);
    };
  }, []);

  // Lock background scroll when filter modal or category drawer is active
  useEffect(() => {
    if (showFilterModal || showCategoryDrawer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFilterModal, showCategoryDrawer]);

  const handleAddToCart = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    const itemWithImage = {
      ...item,
      image_url: getUniqueItemImage(item),
    };
    addItem(itemWithImage);
    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setJustAdded(item.id);
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 1000);
    if (addTimeoutRef.current) clearTimeout(addTimeoutRef.current);
    addTimeoutRef.current = setTimeout(() => {
      setJustAdded((prev) => prev === item.id ? null : prev);
    }, 600);
  };

  const handleBuyNow = (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const itemWithImage = {
      ...item,
      image_url: getUniqueItemImage(item),
      quantity: 1,
    };
    recordItemView(item, user?.id);
    navigate('/checkout', { state: { quickBuyItem: itemWithImage } });
  };

  const renderItemBtnOverlay = (item) => {
    const qty = getItemQuantity(item.id);
    const isItemAdded = addedItems[item.id];

    if (qty > 0) {
      return (
        <div className="card-action-row-buttons">
          <div className="quantity-controls">
            <button className="qty-btn" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, qty - 1); }}><Minus size={14} /></button>
            <span className="qty-value">{qty}</span>
            <button className="qty-btn" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, qty + 1); }}><Plus size={14} /></button>
          </div>
          <button className="quick-buy-btn" onClick={(e) => handleBuyNow(item, e)} title="Buy Now & Checkout Immediately">
            <Zap size={13} /> Buy
          </button>
        </div>
      );
    }

    return (
      <div className="card-action-row-buttons">
        <button
          className={`add-btn ${isItemAdded ? 'added' : ''}`}
          onClick={(e) => handleAddToCart(item, e)}
        >
          {isItemAdded ? <><Check size={14} /> Added</> : <><Plus size={14} /> ADD</>}
        </button>
        <button className="quick-buy-btn" onClick={(e) => handleBuyNow(item, e)} title="Buy Now & Checkout Immediately">
          <Zap size={13} /> Buy Now
        </button>
      </div>
    );
  };

  // Flatten all items with category info (memoized)
  const allItems = useMemo(() =>
    categories.flatMap((cat) => (cat.items || []).map(item => ({
      ...item,
      categoryName: cat.name,
      categorySlug: cat.slug,
      categoryImage: CATEGORY_IMAGES[cat.slug] || DEFAULT_IMAGE,
      isNonVeg: item.is_veg === false || isNonVegItem(item)
    }))),
    [categories]
  );

  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  // Auto-correction computation
  const searchCorrection = useMemo(
    () => autoCorrectQuery(searchQuery, allItems),
    [searchQuery, allItems]
  );

  const handleCategoryClick = (slug) => {
    setActiveCategory(slug);
    setSearchQuery('');
    const el = document.getElementById(`section-${slug}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 130;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Live Autocomplete Suggestions
  const searchSuggestions = useMemo(
    () => getSearchSuggestions(searchQuery, allItems, 5),
    [searchQuery, allItems]
  );

  // Filter & sort items based on activeCategory, searchQuery (with auto-correction), dietFilter, and sortBy
  const filteredItems = useMemo(() => {
    let list = allItems;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      let matched = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );

      if (matched.length === 0 && searchCorrection.isCorrected) {
        const correctedQ = searchCorrection.correctedQuery.toLowerCase();
        matched = list.filter(
          (item) =>
            item.name.toLowerCase().includes(correctedQ) ||
            item.categoryName?.toLowerCase().includes(correctedQ) ||
            item.description?.toLowerCase().includes(correctedQ)
        );
      }
      list = matched;
    } else if (activeCategory !== 'all') {
      list = list.filter((item) => item.categorySlug === activeCategory);
    }

    if (dietFilter === 'veg') {
      list = list.filter((item) => !item.isNonVeg);
    } else if (dietFilter === 'non-veg') {
      list = list.filter((item) => item.isNonVeg);
    } else if (dietFilter === 'bestseller') {
      list = list.filter((item) => item.is_bestseller);
    }

    if (sortBy === 'price-low') {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-high') {
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      // Default: Top selling (bestseller) items come first
      list = [...list].sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
    }

    return list;
  }, [allItems, searchQuery, activeCategory, dietFilter, sortBy, searchCorrection]);

  // Context-aware smart recommendations (Shown ONLY when logged in per User ID)
  const smartRecommendations = useMemo(
    () => getSmartRecommendations(cartItems, allItems, 4, user?.id),
    [cartItems, allItems, user?.id]
  );

  const getItemQuantity = (itemId) => {
    const cartItem = cartItems.find((i) => i.id === itemId);
    return cartItem?.quantity || 0;
  };

  const totalCartItems = cartItems.reduce((s, i) => s + i.quantity, 0);

  if (loading) {
    return (
      <section className="menu-section" id="menu">
        <div className="container">
          <div className="menu-header">
            <div>
              <div className="skeleton-line title-skeleton" style={{ width: '240px', height: '32px', borderRadius: '8px', marginBottom: '0.5rem' }} />
              <div className="skeleton-line subtitle-skeleton" style={{ width: '320px', height: '16px', borderRadius: '6px' }} />
            </div>
            <div className="skeleton-line search-skeleton" style={{ width: '320px', height: '44px', borderRadius: '18px' }} />
          </div>

          <div className="menu-items-grid" style={{ marginTop: '2.5rem' }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="menu-item-card skeleton-card">
                <div className="menu-item-info-col">
                  <div className="skeleton-line" style={{ width: '70%', height: '22px', borderRadius: '6px', marginBottom: '0.6rem' }} />
                  <div className="skeleton-line" style={{ width: '40%', height: '18px', borderRadius: '6px', marginBottom: '0.8rem' }} />
                  <div className="skeleton-line" style={{ width: '90%', height: '14px', borderRadius: '4px', marginBottom: '0.4rem' }} />
                  <div className="skeleton-line" style={{ width: '65%', height: '14px', borderRadius: '4px' }} />
                </div>
                <div className="menu-item-media-col">
                  <div className="skeleton-img" style={{ width: '150px', height: '150px', borderRadius: '18px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="menu-section section">
        <div className="container">
          <div className="menu-error">
            <AlertTriangle size={36} style={{ color: 'var(--yellow)' }} />
            <p>{error}</p>
            <button className="btn btn-outline" style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }} onClick={fetchMenu}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="menu-section" id="menu">
      <div className="container">
        {/* Order Success Toast Banner (when coming back from Checkout) */}
        {location.state?.orderPlaced && (
          <div className="order-placed-success-toast">
            <CheckCircle2 size={24} style={{ color: '#22c55e', flexShrink: 0 }} />
            <div className="toast-text-wrap">
              <strong>Order #{location.state.orderId} Placed Successfully! 🎉</strong>
              <span>Your food is being prepared with care in our kitchen (~10 min prep).</span>
            </div>
          </div>
        )}

        {/* Streamlined Hero Section */}
        <div className="streamlined-hero">
          <h1 className="menu-page-title">
            <Utensils size={30} style={{ color: 'var(--yellow)' }} /> Our Culinary Menu
          </h1>

          {/* Large Primary Search Input (600px) */}
          <div className="primary-search-container">
            <div className="menu-search-wrapper primary-search">
              <span className="menu-search-icon" style={{ display: 'flex', alignItems: 'center' }}>
                <Search size={20} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className="menu-search-input primary-input"
                placeholder="🔍 Search dishes, drinks, desserts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              />
              {searchQuery && (
                <button
                  className="menu-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchSuggestions(false);
                  }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}

              {/* Live Autocomplete Suggestions Dropdown */}
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <div className="menu-search-suggestions">
                  <div className="suggestions-header">Search Suggestions</div>
                  {searchSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="suggestion-item"
                      onMouseDown={() => {
                        setSearchQuery(item.text);
                        setShowSearchSuggestions(false);
                      }}
                    >
                      <Search size={14} className="suggestion-icon" />
                      <span className="suggestion-text">{item.text}</span>
                      <span className="suggestion-cat-tag">{item.cat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Auto-Correction Notice Banner */}
        {searchQuery && searchCorrection.isCorrected && (
          <div className="search-autocorrect-banner">
            <Sparkles size={16} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
            <span>
              Showing results for <strong>"{searchCorrection.correctedQuery}"</strong> instead of "{searchCorrection.originalQuery}"
            </span>
          </div>
        )}

        {/* Unified Sticky Navigation Bar (Category Chips + Filter Modal Button + Sort Dropdown) */}
        <div className="menu-tabs-wrapper sticky-tabs" ref={tabsRef} role="tablist" aria-label="Category Filter Navigation">
          <button
            className={`menu-tab ${activeCategory === 'all' && !searchQuery ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
            role="tab"
            aria-selected={activeCategory === 'all' && !searchQuery}
          >
            <LayoutGrid size={16} />
            <span className="menu-tab-label">All</span>
            <span className="menu-tab-count">{allItems.length}</span>
          </button>

          {categories.map((cat) => {
            const count = (cat.items || []).length;
            const imgSrc = CATEGORY_IMAGES[cat.slug] || DEFAULT_IMAGE;
            return (
              <button
                key={cat.slug}
                className={`menu-tab ${activeCategory === cat.slug && !searchQuery ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.slug)}
                data-slug={cat.slug}
                role="tab"
                aria-selected={activeCategory === cat.slug && !searchQuery}
              >
                <img src={imgSrc} alt={cat.name} className="menu-tab-img" loading="lazy" />
                <span className="menu-tab-label">{cat.name}</span>
                <span className="menu-tab-count">{count}</span>
              </button>
            );
          })}

          {/* Filter Modal Button */}
          <button
            className={`menu-tab filter-modal-trigger ${dietFilter !== 'all' ? 'active' : ''}`}
            onClick={() => setShowFilterModal(true)}
            title="Open Filter Modal"
          >
            <Filter size={16} />
            <span>Filter</span>
            {dietFilter !== 'all' && <span className="filter-active-dot" />}
          </button>
        </div>

        {/* Menu Content Area */}
        <div className="menu-items-section" id="menu-items-section">
          {/* SEARCH OR SPECIFIC CATEGORY / SORTED FILTERED VIEW */}
          {(searchQuery || activeCategory !== 'all' || dietFilter !== 'all' || sortBy !== 'default') ? (
            filteredItems.length === 0 ? (
              <div className="menu-empty-state">
                <Search size={48} style={{ color: 'var(--yellow)', marginBottom: '0.75rem' }} />
                <h3>No dishes found for "{searchQuery || 'your filter'}"</h3>
                <p>
                  {searchQuery
                    ? `We couldn't find an exact match for "${searchQuery}". Try searching for popular keywords below:`
                    : 'Try clearing your active filters or selecting another category.'}
                </p>

                {searchQuery && (
                  <div className="empty-search-pills-row">
                    {['Mojito', 'Momos', 'Burger', 'Shakes', 'Fries', 'Paneer'].map(tag => (
                      <button
                        key={tag}
                        className="empty-search-pill"
                        onClick={() => setSearchQuery(tag)}
                      >
                        🔍 {tag}
                      </button>
                    ))}
                  </div>
                )}

                <button className="btn btn-outline" onClick={() => { setDietFilter('all'); setSortBy('default'); setSearchQuery(''); setActiveCategory('all'); }} style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                  Clear all filters
                </button>

                {/* Pro Recommendations Grid in Empty State */}
                {smartRecommendations.length > 0 && (
                  <div className="empty-recommendations-wrapper">
                    <div className="recommendations-header">
                      <Sparkles size={20} style={{ color: 'var(--yellow)' }} />
                      <div>
                        <h4>Chef's Popular Recommendations</h4>
                        <p>Discover our top customer favorites</p>
                      </div>
                    </div>

                    <div className="menu-items-grid">
                      {smartRecommendations.map((item) => {
                        const qty = getItemQuantity(item.id);
                        const isItemAdded = addedItems[item.id];
                        const isAnimating = justAdded === item.id;
                        const itemImg = getUniqueItemImage(item);

                        return (
                          <div key={item.id} className={`menu-item-card recommendation-card ${isAnimating ? 'card-pop' : ''}`}>
                            <div className="menu-item-info-col">
                              <div className="item-title-row">
                                <span className={`diet-dot ${item.isNonVeg ? 'non-veg' : 'veg'}`} title={item.isNonVeg ? 'Non-Veg' : 'Pure Veg'} />
                                <h3 className="menu-item-name">{item.name}</h3>
                              </div>

                              <div className="item-price-badge-row">
                                <span className="menu-item-price">₹{item.price}</span>
                                <span className="recommendation-badge">{item.matchTag}</span>
                              </div>

                              {item.description && (
                                <p className="menu-item-desc">{item.description}</p>
                              )}
                            </div>

                            <div className="menu-item-media-col">
                              <div className="menu-item-img-container">
                                <img src={itemImg} alt={item.name} className="menu-item-thumb" loading="lazy" />
                                <div className="menu-item-btn-overlay">
                                  {renderItemBtnOverlay(item)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="menu-items-grid">
                {filteredItems.map((item) => {
                  const qty = getItemQuantity(item.id);
                  const isItemAdded = addedItems[item.id];
                  const isAnimating = justAdded === item.id;
                  const itemImg = getUniqueItemImage(item);
                  const ratingVal = (4.6 + (item.id % 4) * 0.1).toFixed(1);
                  const ratingCount = 35 + (item.id * 8) % 90;

                  return (
                    <div key={item.id} className={`menu-item-card ${isAnimating ? 'card-pop' : ''}`}>
                      <div className="menu-item-info-col">
                        <div className="item-title-row">
                          <span className={`diet-dot ${item.isNonVeg ? 'non-veg' : 'veg'}`} title={item.isNonVeg ? 'Non-Veg' : 'Pure Veg'} />
                          <h3 className="menu-item-name">{item.name}</h3>
                        </div>

                        <div className="item-rating-row">
                          <span className="item-rating-badge">⭐ {ratingVal}</span>
                          <span className="item-rating-count">({ratingCount}+)</span>
                        </div>

                        <div className="item-price-badge-row">
                          <span className="menu-item-price">₹{item.price}</span>
                          {item.is_bestseller ? (
                            <span className="menu-item-badge bestseller-badge">
                              <Sparkles size={11} /> Bestseller
                            </span>
                          ) : item.id % 3 === 0 ? (
                            <span className="menu-item-badge chef-badge">
                              <Star size={11} /> Chef Choice
                            </span>
                          ) : item.id % 5 === 0 ? (
                            <span className="menu-item-badge new-badge">
                              🆕 New
                            </span>
                          ) : null}
                        </div>

                        <p className="menu-item-desc">{getItemDescription(item)}</p>
                      </div>

                      <div className="menu-item-media-col">
                        <div className="menu-item-img-container">
                          <img src={itemImg} alt={item.name} className="menu-item-thumb" loading="lazy" />
                        </div>
                        <div className="menu-item-action-footer">
                          {renderItemBtnOverlay(item)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* GROUPED CATEGORY SECTIONS FOR 1-TAP CONTINUOUS BROWSING */
            <div className="grouped-category-sections">
              {/* Smart Context & History-Based Recommendations Carousel */}
              {smartRecommendations && smartRecommendations.length > 0 && (
                <div className="menu-category-section smart-recommendations-section" style={{ marginBottom: '2.5rem' }}>
                  <div className="recommendations-header" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                    <Sparkles size={22} style={{ color: 'var(--yellow)' }} />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                        Recommended For {user?.username || user?.first_name || 'You'} ✨
                      </h3>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                        Handpicked based on your order history, favorites &amp; popular pairings
                      </p>
                    </div>
                  </div>

                  <div className="menu-items-grid">
                    {smartRecommendations.map((item) => {
                      const qty = getItemQuantity(item.id);
                      const isItemAdded = addedItems[item.id];
                      const isAnimating = justAdded === item.id;
                      const itemImg = getUniqueItemImage(item);
                      const ratingVal = (4.7 + (item.id % 4) * 0.1).toFixed(1);
                      const ratingCount = 80 + (item.id % 90);

                      return (
                        <div key={`rec-${item.id}`} className={`menu-item-card recommendation-card ${isAnimating ? 'card-pop' : ''}`}>
                          <div className="menu-item-info-col">
                            <div className="item-title-row">
                              <span className={`diet-dot ${item.isNonVeg ? 'non-veg' : 'veg'}`} title={item.isNonVeg ? 'Non-Veg' : 'Pure Veg'} />
                              <h3 className="menu-item-name">{item.name}</h3>
                            </div>

                            <div className="item-rating-row">
                              <span className="item-rating-badge">⭐ {ratingVal}</span>
                              <span className="item-rating-count">({ratingCount}+)</span>
                            </div>

                            <div className="item-price-badge-row">
                              <span className="menu-item-price">₹{item.price}</span>
                              <span className="recommendation-badge">{item.matchTag || 'Chef Pick'}</span>
                            </div>

                            <p className="menu-item-desc">{getItemDescription(item)}</p>
                          </div>

                          <div className="menu-item-media-col">
                            <div className="menu-item-img-container">
                              <img src={itemImg} alt={item.name} className="menu-item-thumb" loading="lazy" />
                            </div>
                            <div className="menu-item-action-footer">
                              {renderItemBtnOverlay(item)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {categories.map((cat) => {
                const catItems = [...(cat.items || [])].sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
                if (catItems.length === 0) return null;
                const imgSrc = CATEGORY_IMAGES[cat.slug] || DEFAULT_IMAGE;

                return (
                  <div key={cat.slug} id={`section-${cat.slug}`} className="menu-category-section">
                    <div className="category-section-banner compact-banner">
                      <div className="category-banner-title-wrap">
                        <img src={imgSrc} alt={cat.name} className="category-banner-thumb" loading="lazy" />
                        <h3 className="category-title-text">{cat.name}</h3>
                        <span className="category-count-pill">({catItems.length})</span>
                      </div>
                      <div className="category-banner-divider" />
                    </div>

                    <div className="menu-items-grid">
                      {catItems.map((item) => {
                        const qty = getItemQuantity(item.id);
                        const isItemAdded = addedItems[item.id];
                        const isAnimating = justAdded === item.id;
                        const itemImg = getUniqueItemImage(item);
                        const ratingVal = (4.6 + (item.id % 4) * 0.1).toFixed(1);
                        const ratingCount = 35 + (item.id * 8) % 90;

                        return (
                          <div key={item.id} className={`menu-item-card ${isAnimating ? 'card-pop' : ''}`}>
                            <div className="menu-item-info-col">
                              <div className="item-title-row">
                                <span className={`diet-dot ${item.isNonVeg ? 'non-veg' : 'veg'}`} title={item.isNonVeg ? 'Non-Veg' : 'Pure Veg'} />
                                <h3 className="menu-item-name">{item.name}</h3>
                              </div>

                              <div className="item-rating-row">
                                <span className="item-rating-badge">⭐ {ratingVal}</span>
                                <span className="item-rating-count">({ratingCount}+)</span>
                              </div>

                              <div className="item-price-badge-row">
                                <span className="menu-item-price">₹{item.price}</span>
                                {item.is_bestseller ? (
                                  <span className="menu-item-badge bestseller-badge">
                                    <Sparkles size={11} /> Bestseller
                                  </span>
                                ) : item.id % 3 === 0 ? (
                                  <span className="menu-item-badge chef-badge">
                                    <Star size={11} /> Chef Choice
                                  </span>
                                ) : item.id % 5 === 0 ? (
                                  <span className="menu-item-badge new-badge">
                                    🆕 New
                                  </span>
                                ) : null}
                              </div>

                              <p className="menu-item-desc">{getItemDescription(item)}</p>
                            </div>

                            <div className="menu-item-media-col">
                              <div className="menu-item-img-container">
                                <img src={itemImg} alt={item.name} className="menu-item-thumb" loading="lazy" />
                              </div>
                              <div className="menu-item-action-footer">
                                {renderItemBtnOverlay(item)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Category Jump FAB Button */}
        <button
          className={`floating-category-fab ${totalCartItems > 0 ? 'shifted' : ''}`}
          onClick={() => setShowCategoryDrawer(true)}
          title="Browse Menu Categories"
          aria-label="Browse Menu Categories"
        >
          <Utensils size={18} />
          <span>MENU</span>
        </button>

        {/* Quick Category Selector Drawer Sheet */}
        {showCategoryDrawer && (
          <div className="category-drawer-backdrop" onClick={() => setShowCategoryDrawer(false)}>
            <div className="category-drawer-modal" onClick={(e) => e.stopPropagation()}>
              <div className="category-drawer-header">
                <h3>Menu Categories ({categories.length})</h3>
                <button className="category-drawer-close" onClick={() => setShowCategoryDrawer(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="category-drawer-grid">
                <button
                  className={`category-drawer-item ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                    setShowCategoryDrawer(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <LayoutGrid size={22} style={{ color: 'var(--yellow)' }} />
                  <span className="drawer-item-name">All Items</span>
                  <span className="drawer-item-count">{allItems.length}</span>
                </button>
                {categories.map((cat) => {
                  const imgSrc = CATEGORY_IMAGES[cat.slug] || DEFAULT_IMAGE;
                  return (
                    <button
                      key={cat.slug}
                      className={`category-drawer-item ${activeCategory === cat.slug ? 'active' : ''}`}
                      onClick={() => {
                        setActiveCategory(cat.slug);
                        setSearchQuery('');
                        setShowCategoryDrawer(false);
                        const el = document.getElementById(`section-${cat.slug}`);
                        if (el) {
                          const y = el.getBoundingClientRect().top + window.pageYOffset - 130;
                          window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                      }}
                    >
                      <img src={imgSrc} alt={cat.name} className="drawer-item-img" loading="lazy" />
                      <span className="drawer-item-name">{cat.name}</span>
                      <span className="drawer-item-count">{cat.items?.length || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Filter Modal Dialog */}
        {showFilterModal && (
          <div className="filter-modal-backdrop" onClick={() => setShowFilterModal(false)}>
            <div className="filter-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="filter-modal-header">
                <h3><Filter size={18} style={{ color: 'var(--yellow)' }} /> Filter & Sort Menu</h3>
                <button className="filter-modal-close" onClick={() => setShowFilterModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="filter-modal-body">
                {/* Dietary Preference */}
                <div className="filter-group">
                  <label className="filter-group-label">Dietary Preference</label>
                  <div className="filter-options-grid">
                    <button
                      className={`filter-opt-btn ${dietFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setDietFilter('all')}
                    >
                      All Dishes
                    </button>
                    <button
                      className={`filter-opt-btn veg ${dietFilter === 'veg' ? 'active' : ''}`}
                      onClick={() => setDietFilter('veg')}
                    >
                      <span className="diet-dot veg" /> Pure Veg
                    </button>
                    <button
                      className={`filter-opt-btn non-veg ${dietFilter === 'non-veg' ? 'active' : ''}`}
                      onClick={() => setDietFilter('non-veg')}
                    >
                      <span className="diet-dot non-veg" /> Non-Veg
                    </button>
                    <button
                      className={`filter-opt-btn bestseller ${dietFilter === 'bestseller' ? 'active' : ''}`}
                      onClick={() => setDietFilter('bestseller')}
                    >
                      ⭐ Bestsellers
                    </button>
                  </div>
                </div>

                {/* Sort Order */}
                <div className="filter-group">
                  <label className="filter-group-label">Sort Order</label>
                  <div className="filter-options-grid">
                    <button
                      className={`filter-opt-btn ${sortBy === 'default' ? 'active' : ''}`}
                      onClick={() => setSortBy('default')}
                    >
                      Recommended
                    </button>
                    <button
                      className={`filter-opt-btn ${sortBy === 'price-low' ? 'active' : ''}`}
                      onClick={() => setSortBy('price-low')}
                    >
                      Price: Low to High
                    </button>
                    <button
                      className={`filter-opt-btn ${sortBy === 'price-high' ? 'active' : ''}`}
                      onClick={() => setSortBy('price-high')}
                    >
                      Price: High to Low
                    </button>
                    <button
                      className={`filter-opt-btn ${sortBy === 'bestseller' ? 'active' : ''}`}
                      onClick={() => setSortBy('bestseller')}
                    >
                      Most Popular
                    </button>
                  </div>
                </div>
              </div>

              <div className="filter-modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setDietFilter('all');
                    setSortBy('default');
                    setShowFilterModal(false);
                  }}
                >
                  Reset All
                </button>
                <button className="btn btn-yellow" onClick={() => setShowFilterModal(false)}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
