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

def read_file(file_path):
    """智能读取文件，支持 CSV, XLS, XLSX"""
    filename = os.path.basename(file_path).lower()
    
    # CSV文件
    if filename.endswith('.csv'):
        # 尝试不同编码和跳过行数
        for skiprows in [7, 0, 1]:
            for encoding in ['utf-8', 'gbk', 'latin1', 'cp1252']:
                try:
                    df = pd.read_csv(file_path, skiprows=skiprows, encoding=encoding)
                    if len(df.columns) > 5 and len(df) > 0:
                        return df, 'csv'
                except:
                    continue
        raise Exception('CSV文件解析失败')
    
    # Excel文件
    elif filename.endswith('.xlsx'):
        df = pd.read_excel(file_path, engine='openpyxl')
        return df, 'xlsx'
    
    elif filename.endswith('.xls'):
        df = pd.read_excel(file_path, engine='xlrd')
        return df, 'xls'
    
    else:
        # 尝试自动检测
        try:
            df = pd.read_excel(file_path, engine='openpyxl')
            return df, 'xlsx'
        except:
            pass
        try:
            df = pd.read_excel(file_path, engine='xlrd')
            return df, 'xls'
        except:
            pass
        try:
            df = pd.read_csv(file_path, skiprows=7, encoding='utf-8')
            return df, 'csv'
        except:
            pass
        raise Exception('无法识别文件格式')

def detect_file_type(df):
    """根据列名判断是店铺数据还是广告数据"""
    columns = [str(c).lower() for c in df.columns]
    columns_str = ' '.join(columns)
    
    # 广告数据特征列
    ad_keywords = ['biaya', 'iklan', 'dilihat', 'omzet', 'efektifitas', 'konversi langsung']
    # 店铺数据特征列
    shop_keywords = ['pengunjung produk', 'halaman produk', 'dimasukkan ke keranjang', 'total pembeli']
    
    ad_score = sum(1 for k in ad_keywords if k in columns_str)
    shop_score = sum(1 for k in shop_keywords if k in columns_str)
    
    if ad_score > shop_score:
        return 'ad'
    else:
        return 'shop'

def parse_shop_data(df):
    """解析店铺数据"""
    products = []
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
        if data['visitors'] > 0:
            data['conversion_rate'] = round(data['orders'] / data['visitors'] * 100, 2)
        else:
            data['conversion_rate'] = 0
        products.append(data)
    
    products.sort(key=lambda x: x['orders'], reverse=True)
    return products

def parse_ad_data(df):
    """解析广告数据"""
    products = []
    
    for _, row in df.iterrows():
        pid = str(row.get('Kode Produk', '')).strip()
        if not pid or pid == 'nan' or pid == '':
            continue
        
        ad_spend = safe_int(row.get('Biaya', 0))
        ad_revenue = safe_int(row.get('Omzet Penjualan', 0))
        ad_impressions = safe_int(row.get('Dilihat', 0))
        ad_clicks = safe_int(row.get('Jumlah Klik', 0))
        ad_conversions = safe_int(row.get('Konversi', 0))
        
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

def parse_shopee_file(file_path):
    """主解析函数"""
    result = {'success': True, 'products': [], 'errors': [], 'file_type': ''}
    
    try:
        # 读取文件
        df, file_format = read_file(file_path)
        
        # 检测数据类型
        data_type = detect_file_type(df)
        result['file_type'] = data_type
        
        # 解析数据
        if data_type == 'ad':
            result['products'] = parse_ad_data(df)
        else:
            result['products'] = parse_shop_data(df)
            
        if len(result['products']) == 0:
            result['errors'].append('未解析到任何产品数据')
            
    except Exception as e:
        result['success'] = False
        result['errors'].append(str(e))
    
    return result

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'errors': ['请提供文件路径']}))
    else:
        result = parse_shopee_file(sys.argv[1])
        print(json.dumps(result, ensure_ascii=False))
