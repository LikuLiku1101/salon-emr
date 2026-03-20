ALTER TABLE treatments 
ADD COLUMN payment_status TEXT,
ADD COLUMN payment_method TEXT,
ADD COLUMN payment_amount INTEGER,
ADD COLUMN handpiece_ipl_count INTEGER,
ADD COLUMN handpiece_shr_count INTEGER,
ADD COLUMN reserved_content TEXT;
