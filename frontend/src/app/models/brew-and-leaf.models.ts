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

export interface ProductSize {
    id?: number;
    product_id?: number;
    size: string; // 'small', 'regular', 'large', etc.
    price: number;
    costing?: number;
}

export interface Product {
    id?: number;
    category_id: number;
    sub_category_id?: number;
    name: string;
    description?: string;
    price: number; // default/regular price
    costing: number;
    discount: number;
    inventory_count: number;
    image_url?: string;
    images?: string[];
    aspect_ratio?: string;
    category_name?: string;
    sub_category_name?: string;
    is_featured?: boolean;
    sizes?: ProductSize[]; // small, regular, large variants
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
    size?: string; // 'small', 'regular', etc.
}

export interface Customer {
    id?: number;
    name: string;
    email?: string;
    phone?: string;
    loyalty_points?: number;
    total_orders?: number;
    total_spent?: number;
    created_at?: string;
}

export interface CreditDebit {
    id?: number;
    type: 'credit' | 'debit';
    amount: number;
    description?: string;
    order_id?: number;
    invoice_number?: string;
    created_at?: string;
}

export interface Order {
    id?: number;
    invoice_number: string;
    customer_id?: number;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    items: OrderItem[];
    total_amount: number;
    discount_applied: number;
    final_amount: number;
    payment_method: 'cash' | 'online';
    payment_status?: 'pending' | 'paid' | 'cancelled';
    order_status?: 'open' | 'closed';
    loyalty_points_earned?: number;
    loyalty_points_used?: number;
    created_at?: string;
    updated_at?: string;
    // Optional: track discount type when sending from frontend
    discount_type?: 'amount' | 'percent';
    discount_percent?: number;
}

export interface DailyStats {
    id?: number;
    date: string;
    total_sales?: number;
    total_cost?: number;
    total_profit?: number;
    total_credit?: number;
    total_debit?: number;
    created_at?: string;
}

export interface Stats {
    total_revenue: number;
    today_revenue: number;
    total_orders: number;
    today_orders: number;
    total_products: number;
    total_inventory: number;
    total_credit: number;
    total_debit: number;
}
