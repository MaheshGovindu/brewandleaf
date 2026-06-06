export interface Category {
    id?: number;
    name: string;
    description?: string;
    image_url?: string;
}

export interface SubCategory {
    category_name?: string;
    id?: number;
    category_id: number;
    name: string;
    description?: string;
    sort_order?: number;
}

export interface Product {
    id?: number;
    category_id: number;
    sub_category_id?: number;
    name: string;
    description?: string;
    price: number;
    costing: number;
    discount: number;
    inventory_count: number;
    image_url?: string;
    images?: string[];
    aspect_ratio?: string;
    category_name?: string;
    sub_category_name?: string;
    is_featured?: boolean;
}

export interface Banner {
    id?: number;
    title: string;
    description: string;
    image_url?: string;
    cta_label?: string;
    cta_link?: string;
    is_active?: boolean;
}

export interface OrderItem {
    product_id: number;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface Order {
    id?: number;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    invoice_number?: string;
    items: OrderItem[];
    total_amount: number;
    discount_applied: number;
    final_amount: number;
    created_at?: string;
    // Optional: track discount type when sending from frontend
    discount_type?: 'amount' | 'percent';
    discount_percent?: number;
}

export interface Stats {
    total_revenue: number;
    total_orders: number;
    total_products: number;
    total_inventory: number;
}
