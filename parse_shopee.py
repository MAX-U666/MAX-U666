#!/usr/bin/env python3
import pandas as pd
import json
import sys

def parse_shopee_excel(file_path):
    result = {'success': True, 'products': [], 'errors': []}
    try:
        xl = pd.ExcelFile(file_path)
        shop_data = {}
        if '店铺数据' in xl.sheet_names:
            df_shop = pd.read_excel(file_path, sheet_name='店铺数据')
            for _, row in df_shop.iterrows():
                pid = str(row.get('Kode Produk', '')).strip()
                if not pid or pid == 'nan': continue
                if pid not in shop_data:
                    shop_data[pid] = {'product_id': pid, 'product_name': str(row.get('Produk', ''))[:50], 'visitors': 0, 'clicks': 0, 'add_to_cart': 0, 'orders': 0, 'revenue': 0}
                def safe_int(val):
                    if pd.isna(val) or val == '-': return 0
                    try: return int(float(str(val).replace(',', '').replace('.', '')))
                    except: return 0
                shop_data[pid]['visitors'] += safe_int(row.get('Pengunjung Produk (Kunjungan)', 0))
                shop_data[pid]['clicks'] += safe_int(row.get('Klik Pencarian', 0))
                shop_data[pid]['add_to_cart'] += safe_int(row.get('Dimasukkan ke Keranjang (Produk)', 0))
                shop_data[pid]['orders'] += safe_int(row.get('Total Pembeli (Pesanan Dibuat)', 0))
        ad_data = {}
        if '广告数据' in xl.sheet_names:
            df_ad = pd.read_excel(file_path, sheet_name='广告数据')
            for _, row in df_ad.iterrows():
                pid = str(row.get('Kode Produk', '')).strip()
                if not pid or pid == 'nan': continue
                def safe_int(val):
                    if pd.isna(val) or val == '-': return 0
                    try: return int(float(str(val).replace(',', '')))
                    except: return 0
                def safe_float(val):
                    if pd.isna(val) or val == '-': return 0.0
                    try: return float(str(val).replace(',', '.'))
                    except: return 0.0
                ad_data[pid] = {'product_id': pid, 'ad_name': str(row.get('Nama Iklan', ''))[:50], 'ad_impressions': safe_int(row.get('Dilihat', 0)), 'ad_clicks': safe_int(row.get('Jumlah Klik', 0)), 'ad_ctr': safe_float(row.get('Persentase Klik', 0)) * 100, 'ad_conversions': safe_int(row.get('Konversi', 0)), 'ad_cvr': safe_float(row.get('Tingkat konversi', 0)) * 100, 'ad_spend': safe_int(row.get('Biaya', 0)), 'ad_revenue': safe_int(row.get('Omzet Penjualan', 0)), 'ad_roi': safe_float(row.get('Efektifitas Iklan', 0))}
        all_pids = set(list(shop_data.keys()) + list(ad_data.keys()))
        for pid in all_pids:
            product = {'product_id': pid, 'product_name': '', 'visitors': 0, 'clicks': 0, 'add_to_cart': 0, 'orders': 0, 'ad_impressions': 0, 'ad_clicks': 0, 'ad_conversions': 0, 'ad_spend': 0, 'ad_revenue': 0, 'ad_roi': 0}
            if pid in shop_data: product.update(shop_data[pid])
            if pid in ad_data: product.update(ad_data[pid])
            result['products'].append(product)
        result['products'].sort(key=lambda x: x['ad_spend'], reverse=True)
    except Exception as e:
        result['success'] = False
        result['errors'].append(str(e))
    return result

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'errors': ['请提供文件路径']}))
    else:
        print(json.dumps(parse_shopee_excel(sys.argv[1]), ensure_ascii=False))
