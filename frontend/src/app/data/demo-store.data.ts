import { Banner, Category, Order, Product, SubCategory } from '../models/brew-and-leaf.models';

export const DEMO_CATEGORIES: Category[] = [
  { id: 1, name: 'Signature Drinks', description: 'Coffee, matcha, milkshakes and fresh cafe specials.' },
  { id: 2, name: 'Food Menu', description: 'Quick bites, loaded snacks and cafe comfort food.' },
  { id: 3, name: 'Desserts', description: 'Cheesecakes, pastries and sweet add-ons.' }
];

export const DEMO_SUB_CATEGORIES: SubCategory[] = [
  { id: 1, category_id: 1, category_name: 'Signature Drinks', name: 'Matcha', description: 'Premium matcha creations.', sort_order: 1 },
  { id: 2, category_id: 1, category_name: 'Signature Drinks', name: 'Milkshake', description: 'Dessert-style shakes.', sort_order: 2 },
  { id: 3, category_id: 1, category_name: 'Signature Drinks', name: 'Soda', description: 'Fruit-forward sparkling drinks.', sort_order: 3 },
  { id: 4, category_id: 1, category_name: 'Signature Drinks', name: 'Boba Tea', description: 'Refreshing boba favourites.', sort_order: 4 },
  { id: 5, category_id: 1, category_name: 'Signature Drinks', name: 'Latte', description: 'Iced and creamy coffee drinks.', sort_order: 5 },
  { id: 6, category_id: 1, category_name: 'Signature Drinks', name: 'Hot Coffee', description: 'Warm cafe classics.', sort_order: 6 },
  { id: 7, category_id: 1, category_name: 'Signature Drinks', name: 'Frappuccino', description: 'Blended indulgent drinks.', sort_order: 7 },
  { id: 8, category_id: 3, category_name: 'Desserts', name: 'Cakes & Pastries', description: 'Cafe cheesecakes and brownies.', sort_order: 8 },
  { id: 9, category_id: 2, category_name: 'Food Menu', name: 'Nachos', description: 'Loaded snack platters.', sort_order: 9 },
  { id: 10, category_id: 2, category_name: 'Food Menu', name: 'Pasta', description: 'Creamy and savory pasta bowls.', sort_order: 10 },
  { id: 11, category_id: 2, category_name: 'Food Menu', name: 'Momo', description: 'Fried momo plates.', sort_order: 11 },
  { id: 12, category_id: 2, category_name: 'Food Menu', name: 'Sandwiches', description: 'Toasted cafe sandwiches.', sort_order: 12 },
  { id: 13, category_id: 2, category_name: 'Food Menu', name: 'Fries', description: 'Classic and loaded fries.', sort_order: 13 },
  { id: 14, category_id: 3, category_name: 'Desserts', name: 'Churros', description: 'Sweet cinnamon treats.', sort_order: 14 },
  { id: 15, category_id: 2, category_name: 'Food Menu', name: 'Garlic Bread', description: 'Cheesy oven-fresh garlic breads.', sort_order: 15 }
];

export const DEMO_PRODUCTS: Product[] = [
  { id: 1, category_id: 1, sub_category_id: 1, category_name: 'Signature Drinks', sub_category_name: 'Matcha', name: 'Iced Matcha Latte', description: 'Smooth ceremonial matcha with milk and light sweetness.', price: 139, costing: 58, discount: 0, inventory_count: 30, is_featured: true },
  { id: 2, category_id: 1, sub_category_id: 1, category_name: 'Signature Drinks', sub_category_name: 'Matcha', name: 'Strawberry Matcha Latte', description: 'Layered strawberry puree and matcha over chilled milk.', price: 149, costing: 62, discount: 0, inventory_count: 28, is_featured: true },
  { id: 3, category_id: 1, sub_category_id: 1, category_name: 'Signature Drinks', sub_category_name: 'Matcha', name: 'Blue Berry Matcha Latte', description: 'Berry-forward matcha with a vibrant finish.', price: 149, costing: 63, discount: 0, inventory_count: 22 },
  { id: 4, category_id: 1, sub_category_id: 1, category_name: 'Signature Drinks', sub_category_name: 'Matcha', name: 'Mango Matcha Latte', description: 'Mango pulp balanced with premium matcha.', price: 149, costing: 64, discount: 0, inventory_count: 24 },
  { id: 5, category_id: 1, sub_category_id: 2, category_name: 'Signature Drinks', sub_category_name: 'Milkshake', name: 'Chocolate Milkshake', description: 'Rich chocolate shake topped with cafe-style finish.', price: 169, costing: 73, discount: 0, inventory_count: 26, is_featured: true },
  { id: 6, category_id: 1, sub_category_id: 2, category_name: 'Signature Drinks', sub_category_name: 'Milkshake', name: 'Lotus Biscoff Milkshake', description: 'Creamy biscoff shake with cookie crumb texture.', price: 169, costing: 76, discount: 0, inventory_count: 18 },
  { id: 7, category_id: 1, sub_category_id: 2, category_name: 'Signature Drinks', sub_category_name: 'Milkshake', name: 'Oreo Milkshake', description: 'Classic cookies-and-cream cafe shake.', price: 169, costing: 72, discount: 0, inventory_count: 21 },
  { id: 8, category_id: 1, sub_category_id: 3, category_name: 'Signature Drinks', sub_category_name: 'Soda', name: 'Peach Basil Breeze', description: 'Peach, basil and sparkling refreshment.', price: 89, costing: 31, discount: 0, inventory_count: 40 },
  { id: 9, category_id: 1, sub_category_id: 3, category_name: 'Signature Drinks', sub_category_name: 'Soda', name: 'Blue Ocean Mojito', description: 'Bright citrus soda with a cool mojito touch.', price: 89, costing: 31, discount: 0, inventory_count: 36 },
  { id: 10, category_id: 1, sub_category_id: 4, category_name: 'Signature Drinks', sub_category_name: 'Boba Tea', name: 'Blueberry Matcha Boba', description: 'Blueberry sweetness with matcha and chewy pearls.', price: 169, costing: 73, discount: 0, inventory_count: 19, is_featured: true },
  { id: 11, category_id: 1, sub_category_id: 4, category_name: 'Signature Drinks', sub_category_name: 'Boba Tea', name: 'Lychee Raspberry Boba', description: 'Fruity lychee and raspberry fusion.', price: 169, costing: 71, discount: 0, inventory_count: 19 },
  { id: 12, category_id: 1, sub_category_id: 4, category_name: 'Signature Drinks', sub_category_name: 'Boba Tea', name: 'Iced Coffee Boba', description: 'Bold coffee meets soft boba pearls.', price: 169, costing: 70, discount: 0, inventory_count: 17 },
  { id: 13, category_id: 1, sub_category_id: 5, category_name: 'Signature Drinks', sub_category_name: 'Latte', name: 'Iced Coffee Latte', description: 'Balanced espresso over chilled milk.', price: 149, costing: 55, discount: 0, inventory_count: 34, is_featured: true },
  { id: 14, category_id: 1, sub_category_id: 5, category_name: 'Signature Drinks', sub_category_name: 'Latte', name: 'Iced Caramel Latte', description: 'Silky caramel coffee with cafe sweetness.', price: 149, costing: 57, discount: 0, inventory_count: 28 },
  { id: 15, category_id: 1, sub_category_id: 5, category_name: 'Signature Drinks', sub_category_name: 'Latte', name: 'Iced Mocha Coffee', description: 'Chocolate and espresso with a creamy body.', price: 159, costing: 60, discount: 0, inventory_count: 24 },
  { id: 16, category_id: 1, sub_category_id: 6, category_name: 'Signature Drinks', sub_category_name: 'Hot Coffee', name: 'Cappuccino', description: 'Velvety foam and classic espresso profile.', price: 139, costing: 48, discount: 0, inventory_count: 42 },
  { id: 17, category_id: 1, sub_category_id: 6, category_name: 'Signature Drinks', sub_category_name: 'Hot Coffee', name: 'Mocha', description: 'Cafe mocha with warm chocolate notes.', price: 139, costing: 49, discount: 0, inventory_count: 35 },
  { id: 18, category_id: 1, sub_category_id: 6, category_name: 'Signature Drinks', sub_category_name: 'Hot Coffee', name: 'Hot Chocolate', description: 'Comforting hot chocolate for all-day sipping.', price: 139, costing: 45, discount: 0, inventory_count: 38 },
  { id: 19, category_id: 1, sub_category_id: 7, category_name: 'Signature Drinks', sub_category_name: 'Frappuccino', name: 'Java Chip Frappe', description: 'Blended coffee frappe with chocolate chips.', price: 179, costing: 79, discount: 0, inventory_count: 16, is_featured: true },
  { id: 20, category_id: 1, sub_category_id: 7, category_name: 'Signature Drinks', sub_category_name: 'Frappuccino', name: 'Matcha Cream Frappe', description: 'Creamy blended matcha frappe.', price: 179, costing: 78, discount: 0, inventory_count: 16 },
  { id: 21, category_id: 3, sub_category_id: 8, category_name: 'Desserts', sub_category_name: 'Cakes & Pastries', name: 'Blueberry Cheesecake', description: 'Cafe cheesecake with blueberry topping.', price: 139, costing: 62, discount: 0, inventory_count: 14 },
  { id: 22, category_id: 3, sub_category_id: 8, category_name: 'Desserts', sub_category_name: 'Cakes & Pastries', name: 'Biscoff Cheesecake', description: 'Creamy cheesecake layered with biscoff.', price: 149, costing: 68, discount: 0, inventory_count: 12, is_featured: true },
  { id: 23, category_id: 2, sub_category_id: 9, category_name: 'Food Menu', sub_category_name: 'Nachos', name: 'Classic Nachos', description: 'Crispy nachos with salsa and seasoning.', price: 119, costing: 49, discount: 0, inventory_count: 20 },
  { id: 24, category_id: 2, sub_category_id: 9, category_name: 'Food Menu', sub_category_name: 'Nachos', name: 'Cream Cheese Nachos', description: 'Loaded nachos finished with cream cheese.', price: 139, costing: 58, discount: 0, inventory_count: 18 },
  { id: 25, category_id: 2, sub_category_id: 10, category_name: 'Food Menu', sub_category_name: 'Pasta', name: 'Alfredo Pasta', description: 'Creamy alfredo pasta with rich herbs.', price: 169, costing: 72, discount: 0, inventory_count: 15 },
  { id: 26, category_id: 2, sub_category_id: 10, category_name: 'Food Menu', sub_category_name: 'Pasta', name: 'Pink Sauce Pasta', description: 'Cafe-style pink sauce pasta bowl.', price: 169, costing: 73, discount: 0, inventory_count: 14 },
  { id: 27, category_id: 2, sub_category_id: 11, category_name: 'Food Menu', sub_category_name: 'Momo', name: 'Fried Veg Momo', description: 'Golden-fried momos served with dip.', price: 99, costing: 39, discount: 0, inventory_count: 18 },
  { id: 28, category_id: 2, sub_category_id: 11, category_name: 'Food Menu', sub_category_name: 'Momo', name: 'Fried Paneer Momo', description: 'Paneer-filled fried momo platter.', price: 109, costing: 45, discount: 0, inventory_count: 17 },
  { id: 29, category_id: 2, sub_category_id: 12, category_name: 'Food Menu', sub_category_name: 'Sandwiches', name: 'Veggie Loaded Sandwich', description: 'Layered toasted sandwich with fresh fillings.', price: 99, costing: 42, discount: 0, inventory_count: 22 },
  { id: 30, category_id: 2, sub_category_id: 12, category_name: 'Food Menu', sub_category_name: 'Sandwiches', name: 'Paneer Sandwich', description: 'Toasted paneer sandwich with signature spread.', price: 129, costing: 52, discount: 0, inventory_count: 21 },
  { id: 31, category_id: 2, sub_category_id: 13, category_name: 'Food Menu', sub_category_name: 'Fries', name: 'Classic Salted Fries', description: 'Golden fries with balanced seasoning.', price: 109, costing: 41, discount: 0, inventory_count: 26 },
  { id: 32, category_id: 2, sub_category_id: 13, category_name: 'Food Menu', sub_category_name: 'Fries', name: 'Cheesy Loaded Fries', description: 'Loaded fries with creamy cheese topping.', price: 139, costing: 56, discount: 0, inventory_count: 18 },
  { id: 33, category_id: 3, sub_category_id: 14, category_name: 'Desserts', sub_category_name: 'Churros', name: 'Classic Churros', description: 'Classic churros with chocolate dip.', price: 129, costing: 54, discount: 0, inventory_count: 16 },
  { id: 34, category_id: 3, sub_category_id: 14, category_name: 'Desserts', sub_category_name: 'Churros', name: 'Caramel Churros', description: 'Fresh churros with caramel chocolate dip.', price: 139, costing: 58, discount: 0, inventory_count: 15 },
  { id: 35, category_id: 2, sub_category_id: 15, category_name: 'Food Menu', sub_category_name: 'Garlic Bread', name: 'Original Garlic Bread', description: 'Toasted garlic bread with herb butter.', price: 109, costing: 38, discount: 0, inventory_count: 23 },
  { id: 36, category_id: 2, sub_category_id: 15, category_name: 'Food Menu', sub_category_name: 'Garlic Bread', name: 'Cheesy Garlic Bread', description: 'Cheesy garlic bread baked for a cafe finish.', price: 129, costing: 49, discount: 0, inventory_count: 20 }
];

export const DEMO_BANNERS: Banner[] = [
  {
    id: 1,
    title: 'Brewed for 2026 cravings',
    description: 'Launch premium matcha, coffee and quick bites with a modern cafe homepage that feels fresh and high-conversion.',
    image_url: 'assets/img/IMG_0069.PNG',
    cta_label: 'Explore Menu',
    cta_link: '#menu',
    is_active: true
  },
  {
    id: 2,
    title: 'Food and drinks in one flexible menu',
    description: 'Manage drinks, snacks, pasta, sandwiches and desserts from admin using category, sub-category and product structure.',
    image_url: 'assets/icons/brandLogo.svg',
    cta_label: 'View Specials',
    cta_link: '#specials',
    is_active: true
  },
  {
    id: 3,
    title: 'Starbucks-style merchandising flow',
    description: 'Highlight featured bestsellers, seasonal banners, and premium menu collections from one clean admin panel.',
    image_url: 'assets/img/model-frame2.svg',
    cta_label: 'Open Admin',
    cta_link: '/admin',
    is_active: true
  }
];

export const DEMO_ORDERS: Order[] = [
  {
    id: 1,
    customer_name: 'Walk-in Customer',
    customer_email: 'counter@brewandleaf.com',
    customer_phone: '9999999999',
    invoice_number: 'BWL-240001',
    items: [
      { product_id: 1, name: 'Iced Matcha Latte', quantity: 1, unit_price: 139, total_price: 139 },
      { product_id: 31, name: 'Classic Salted Fries', quantity: 1, unit_price: 109, total_price: 109 }
    ],
    total_amount: 248,
    discount_applied: 0,
    final_amount: 248,
    created_at: new Date().toISOString()
  }
];
