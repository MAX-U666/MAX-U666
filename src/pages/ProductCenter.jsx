import React, { useState, useEffect, useCallback } from 'react';

// ========== API ==========
const fetchProducts = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/easyboss/products/list?${query}`);
  return res.json();
};

const fetchStats = async () => {
  const res = await fetch('/api/easyboss/products/stats');
  return res.json();
};

const fetchProductDetail = async (itemId) => {
  const res = await fetch(`/api/easyboss/products/${itemId}`);
  return res.json();
};

const triggerFetch = async (status = '', matchAds = true) => {
  const res = await fetch('/api/easyboss/products/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, matchAds }),
  });
  return res.json();
};

// ========== 格式化工具 ==========
const formatIDR = (amount) => {
  if (!amount && amount !== 0) return '-';
  const num = parseFloat(amount);
  if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `Rp ${(num / 1e3).toFixed(0)}K`;
  return `Rp ${num.toLocaleString('id-ID')}`;
};

const formatNum = (n) => {
  if (!n && n !== 0) return '-';
  const num = parseInt(n);
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
};

// ========== 状态配置 ==========
const STATUS_MAP = {
  onsale: { label: '在售', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  soldout: { label: '售罄', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  delisted: { label: '下架', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  banned: { label: '禁售', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};
const getStatusInfo = (s) => STATUS_MAP[s] || { label: s || '-', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' };

// ========== 统计卡片 ==========
const StatCard = ({ icon, label, value, sub, color }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E8E8ED',
    borderRadius: '14px',
    padding: '20px',
    flex: 1,
    minWidth: '160px',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: '-10px', right: '-10px',
      width: '60px', height: '60px', borderRadius: '50%',
      background: `${color}10`, filter: 'blur(15px)',
    }} />
    <div style={{ fontSize: '20px', marginBottom: '10px' }}>{icon}</div>
    <div style={{ fontSize: '11px', color: '#999', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
      {label}
    </div>
    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.5px' }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{sub}</div>}
  </div>
);

// ========== 店铺商品分布 ==========
const ShopBar = ({ shops }) => {
  if (!shops || shops.length === 0) return null;
  const maxSold = Math.max(...shops.map(s => parseInt(s.sold) || 0), 1);

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E8ED',
      borderRadius: '14px', padding: '20px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>
        📊 店铺商品 & 销量
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {shops.slice(0, 12).map((shop) => (
          <div key={shop.shop_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '60px', fontSize: '11px', color: '#666', textAlign: 'right', flexShrink: 0 }}>
              {shop.shop_name || shop.shop_id}
            </div>
            <div style={{ flex: 1, height: '22px', background: '#FFFFFF', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${((parseInt(shop.sold) || 0) / maxSold) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                borderRadius: '4px',
                minWidth: '30px',
                display: 'flex', alignItems: 'center', paddingLeft: '8px',
              }}>
                <span style={{ fontSize: '10px', color: '#fff', fontWeight: '600' }}>
                  {formatNum(shop.sold)}
                </span>
              </div>
            </div>
            <div style={{ width: '50px', fontSize: '10px', color: '#999', textAlign: 'right', flexShrink: 0 }}>
              {shop.products}品
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== 商品详情弹窗 ==========
const ProductDetail = ({ product, ads, orderStats, recentOrders, onClose }) => {
  if (!product) return null;
  const si = getStatusInfo(product.status);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '700px',
        maxHeight: '80vh', overflow: 'auto', padding: '28px',
        border: '1px solid #E8E8ED',
      }} onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          {product.pic_url && (
            <img src={product.pic_url} alt="" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a', lineHeight: 1.4, marginBottom: '8px' }}>
              {product.title}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: si.bg, color: si.color }}>{si.label}</span>
              <span style={{ fontSize: '12px', color: '#666' }}>ID: {product.platform_item_id}</span>
              <span style={{ fontSize: '12px', color: '#666' }}>店铺: {product.shop_name || product.shop_id}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', fontSize: '24px', cursor: 'pointer', padding: '0 4px' }}>×</button>
        </div>

        {/* 数据网格 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: '售价', value: formatIDR(product.sale_price) },
            { label: '库存', value: formatNum(product.stock) },
            { label: '销量', value: formatNum(product.sell_cnt) },
            { label: '评分', value: product.rating_star ? `⭐ ${product.rating_star}` : '-' },
            { label: '收藏', value: formatNum(product.fav_cnt) },
            { label: '评论', value: formatNum(product.cmt_cnt) },
            { label: '浏览', value: formatNum(product.pv) },
            { label: 'SKU', value: product.sku_count },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#FFFFFF', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* 关联广告 */}
        {ads && ads.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '12px' }}>📢 关联广告 ({ads.length})</div>
            {ads.map(ad => (
              <div key={ad.platform_campaign_id} style={{
                background: '#FFFFFF', borderRadius: '10px', padding: '12px', marginBottom: '8px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#333', marginBottom: '4px' }}>{ad.ad_name?.substring(0, 50)}...</div>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    花费: {formatIDR(ad.expense)} | ROI: {ad.broad_roi || '-'} | 订单: {ad.broad_order || 0}
                  </div>
                </div>
                <span style={{
                  padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600',
                  background: ad.campaign_status === 'ongoing' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                  color: ad.campaign_status === 'ongoing' ? '#10B981' : '#6B7280',
                }}>{ad.campaign_status}</span>
              </div>
            ))}
          </div>
        )}

        {/* 订单统计 */}
        {orderStats && (
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1, background: 'rgba(59,130,246,0.1)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#3B82F6', marginBottom: '4px' }}>订单数</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#3B82F6' }}>{orderStats.order_count || 0}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(16,185,129,0.1)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#10B981', marginBottom: '4px' }}>订单GMV</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#10B981' }}>{formatIDR(orderStats.total_gmv)}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(245,158,11,0.1)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#F59E0B', marginBottom: '4px' }}>售出件数</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#F59E0B' }}>{orderStats.total_qty || 0}</div>
            </div>
          </div>
        )}

        {/* 最近订单 */}
        {recentOrders && recentOrders.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '12px' }}>🛒 最近订单 ({recentOrders.length})</div>
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {recentOrders.map((o, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderBottom: '1px solid #F0F0F3',
                  fontSize: '12px',
                }}>
                  <div>
                    <span style={{ color: '#333' }}>{o.platform_order_sn}</span>
                    <span style={{ color: '#999', marginLeft: '8px' }}>{o.shop_name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#666' }}>×{o.quantity}</span>
                    <span style={{ color: '#10B981', fontWeight: '500' }}>{formatIDR(o.discounted_price)}</span>
                    <span style={{ color: '#999', fontSize: '11px' }}>{o.gmt_order_start?.substring(5, 16)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 链接 */}
        {product.item_url && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <a href={product.item_url} target="_blank" rel="noreferrer"
              style={{ fontSize: '12px', color: '#FF6B35', textDecoration: 'none' }}>
              🔗 在Shopee查看
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// ========== 主组件 ==========
const ProductCenter = () => {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [shopFilter, setShopFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('sell');
  const [detail, setDetail] = useState(null);

  const pageSize = 30;

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchStats();
      if (data.success) setStats(data);
    } catch (e) { console.error(e); }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize, sortBy };
      if (keyword) params.keyword = keyword;
      if (shopFilter) params.shopId = shopFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await fetchProducts(params);
      if (data.success) {
        setProducts(data.products);
        setTotal(data.total);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, keyword, shopFilter, statusFilter, sortBy]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleFetch = async () => {
    setFetching(true);
    try {
      const result = await triggerFetch('', true);
      if (result.success) {
        alert(`✅ 拉取完成！商品: ${result.productsFetched}, 广告匹配: ${result.adsMatched}, 耗时: ${result.duration}`);
        loadStats();
        loadProducts();
      } else {
        alert('❌ 拉取失败: ' + result.error);
      }
    } catch (e) { alert('❌ 错误: ' + e.message); }
    setFetching(false);
  };

  const handleDetail = async (itemId) => {
    try {
      const data = await fetchProductDetail(itemId);
      if (data.success) setDetail(data);
    } catch (e) { console.error(e); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: 0, letterSpacing: '-0.5px' }}>
            🏪 商品中心
          </h2>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            EasyBoss 全店铺商品数据 · 广告关联匹配
          </div>
        </div>
        <button
          onClick={handleFetch}
          disabled={fetching}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: fetching ? 'wait' : 'pointer',
            background: fetching ? '#334155' : 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
            color: '#fff', fontSize: '13px', fontWeight: '600',
          }}
        >
          {fetching ? '⏳ 拉取中...' : '🔄 同步商品数据'}
        </button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <StatCard icon="📦" label="全部商品" value={formatNum(stats.total_products)} color="#3B82F6" />
          <StatCard icon="✅" label="在售" value={formatNum(stats.onsale)} color="#10B981" />
          <StatCard icon="🛒" label="总销量" value={formatNum(stats.total_sold)} color="#F59E0B" />
          <StatCard icon="📊" label="总库存" value={formatNum(stats.total_stock)} color="#8B5CF6" />
          <StatCard icon="🔗" label="广告匹配" value={`${stats.adMatched}/${stats.adTotal}`} sub={stats.adMatchRate} color="#FF6B35" />
        </div>
      )}

      {/* 店铺分布 */}
      {stats?.byShop && <ShopBar shops={stats.byShop} />}

      {/* 筛选栏 */}
      <div style={{
        display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          placeholder="🔍 搜索商品标题..."
          value={keyword}
          onChange={e => { setKeyword(e.target.value); setPage(1); }}
          style={{
            flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '10px',
            border: '1px solid #E8E8ED', background: '#FFFFFF',
            color: '#1a1a1a', fontSize: '13px', outline: 'none',
          }}
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: '10px 14px', borderRadius: '10px',
            border: '1px solid #E8E8ED', background: '#FFFFFF',
            color: '#1a1a1a', fontSize: '13px', outline: 'none',
          }}
        >
          <option value="">全部状态</option>
          <option value="onsale">在售</option>
          <option value="soldout">售罄</option>
          <option value="delisted">下架</option>
        </select>
        <select
          value={sortBy}
          onChange={e => { setSortBy(e.target.value); setPage(1); }}
          style={{
            padding: '10px 14px', borderRadius: '10px',
            border: '1px solid #E8E8ED', background: '#FFFFFF',
            color: '#1a1a1a', fontSize: '13px', outline: 'none',
          }}
        >
          <option value="sell">按销量</option>
          <option value="stock">按库存</option>
          <option value="price">按价格</option>
          <option value="rating">按评分</option>
        </select>
        {stats?.byShop && (
          <select
            value={shopFilter}
            onChange={e => { setShopFilter(e.target.value); setPage(1); }}
            style={{
              padding: '10px 14px', borderRadius: '10px',
              border: '1px solid #E8E8ED', background: '#FFFFFF',
              color: '#1a1a1a', fontSize: '13px', outline: 'none', maxWidth: '160px',
            }}
          >
            <option value="">全部店铺</option>
            {stats.byShop.map(s => (
              <option key={s.shop_id} value={s.shop_id}>{s.shop_name || s.shop_id} ({s.products})</option>
            ))}
          </select>
        )}
      </div>

      {/* 商品列表 */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E8E8ED',
        borderRadius: '14px',
        overflow: 'hidden',
      }}>
        {/* 表头 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 100px 80px 80px 80px 70px 70px 60px',
          padding: '12px 16px',
          background: '#FAFBFC',
          borderBottom: '1px solid #E8E8ED',
          fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase',
        }}>
          <div>商品</div>
          <div style={{ textAlign: 'right' }}>售价</div>
          <div style={{ textAlign: 'right' }}>销量</div>
          <div style={{ textAlign: 'right' }}>库存</div>
          <div style={{ textAlign: 'right' }}>收藏</div>
          <div style={{ textAlign: 'right' }}>评分</div>
          <div style={{ textAlign: 'center' }}>状态</div>
          <div style={{ textAlign: 'center' }}>详情</div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#999' }}>加载中...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#999' }}>暂无数据</div>
        ) : (
          products.map((p) => {
            const si = getStatusInfo(p.status);
            return (
              <div key={p.platform_item_id + p.shop_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 100px 80px 80px 80px 70px 70px 60px',
                  padding: '12px 16px',
                  borderBottom: '1px solid #F0F0F3',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => handleDetail(p.platform_item_id)}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', overflow: 'hidden' }}>
                  {p.pic_url && (
                    <img src={p.pic_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '12px', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                      {p.shop_name || p.shop_id} · {p.brand_name || '-'} · SKU {p.sku_count}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#1a1a1a', fontWeight: '500' }}>
                  {formatIDR(p.sale_price || p.original_price)}
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#1a1a1a', fontWeight: '600' }}>
                  {formatNum(p.sell_cnt)}
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: p.stock < 10 ? '#EF4444' : '#F8FAFC' }}>
                  {formatNum(p.stock)}
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                  {formatNum(p.fav_cnt)}
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#F59E0B' }}>
                  {p.rating_star ? `⭐${p.rating_star}` : '-'}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', background: si.bg, color: si.color }}>
                    {si.label}
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDetail(p.platform_item_id); }}
                    style={{ background: 'rgba(59,130,246,0.15)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: '#3B82F6', fontSize: '11px', cursor: 'pointer' }}
                  >
                    查看
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', alignItems: 'center' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #E8E8ED', background: '#FFFFFF', color: '#333', fontSize: '12px', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.3 : 1 }}
          >
            ‹ 上一页
          </button>
          <span style={{ fontSize: '12px', color: '#666', padding: '0 8px' }}>
            {page} / {totalPages}  (共{total}条)
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #E8E8ED', background: '#FFFFFF', color: '#333', fontSize: '12px', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.3 : 1 }}
          >
            下一页 ›
          </button>
        </div>
      )}

      {/* 详情弹窗 */}
      {detail && (
        <ProductDetail
          product={detail.product}
          ads={detail.ads}
          orderStats={detail.orderStats}
          recentOrders={detail.recentOrders}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
};

export default ProductCenter;
