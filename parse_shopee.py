#!/usr/bin/env python3
import pandas as pd
import json
import sys
import os

def safe_int(val):
    if pd.isna(val) or val == '-' or val == '':
        return 0
    try:
        s = str(val).replace(',', '').replace('.', '').replace('%', '')
        return int(float(s))
    except:
        return 0

def safe_float(val):
    if pd.isna(val) or val == '-' or val == '':
        return 0.0
    try:
        s = str(val).replace('%', '').replace(',', '.')
        return float(s)
    except:
        return 0.0

def parse_shopee_excel(file_path):
    result = {'success': True, 'products': [], 'errors': [], 'file_type': ''}
    
    try:
        filename = os.path.basename(file_path).lower()
        
        if filename.endswith('.csv'):
            result['file_type'] = 'ad'
            result['products'] = parse_ad_csv(file_path)
        else:
            result['file_type'] = 'shop'
            result['products'] = parse_shop_excel(file_path)
            
    except Exception as e:
        result['success'] = False
        result['errors'].append(str(e))
    
    return result

def parse_shop_excel(file_path):
    products = []
    df = pd.read_excel(file_path)
    shop_data = {}
    
    for _, row in df.iterrows():
        pid = str(row.get('Kode Produk', '')).strip()
        if not pid or pid == 'nan' or pid == '':
            continue
        
        if pid not in shop_data:
            shop_data[pid] = {
                'product_id': pid,
                'product_name': str(row.get('Produk', ''))[:80],
                'visitors': 0,
                'page_views': 0,
                'clicks': 0,
                'add_to_cart': 0,
                'likes': 0,
                'orders': 0,
                'revenue': 0
            }
        
        shop_data[pid]['visitors'] += safe_int(row.get('Pengunjung Produk (Kunjungan)', 0))
        shop_data[pid]['page_views'] += safe_int(row.get('Halaman Produk Dilihat', 0))
        shop_data[pid]['clicks'] += safe_int(row.get('Klik Pencarian', 0))
        shop_data[pid]['add_to_cart'] += safe_int(row.get('Dimasukkan ke Keranjang (Produk)', 0))
        shop_data[pid]['likes'] += safe_int(row.get('Suka', 0))
        shop_data[pid]['orders'] += safe_int(row.get('Total Pembeli (Pesanan Dibuat)', 0))
        shop_data[pid]['revenue'] += safe_int(row.get('Total Penjualan (Pesanan Dibuat) (IDR)', 0))
    
    for pid, data in shop_data.items():
        # 计算转化率
        if data['visitors'] > 0:
            data['conversion_rate'] = round(data['orders'] / data['visitors'] * 100, 2)
        else:
            data['conversion_rate'] = 0
        # 计算加购率
        if data['visitors'] > 0:
            data['atc_rate'] = round(data['add_to_cart'] / data['visitors'] * 100, 2)
        else:
            data['atc_rate'] = 0
        products.append(data)
    
    products.sort(key=lambda x: x['orders'], reverse=True)
    return products

def parse_ad_csv(file_path):
    products = []
    
    # 跳过前7行头部信息，第8行是列名
    df = pd.read_csv(file_path, skiprows=7, encoding='utf-8')
    
    for _, row in df.iterrows():
        pid = str(row.get('Kode Produk', '')).strip()
        if not pid or pid == 'nan' or pid == '':
            continue
        
        ad_spend = safe_int(row.get('Biaya', 0))
        ad_revenue = safe_int(row.get('Omzet Penjualan', 0))
        ad_impressions = safe_int(row.get('Dilihat', 0))
        ad_clicks = safe_int(row.get('Jumlah Klik', 0))
        ad_conversions = safe_int(row.get('Konversi', 0))
        
        # 计算CTR和CVR
        ad_ctr = round(ad_clicks / ad_impressions * 100, 2) if ad_impressions > 0 else 0
        ad_cvr = round(ad_conversions / ad_clicks * 100, 2) if ad_clicks > 0 else 0
        ad_roi = round(ad_revenue / ad_spend, 2) if ad_spend > 0 else 0
        
        products.append({
            'product_id': pid,
            'product_name': str(row.get('Nama Iklan', ''))[:80],
            'ad_impressions': ad_impressions,
            'ad_clicks': ad_clicks,
            'ad_ctr': ad_ctr,
            'ad_conversions': ad_conversions,
            'ad_cvr': ad_cvr,
            'ad_spend': ad_spend,
            'ad_revenue': ad_revenue,
            'ad_roi': ad_roi
        })
    
    products.sort(key=lambda x: x['ad_spend'], reverse=True)
    return products

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'errors': ['请提供文件路径']}))
    else:
        print(json.dumps(parse_shopee_excel(sys.argv[1]), ensure_ascii=False))
