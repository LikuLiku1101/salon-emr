-- StaffテーブルにLINE ID保存用のカラムを追加
ALTER TABLE staff ADD COLUMN IF NOT EXISTS line_user_id TEXT;
