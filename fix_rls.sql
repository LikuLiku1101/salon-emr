-- 1. Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 2. Define policies for authenticated users (Staff)
-- This allows anyone who is logged into Supabase Auth (staff) to perform all operations.

-- Customers Policy
CREATE POLICY "Allow authenticated access to customers" ON customers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Staff Policy
CREATE POLICY "Allow authenticated access to staff" ON staff
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Contracts Policy
CREATE POLICY "Allow authenticated access to contracts" ON contracts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payments Policy
CREATE POLICY "Allow authenticated access to payments" ON payments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Treatments Policy
CREATE POLICY "Allow authenticated access to treatments" ON treatments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Treatment Details Policy
CREATE POLICY "Allow authenticated access to treatment_details" ON treatment_details
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Expenses Policy
CREATE POLICY "Allow authenticated access to expenses" ON expenses
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
