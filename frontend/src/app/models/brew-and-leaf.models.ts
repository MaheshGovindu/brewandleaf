export interface Category {
    id?: number;
    name: string;
    description?: string;
}

export interface SubCategory {
category_name: any;
    id?: number;
    category_id: number;
    name: string;
    description?: string;
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
    aspect_ratio?: string;
    category_name?: string;
    sub_category_name?: string;
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
}

export interface Stats {
    total_revenue: number;
    total_orders: number;
    total_products: number;
    total_inventory: number;
}
