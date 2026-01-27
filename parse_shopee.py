#!/usr/bin/env python3
import pandas as pd
import json
import sys
import os

def parse_shopee_excel(file_path):
    result = {'success': True, 'products': [], 'errors': [], 'file_type': ''}
    
    try:
        filename = os.path.basename(file_path).lower()
        
        # 判断文件类型
        if filename.endswith('.csv') or 'iklan' in filename or 'data_keseluruhan' in filename:
            # 广告数据CSV
            result['file_type'] = 'ad'
            result['products'] = parse_ad_csv(file_path)
        else:
            # 店铺数据Excel
            result['file_type'] = 'shop'
            result['products'] = parse_shop_excel(file_path)
            
    except Exception as e:
        result['success'] = False
        result['errors'].append(str(e))
    
    return result

def parse_shop_excel(file_path):
    """解析店铺数据Excel"""
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
        products.append(data)
    
    products.sort(key=lambda x: x['orders'], reverse=True)
    return products

def parse_ad_csv(file_path):
    """解析广告数据CSV"""
    products = []
    
    # 跳过前7行头部信息
    df = pd.read_csv(file_path, skiprows=7, encoding='utf-8')
    
    for _, row in df.iterrows():
        pid = str(row.get('Kode Produk', '')).strip()
        if not pid or pid == 'nan' or pid == '':
            continue
        
        products.append({
            'product_id': pid,
            'product_name': str(row.get('Nama Iklan', ''))[:80],
            'ad_impressions': safe_int(row.get('Dilihat', 0)),
            'ad_clicks': safe_int(row.get('Jumlah Klik', 0)),
            'ad_ctr': safe_float(row.get('Persentase Klik', 0)),
            'ad_conversions': safe_int(row.get('Konversi', 0)),
            'ad_cvr': safe_float(row.get('Tingkat konversi', 0)),
            'ad_spend': safe_int(row.get('Biaya', 0)),
            'ad_revenue': safe_int(row.get('Omzet Penjualan', 0)),
            'ad_roi': safe_float(row.get('Efektifitas Iklan', 0))
        })
    
    products.sort(key=lambda x: x['ad_spend'], reverse=True)
    return products

def safe_int(val):
    if pd.isna(val) or val == '-' or val == '':
        return 0
    try:
        return int(float(str(val).replace(',', '').replace('.', '')))
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

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'errors': ['请提供文件路径']}))
    else:
        print(json.dumps(parse_shopee_excel(sys.argv[1]), ensure_ascii=False))
