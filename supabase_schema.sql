-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_kana TEXT,
    phone TEXT,
    email TEXT,
    line_user_id TEXT, -- For LINE integration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Staff
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT,
    base_salary INTEGER DEFAULT 0,
    commission_rate DECIMAL(5, 2) DEFAULT 0, -- 歩合率
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    installments INTEGER DEFAULT 1,
    payment_type TEXT NOT NULL, -- '一括', '都度', '分割'
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL, -- 'カード', '現金', 'せたぺい', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Treatments (来店・カルテ記録)
CREATE TABLE treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    visit_time TIME,
    visit_count INTEGER DEFAULT 1,
    next_reservation_date DATE,
    next_reservation_time TIME,
    line_notified BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Treatment Details (照射記録)
CREATE TABLE treatment_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_id UUID REFERENCES treatments(id) ON DELETE CASCADE,
    body_part TEXT NOT NULL,
    machine_type TEXT NOT NULL, -- 'IPL', 'SHR'
    power_level TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_date DATE NOT NULL,
    category TEXT NOT NULL,
    amount INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
