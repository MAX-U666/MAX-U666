import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../utils/apiFetch';

// ========== API ==========
const fetchOrders = async (params = {}) => apiGet('/api/easyboss/orders/list', params);
const fetchStats = async (params = {}) => apiGet('/api/easyboss/orders/stats', params);
const fetchLogs = async () => apiGet('/api/easyboss/orders/logs');
const triggerFetch = async (days = 1) => apiPost('/api/easyboss/orders/fetch', { days });

// ========== 格式化工具 ==========
const formatIDR = (amount) => {
  if (!amount && amount !== 0) return '-';
  const num = parseFloat(amount);
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return num.toLocaleString('id-ID');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// ========== 日期工具 ==========
const getDateStr = (daysAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const DATE_PRESETS = [
  { label: '今天', from: () => getDateStr(0), to: () => getDateStr(0) },
  { label: '近3天', from: () => getDateStr(2), to: () => getDateStr(0) },
  { label: '近7天', from: () => getDateStr(6), to: () => getDateStr(0) },
  { label: '近30天', from: () => getDateStr(29), to: () => getDateStr(0) },
];

// ========== 状态配置 ==========
const STATUS_MAP = {
  waitProcess: { label: '待处理', color: '#F59E0B', icon: '⏳' },
  waitShip: { label: '待发货', color: '#3B82F6', icon: '📦' },
  submitPlatform: { label: '已提交', color: '#8B5CF6', icon: '📤' },
  waitReceiverConfirm: { label: '待收货', color: '#10B981', icon: '🚚' },
  closed: { label: '已关闭', color: '#EF4444', icon: '❌' },
  unpaid: { label: '未付款', color: '#6B7280', icon: '💳' },
  finished: { label: '已完成', color: '#059669', icon: '✅' },
};

const getStatusInfo = (status) => STATUS_MAP[status] || { label: status, color: '#6B7280', icon: '•' };

// ========== 统计卡片 ==========
const StatCard = ({ icon, label, value, sub, color }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E8E8ED',
    borderRadius: '14px',
    padding: '20px',
    flex: 1,
    minWidth: '180px',
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
    {sub && (
      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{sub}</div>
    )}
  </div>
);

// ========== 店铺柱状图 ==========
const ShopBar = ({ shops }) => {
  if (!shops || shops.length === 0) return null;
  const maxCount = Math.max(...shops.map(s => s.count || s.orders || 0));

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E8ED',
      borderRadius: '14px',
      padding: '20px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>
        📊 店铺订单分布
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {shops.slice(0, 10).map((shop) => {
          const count = shop.count || shop.orders || 0;
          return (
            <div key={shop.shop_name || shop.shop_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '80px', fontSize: '11px', color: '#666',
                textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
                textAlign: 'right', flexShrink: 0,
              }}>
                {shop.shop_name || shop.platform_shop_name || shop.shop_id}
              </div>
              <div style={{ flex: 1, height: '22px', background: '#FFFFFF', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #FF6B35 0%, #F7931E 100%)',
                  borderRadius: '4px',
                  transition: 'width 0.6s ease',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '8px',
                  minWidth: count > 0 ? '30px' : '0',
                }}>
                  <span style={{ fontSize: '10px', color: '#fff', fontWeight: '600' }}>
                    {count}
                  </span>
                </div>
              </div>
              <div style={{ width: '70px', fontSize: '10px', color: '#999', textAlign: 'right', flexShrink: 0 }}>
                {formatIDR(shop.total_pay || shop.gmv)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ========== 状态分布 ==========
const StatusBreakdown = ({ statusData }) => {
  if (!statusData || statusData.length === 0) return null;
  const total = statusData.reduce((sum, s) => sum + s.count, 0);

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E8ED',
      borderRadius: '14px',
      padding: '20px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>
        📋 订单状态
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {statusData.map((item) => {
          const info = getStatusInfo(item.status);
          const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : 0;
          return (
            <div key={item.status} style={{
              background: `${info.color}12`,
              border: `1px solid ${info.color}30`,
              borderRadius: '10px',
              padding: '12px 16px',
              minWidth: '120px',
              flex: '1 0 auto',
            }}>
              <div style={{ fontSize: '11px', color: info.color, marginBottom: '4px' }}>
                {info.icon} {info.label}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>
                {item.count}
              </div>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ========== 订单表格 ==========
const OrderTable = ({ orders, loading, page, totalPages, onPageChange }) => {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E8ED',
      borderRadius: '14px',
      overflow: 'hidden',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E8E8ED' }}>
              {['包裹ID', '平台单号', '店铺', '状态', '商品数', '付款金额', '利润', '买家', '下单时间'].map((h) => (
                <th key={h} style={{
                  padding: '12px 14px', textAlign: 'left',
                  color: '#999', fontWeight: '500', fontSize: '11px',
                  letterSpacing: '0.3px', whiteSpace: 'nowrap',
                  background: 'rgba(0,0,0,0.15)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid rgba(255,107,53,0.2)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <div style={{ marginTop: '8px' }}>加载中...</div>
                </td>
              </tr>
            ) : !orders || orders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  暂无订单数据
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => {
                const info = getStatusInfo(order.app_package_tab);
                return (
                  <tr key={order.op_order_package_id || idx} style={{
                    borderBottom: '1px solid #F0F0F3',
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F7'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 14px', color: '#555', fontFamily: 'monospace', fontSize: '11px' }}>
                      {order.op_order_package_id}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#666', fontSize: '11px' }}>
                      {order.platform_order_sn || '-'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#333', fontWeight: '500' }}>
                      {order.shop_name || '-'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: '600',
                        background: `${info.color}18`,
                        color: info.color,
                        border: `1px solid ${info.color}30`,
                      }}>
                        {info.icon} {info.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#666', textAlign: 'center' }}>
                      {order.item_quantity || 0}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#1a1a1a', fontWeight: '600', fontFamily: 'monospace' }}>
                      {formatIDR(order.pay_amount)}
                    </td>
                    <td style={{
                      padding: '10px 14px', fontWeight: '600', fontFamily: 'monospace',
                      color: parseFloat(order.order_profit) > 0 ? '#10B981' : parseFloat(order.order_profit) < 0 ? '#EF4444' : '#64748B',
                    }}>
                      {parseFloat(order.order_profit) > 0 ? '+' : ''}{formatIDR(order.order_profit)}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#666', fontSize: '11px' }}>
                      {order.buyer_username || '-'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#999', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {formatDate(order.gmt_order_start)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
          padding: '14px', borderTop: '1px solid #F0F0F3',
        }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            style={{
              padding: '6px 14px', borderRadius: '6px', border: 'none',
              background: page <= 1 ? '#E8E8ED' : '#F5F5F7',
              color: page <= 1 ? '#CBD5E1' : '#475569',
              fontSize: '12px', cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← 上一页
          </button>
          <span style={{ fontSize: '12px', color: '#999', padding: '0 8px' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            style={{
              padding: '6px 14px', borderRadius: '6px', border: 'none',
              background: page >= totalPages ? '#E8E8ED' : '#F5F5F7',
              color: page >= totalPages ? '#CBD5E1' : '#475569',
              fontSize: '12px', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            下一页 →
          </button>
        </div>
      )}
    </div>
  );
};

// ========== 快捷日期按钮样式 ==========
const presetBtnStyle = (active) => ({
  padding: '5px 12px',
  borderRadius: '6px',
  border: active ? '1px solid #FF6B35' : '1px solid #E0E0E5',
  background: active ? 'rgba(255,107,53,0.1)' : '#FFFFFF',
  color: active ? '#FF6B35' : '#666',
  fontSize: '11px',
  fontWeight: active ? '600' : '400',
  cursor: 'pointer',
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
});

// ========== 主页面 ==========
const OrderCenter = () => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [filterShop, setFilterShop] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [keyword, setKeyword] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState(null);
  const [fetchDays, setFetchDays] = useState(1);
  const [activePreset, setActivePreset] = useState(-1);
  const pageSize = 50;

  // 加载统计（跟随筛选联动）
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const params = {};
      if (filterShop) params.shopId = filterShop;
      if (filterDateFrom) params.dateFrom = filterDateFrom + ' 00:00:00';
      if (filterDateTo) params.dateTo = filterDateTo + ' 23:59:59';
      const data = await fetchStats(params);
      if (data.success) setStats(data);
    } catch (e) {
      console.error('统计加载失败:', e);
    } finally {
      setStatsLoading(false);
    }
  }, [filterShop, filterDateFrom, filterDateTo]);

  // 加载订单列表
  const loadOrders = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize };
      if (filterShop) params.shop = filterShop;
      if (filterStatus) params.status = filterStatus;
      if (filterDateFrom) params.dateFrom = filterDateFrom + ' 00:00:00';
      if (filterDateTo) params.dateTo = filterDateTo + ' 23:59:59';
      if (keyword) params.keyword = keyword;
      const data = await fetchOrders(params);
      if (data.success) {
        setOrders(data.orders || data.data || []);
        const total = data.total || data.pagination?.total || 0;
        setTotalOrders(total);
        setTotalPages(data.pagination?.totalPages || Math.ceil(total / pageSize));
        setPage(p);
      }
    } catch (e) {
      console.error('订单加载失败:', e);
    } finally {
      setLoading(false);
    }
  }, [filterShop, filterStatus, filterDateFrom, filterDateTo, keyword]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadOrders(1); }, [loadOrders]);

  // 快捷日期选择
  const handlePreset = (idx) => {
    if (activePreset === idx) {
      // 取消选中
      setActivePreset(-1);
      setFilterDateFrom('');
      setFilterDateTo('');
    } else {
      setActivePreset(idx);
      setFilterDateFrom(DATE_PRESETS[idx].from());
      setFilterDateTo(DATE_PRESETS[idx].to());
    }
  };

  // 手动选日期时清除预设高亮
  const handleDateFromChange = (val) => {
    setFilterDateFrom(val);
    setActivePreset(-1);
  };
  const handleDateToChange = (val) => {
    setFilterDateTo(val);
    setActivePreset(-1);
  };

  // 重置筛选
  const handleReset = () => {
    setFilterShop('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setKeyword('');
    setActivePreset(-1);
  };

  const hasFilters = filterShop || filterStatus || filterDateFrom || filterDateTo || keyword;

  // 拉取数据
  const handleFetch = async () => {
    setFetching(true);
    setFetchResult(null);
    try {
      const result = await triggerFetch(fetchDays);
      setFetchResult(result);
      if (result.success) {
        loadStats();
        loadOrders(1);
      }
    } catch (e) {
      setFetchResult({ success: false, error: e.message });
    } finally {
      setFetching(false);
    }
  };

  const shopList = stats?.shops || stats?.byShop || [];
  const statusList = stats?.statusBreakdown || [];

  return (
    <div>
      {/* 页面标题 + 操作区 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.3px' }}>
            📦 订单中心
          </h2>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            共 {totalOrders.toLocaleString()} 条订单
            {(filterDateFrom || filterDateTo) && (
              <span style={{ color: '#FF6B35', marginLeft: '8px' }}>
                📅 {filterDateFrom || '...'} ~ {filterDateTo || '...'}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleFetch}
            disabled={fetching}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: fetching ? '#475569' : 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
              color: '#fff', fontSize: '12px', fontWeight: '600',
              cursor: fetching ? 'not-allowed' : 'pointer',
              boxShadow: fetching ? 'none' : '0 4px 15px rgba(255,107,53,0.3)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {fetching ? (
              <>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                拉取中...
              </>
            ) : (
              <>🔄 拉取<select
                value={fetchDays}
                onChange={(e) => { e.stopPropagation(); setFetchDays(parseInt(e.target.value)); }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                  fontSize: '12px', fontWeight: '600', outline: 'none', cursor: 'pointer',
                  padding: '0 2px', borderRadius: '4px',
                }}
              >
                <option value={1}>1天</option>
                <option value={3}>3天</option>
                <option value={7}>7天</option>
                <option value={14}>14天</option>
                <option value={30}>30天</option>
              </select>订单</>
            )}
          </button>
        </div>
      </div>

      {/* 拉取结果提示 */}
      {fetchResult && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '12px',
          background: fetchResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${fetchResult.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: fetchResult.success ? '#10B981' : '#EF4444',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>
            {fetchResult.success
              ? `✅ 成功拉取 ${fetchResult.ordersFetched} 条订单，${fetchResult.itemsFetched} 条明细 (${fetchResult.duration})`
              : `❌ 拉取失败: ${fetchResult.error}`
            }
          </span>
          <button
            onClick={() => setFetchResult(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '14px' }}
          >
            ×
          </button>
        </div>
      )}

      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {statsLoading ? (
          <div style={{ width: '100%', textAlign: 'center', padding: '30px', color: '#999', fontSize: '12px' }}>
            加载统计中...
          </div>
        ) : (
          <>
            <StatCard icon="📦" label="总订单" value={stats?.totalOrders?.toLocaleString() || stats?.summary?.total_orders?.toLocaleString() || '0'} color="#3B82F6" />
            <StatCard icon="💰" label="总GMV" value={`Rp ${formatIDR(stats?.totalGMV || stats?.summary?.total_gmv)}`} sub="付款总额" color="#F7931E" />
            <StatCard icon="📈" label="总利润" value={`Rp ${formatIDR(stats?.totalProfit || stats?.summary?.completed_gmv)}`} sub={stats?.avgProfitMargin ? `利润率 ${stats.avgProfitMargin}` : ''} color="#10B981" />
            <StatCard icon="🏪" label="店铺数" value={shopList.length || stats?.summary?.shop_count || '0'} color="#8B5CF6" />
          </>
        )}
      </div>

      {/* 图表区域 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', marginBottom: '20px' }}>
        <ShopBar shops={shopList} />
        <StatusBreakdown statusData={statusList} />
      </div>

      {/* 筛选栏 */}
      <div style={{
        display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>📋 订单列表</div>
        <div style={{ flex: 1 }} />

        {/* 快捷日期按钮 */}
        {DATE_PRESETS.map((preset, idx) => (
          <button
            key={preset.label}
            onClick={() => handlePreset(idx)}
            style={presetBtnStyle(activePreset === idx)}
          >
            {preset.label}
          </button>
        ))}

        {/* 重置按钮 */}
        {hasFilters && (
          <button
            onClick={handleReset}
            style={{
              padding: '5px 12px', borderRadius: '6px',
              border: '1px solid #EF4444', background: 'rgba(239,68,68,0.05)',
              color: '#EF4444', fontSize: '11px', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ✕ 重置
          </button>
        )}
      </div>

      {/* 详细筛选行 */}
      <div style={{
        display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <input
          type="text"
          placeholder="搜索订单号/买家..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadOrders(1)}
          style={{
            padding: '7px 12px', borderRadius: '8px', fontSize: '11px', width: '150px',
            background: '#F5F5F7', border: '1px solid #E0E0E5',
            color: '#555', outline: 'none',
          }}
        />
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => handleDateFromChange(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: '8px', fontSize: '13px', minWidth: '140px',
            background: filterDateFrom ? 'rgba(255,107,53,0.05)' : '#F5F5F7',
            border: filterDateFrom ? '1px solid rgba(255,107,53,0.3)' : '1px solid #E0E0E5',
            color: '#555', outline: 'none', cursor: 'pointer',
          }}
        />
        <span style={{ color: '#999', fontSize: '13px' }}>~</span>
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => handleDateToChange(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: '8px', fontSize: '13px', minWidth: '140px',
            background: filterDateTo ? 'rgba(255,107,53,0.05)' : '#F5F5F7',
            border: filterDateTo ? '1px solid rgba(255,107,53,0.3)' : '1px solid #E0E0E5',
            color: '#555', outline: 'none', cursor: 'pointer',
          }}
        />
        <select
          value={filterShop}
          onChange={(e) => setFilterShop(e.target.value)}
          style={{
            padding: '7px 12px', borderRadius: '8px', fontSize: '11px',
            background: '#F5F5F7', border: '1px solid #E0E0E5',
            color: '#555', outline: 'none', cursor: 'pointer', minWidth: '120px',
          }}
        >
          <option value="">全部店铺</option>
          {shopList.map((s) => (
            <option key={s.shop_id || s.shop_name} value={s.shop_id || s.shop_name}>
              {s.shop_name || s.platform_shop_name} ({s.count || s.orders})
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '7px 12px', borderRadius: '8px', fontSize: '11px',
            background: '#F5F5F7', border: '1px solid #E0E0E5',
            color: '#555', outline: 'none', cursor: 'pointer', minWidth: '120px',
          }}
        >
          <option value="">全部状态</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
      </div>

      {/* 订单表格 */}
      <OrderTable
        orders={orders}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => loadOrders(p)}
      />

      {/* CSS动画 */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #FFFFFF; color: #333; }
      `}</style>
    </div>
  );
};

export default OrderCenter;
