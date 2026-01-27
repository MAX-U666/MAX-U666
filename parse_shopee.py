#!/usr/bin/env python3
import pandas as pd
import json
import sys

def parse_shopee_excel(file_path):
    result = {'success': True, 'products': [], 'errors': []}
    try:
        df = pd.read_excel(file_path)
        shop_data = {}
        
        for _, row in df.iterrows():
            pid = str(row.get('Kode Produk', '')).strip()
            if not pid or pid == 'nan' or pid == '': 
                continue
            
            def safe_int(val):
                if pd.isna(val) or val == '-' or val == '':
                    return 0
                try:
                    return int(float(str(val).replace(',', '').replace('.', '')))
                except:
                    return 0
            
            if pid not in shop_data:
                shop_data[pid] = {
                    'product_id': pid, 
                    'product_name': str(row.get('Produk', ''))[:80], 
                    'visitors': 0, 
                    'page_views': 0,
                    'clicks': 0, 
                    'add_to_cart': 0, 
                    'orders': 0, 
                    'revenue': 0
                }
            
            shop_data[pid]['visitors'] += safe_int(row.get('Pengunjung Produk (Kunjungan)', 0))
            shop_data[pid]['page_views'] += safe_int(row.get('Halaman Produk Dilihat', 0))
            shop_data[pid]['clicks'] += safe_int(row.get('Klik Pencarian', 0))
            shop_data[pid]['add_to_cart'] += safe_int(row.get('Dimasukkan ke Keranjang (Produk)', 0))
            shop_data[pid]['orders'] += safe_int(row.get('Total Pembeli (Pesanan Dibuat)', 0))
            shop_data[pid]['revenue'] += safe_int(row.get('Total Penjualan (Pesanan Dibuat) (IDR)', 0))
        
        for pid, data in shop_data.items():
            result['products'].append(data)
        
        result['products'].sort(key=lambda x: x['orders'], reverse=True)
        
    except Exception as e:
        result['success'] = False
        result['errors'].append(str(e))
    
    return result

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'errors': ['请提供文件路径']}))
    else:
        print(json.dumps(parse_shopee_excel(sys.argv[1]), ensure_ascii=False))
