CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PHÂN HỆ: RBAC (PHÂN QUYỀN)
CREATE TABLE roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 2. PHÂN HỆ: SẢN PHẨM & QUY ĐỔI ĐƠN VỊ
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    active_ingredients JSONB DEFAULT '[]'::jsonb,
    usage_instructions TEXT,
    default_storage VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_units (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    unit_name VARCHAR(50) NOT NULL,
    conversion_to_base INT NOT NULL CHECK (conversion_to_base > 0),
    selling_price DECIMAL(12, 2) NOT NULL CHECK (selling_price >= 0),
    is_base_unit BOOLEAN DEFAULT FALSE,
    barcode VARCHAR(50) UNIQUE,
    CONSTRAINT uq_product_unit UNIQUE (product_id, unit_name)
);


-- 3. PHÂN HỆ: DSS (PHÂN TÍCH & ĐỀ XUẤT NHẬP HÀNG)
CREATE TABLE demand_forecasts (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    forecast_start_date DATE NOT NULL,
    forecast_end_date DATE NOT NULL,
    predicted_quantity DECIMAL(12, 2) NOT NULL,
    model_used VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reorder_plans (
    id BIGSERIAL PRIMARY KEY,
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    created_by BIGINT NOT NULL REFERENCES users(id),
    approved_by BIGINT REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CONVERTED')),
    ai_explanation_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reorder_plan_items (
    id BIGSERIAL PRIMARY KEY,
    reorder_plan_id BIGINT NOT NULL REFERENCES reorder_plans(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    forecast_id BIGINT REFERENCES demand_forecasts(id) ON DELETE SET NULL,
    current_stock INT NOT NULL CHECK (current_stock >= 0),
    suggested_quantity INT NOT NULL CHECK (suggested_quantity > 0),
    algorithm_reasoning TEXT
);


-- 4. PHÂN HỆ: PURCHASING (MUA HÀNG) & QUẢN LÝ LÔ (BATCHES - FEFO)
CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    lead_time_days INT DEFAULT 3 CHECK (lead_time_days > 0),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    po_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    creator_id BIGINT NOT NULL REFERENCES users(id),
    reorder_plan_id BIGINT REFERENCES reorder_plans(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED')),
    total_cost DECIMAL(12, 2) DEFAULT 0 CHECK (total_cost >= 0),
    delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    unit_id BIGINT NOT NULL REFERENCES product_units(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    import_price DECIMAL(12, 2) NOT NULL CHECK (import_price >= 0)
);

CREATE TABLE batches (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    purchase_order_item_id BIGINT REFERENCES purchase_order_items(id) ON DELETE SET NULL,
    batch_number VARCHAR(50) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    quantity_remaining INT NOT NULL CHECK (quantity_remaining >= 0),
    import_price DECIMAL(12, 2) NOT NULL CHECK (import_price >= 0),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WARNING_NEAR_EXPIRY', 'EXPIRED', 'BLOCKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_batch UNIQUE (product_id, batch_number)
);

CREATE TABLE inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    user_id BIGINT REFERENCES users(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('IMPORT', 'SALE', 'RETURN', 'DISCARD', 'ADJUSTMENT')),
    quantity_change INT NOT NULL,
    remaining_quantity INT NOT NULL CHECK (remaining_quantity >= 0),
    reference_type VARCHAR(20),
    reference_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 5. PHÂN HỆ: POS (BÁN HÀNG)
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    loyalty_points INT DEFAULT 0 CHECK (loyalty_points >= 0),
    medical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_code VARCHAR(50) UNIQUE NOT NULL,
    staff_id BIGINT NOT NULL REFERENCES users(id),
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
    discount_amount DECIMAL(12, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    final_amount DECIMAL(12, 2) NOT NULL CHECK (final_amount >= 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'TRANSFER', 'CARD', 'QR_CODE')),
    prescription_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    batch_id BIGINT NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    unit_id BIGINT NOT NULL REFERENCES product_units(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    base_quantity INT NOT NULL CHECK (base_quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0)
);


-- 6. CHỈ MỤC TỐI ƯU HIỆU NĂNG TRUY VẤN (INDEXES)

CREATE INDEX idx_batches_fefo ON batches(product_id, expiry_date ASC)
WHERE quantity_remaining > 0 AND status = 'ACTIVE';

CREATE INDEX idx_product_units_barcode ON product_units(barcode)
WHERE barcode IS NOT NULL;

CREATE INDEX idx_products_active_ingredients ON products USING gin(active_ingredients);

CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_inv_transactions_timeseries ON inventory_transactions(batch_id, created_at DESC);

CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id, status);
CREATE INDEX idx_reorder_plans_status ON reorder_plans(status);














