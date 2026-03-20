-- customersテーブルに性別カラムを追加
ALTER TABLE customers 
ADD COLUMN gender TEXT; -- '男性', '女性', 'その他' など
