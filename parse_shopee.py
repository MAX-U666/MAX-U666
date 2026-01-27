#!/usr/bin/env python3
"""
Shopee 数据解析器 v2.0
支持：
- 店铺数据 (26列完整版)
- 广告数据 (CSV)
"""
import pandas as pd
import json
import sys
import os

def safe_int(val):
    """安全转换为整数"""
    if pd.isna(val) or val == '-' or val == '' or val is None:
        return 0
    try:
        s = str(val).replace(',', '').replace('.', '').replace('%', '').strip()
        if s == '' or s == '-':
            return 0
        return int(float(s))
    except:
        return 0

def safe_float(val):
    """安全转换为浮点数（处理百分比）"""
    if pd.isna(val) or val == '-' or val == '' or val is None:
        return 0.0
    try:
        s = str(val).replace('%', '').replace(',', '.').strip()
        if s == '' or s == '-':
            return 0.0
        return round(float(s), 2)
    except:
        return 0.0

def read_file(file_path):
    """智能读取文件，支持 CSV, XLS, XLSX"""
    filename = os.path.basename(file_path).lower()
    
    # CSV文件
    if filename.endswith('.csv'):
        for skiprows in [7, 0, 1, 6, 8]:
            for encoding in ['latin1', 'utf-8', 'utf-8-sig', 'gbk', 'cp1252', 'iso-8859-1']:
                try:
                    df = pd.read_csv(file_path, skiprows=skiprows, encoding=encoding)
                    if len(df.columns) > 5 and len(df) > 0:
                        if 'Kode Produk' in df.columns or 'Nama Iklan' in df.columns or 'Biaya' in df.columns:
                            return df, 'csv'
                except:
                    continue
        for encoding in ['latin1', 'utf-8', 'cp1252']:
            try:
                df = pd.read_csv(file_path, encoding=encoding)
                if len(df.columns) > 3:
                    return df, 'csv'
            except:
                continue
        raise Exception('CSV文件解析失败')
    
    # Excel文件
    elif filename.endswith('.xlsx'):
        try:
            df = pd.read_excel(file_path, engine='openpyxl')
            return df, 'xlsx'
        except:
            df = pd.read_excel(file_path)
            return df, 'xlsx'
    
    elif filename.endswith('.xls'):
        try:
            df = pd.read_excel(file_path, engine='xlrd')
            return df, 'xls'
        except:
            df = pd.read_excel(file_path)
            return df, 'xls'
    
    else:
        for reader in [
            lambda: pd.read_excel(file_path, engine='openpyxl'),
            lambda: pd.read_excel(file_path, engine='xlrd'),
            lambda: pd.read_excel(file_path),
            lambda: pd.read_csv(file_path, skiprows=7, encoding='latin1'),
            lambda: pd.read_csv(file_path, encoding='latin1'),
        ]:
            try:
                df = reader()
                if len(df.columns) > 3:
                    return df, 'auto'
            except:
                continue
        raise Exception('无法识别文件格式')

def detect_file_type(df):
    """根据列名判断是店铺数据还是广告数据"""
    columns = [str(c).lower() for c in df.columns]
    columns_str = ' '.join(columns)
    
    # 广告数据特征列
    ad_keywords = ['biaya', 'iklan', 'dilihat', 'omzet', 'efektifitas', 'konversi', 'nama iklan']
    # 店铺数据特征列
    shop_keywords = ['pengunjung produk', 'halaman produk', 'dimasukkan ke keranjang', 'total pembeli', 'pesanan dibuat']
    
    ad_score = sum(1 for k in ad_keywords if k in columns_str)
    shop_score = sum(1 for k in shop_keywords if k in columns_str)
    
    return 'ad' if ad_score > shop_score else 'shop'

def parse_shop_data_v2(df):
    """解析店铺数据 - 26列完整版"""
    products = []
    shop_data = {}
    
    for _, row in df.iterrows():
        # 获取产品ID
        pid = str(row.get('Kode Produk', '')).strip()
        if not pid or pid == 'nan' or pid == '':
            continue
        
        # 如果是新产品，初始化
        if pid not in shop_data:
            shop_data[pid] = {
                # === 基础信息 ===
                'product_id': pid,
                'product_name': str(row.get('Produk', ''))[:100],
                'product_status': str(row.get('Status Produk Saat Ini', '')),
                'parent_sku': str(row.get('SKU Induk', '')) if pd.notna(row.get('SKU Induk')) else '',
                
                # === 流量数据 ===
                'visitors': 0,              # 访客数
                'page_views': 0,            # 页面浏览
                'visitors_no_buy': 0,       # 看了没买的访客
                'visitors_no_buy_rate': 0,  # 没买比例
                'clicks': 0,                # 搜索点击
                'likes': 0,                 # 收藏
                
                # === 加购数据 ===
                'cart_visitors': 0,         # 加购访客数
                'add_to_cart': 0,           # 加购数
                'cart_rate': 0,             # 加购转化率
                
                # === 订单数据（已下单）===
                'orders_created': 0,        # 买家数(已下单)
                'items_created': 0,         # 产品件数(已下单)
                'revenue_created': 0,       # 销售额(已下单)
                'conversion_rate': 0,       # 下单转化率
                
                # === 订单数据（待发货）===
                'orders_ready': 0,          # 买家数(待发货)
                'items_ready': 0,           # 产品件数(待发货)
                'revenue_ready': 0,         # 销售额(待发货)
                'ready_rate': 0,            # 待发货转化率
                'ready_created_rate': 0,    # 发货/下单比
            }
        
        # 累加数据（处理多变体情况）
        data = shop_data[pid]
        
        # 流量数据
        data['visitors'] += safe_int(row.get('Pengunjung Produk (Kunjungan)', 0))
        data['page_views'] += safe_int(row.get('Halaman Produk Dilihat', 0))
        data['visitors_no_buy'] += safe_int(row.get('Pengunjung Melihat Tanpa Membeli', 0))
        data['clicks'] += safe_int(row.get('Klik Pencarian', 0))
        data['likes'] += safe_int(row.get('Suka', 0))
        
        # 加购数据
        data['cart_visitors'] += safe_int(row.get('Pengunjung Produk (Menambahkan Produk ke Keranjang)', 0))
        data['add_to_cart'] += safe_int(row.get('Dimasukkan ke Keranjang (Produk)', 0))
        
        # 订单数据（已下单）
        data['orders_created'] += safe_int(row.get('Total Pembeli (Pesanan Dibuat)', 0))
        data['items_created'] += safe_int(row.get('Produk (Pesanan Dibuat)', 0))
        data['revenue_created'] += safe_int(row.get('Total Penjualan (Pesanan Dibuat) (IDR)', 0))
        
        # 订单数据（待发货）
        data['orders_ready'] += safe_int(row.get('Total Pembeli (Pesanan Siap Dikirim)', 0))
        data['items_ready'] += safe_int(row.get('Produk (Pesanan Siap Dikirim)', 0))
        data['revenue_ready'] += safe_int(row.get('Penjualan (Pesanan Siap Dikirim) (IDR)', 0))
    
    # 计算比率字段
    for pid, data in shop_data.items():
        # 没买比例
        if data['visitors'] > 0:
            data['visitors_no_buy_rate'] = round(data['visitors_no_buy'] / data['visitors'] * 100, 2)
        
        # 加购转化率
        if data['visitors'] > 0:
            data['cart_rate'] = round(data['cart_visitors'] / data['visitors'] * 100, 2)
        
        # 下单转化率
        if data['visitors'] > 0:
            data['conversion_rate'] = round(data['orders_created'] / data['visitors'] * 100, 2)
        
        # 待发货转化率
        if data['visitors'] > 0:
            data['ready_rate'] = round(data['orders_ready'] / data['visitors'] * 100, 2)
        
        # 发货/下单比
        if data['orders_created'] > 0:
            data['ready_created_rate'] = round(data['orders_ready'] / data['orders_created'] * 100, 2)
        
        products.append(data)
    
    # 按订单数排序
    products.sort(key=lambda x: x['orders_created'], reverse=True)
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
            'product_name': str(row.get('Nama Iklan', ''))[:100],
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
    result = {
        'success': True, 
        'products': [], 
        'errors': [], 
        'file_type': '',
        'total_count': 0
    }
    
    try:
        df, file_format = read_file(file_path)
        data_type = detect_file_type(df)
        result['file_type'] = data_type
        result['file_format'] = file_format
        result['columns_count'] = len(df.columns)
        
        if data_type == 'ad':
            result['products'] = parse_ad_data(df)
        else:
            result['products'] = parse_shop_data_v2(df)
        
        result['total_count'] = len(result['products'])
            
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
