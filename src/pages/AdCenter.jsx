import React, { useState, useEffect, useCallback } from 'react';

// ========== API ==========
const fetchCampaigns = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/easyboss/ads/campaigns?${query}`);
  return res.json();
};

const fetchAdStats = async () => {
  const res = await fetch('/api/easyboss/ads/stats');
  return res.json();
};

const fetchDaily = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/easyboss/ads/daily?${query}`);
  return res.json();
};

const triggerAdFetch = async (status = 'ongoing', fetchDaily = false, dailyDays = 30) => {
  const res = await fetch('/api/easyboss/ads/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, fetchDaily, dailyDays }),
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
  const num = parseFloat(n);
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatPct = (n) => {
  if (!n && n !== 0) return '-';
  return parseFloat(n).toFixed(2) + '%';
};

// ========== ROI 颜色 ==========
const roiColor = (roi) => {
  const v = parseFloat(roi);
  if (!v || isNaN(v)) return '#64748B';
  if (v >= 4) return '#10B981';
  if (v >= 2) return '#F59E0B';
  return '#EF4444';
};

// ========== 统计卡片 ==========
const StatCard = ({ icon, label, value, sub, color }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '14px', padding: '20px', flex: 1, minWidth: '160px',
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: '-10px', right: '-10px',
      width: '60px', height: '60px', borderRadius: '50%',
      background: `${color}10`, filter: 'blur(15px)',
    }} />
    <div style={{ fontSize: '20px', marginBottom: '10px' }}>{icon}</div>
    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
      {label}
    </div>
    <div style={{ fontSize: '24px', fontWeight: '700', color: '#F8FAFC', letterSpacing: '-0.5px' }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{sub}</div>}
  </div>
);

// ========== 店铺广告分布 ==========
const ShopAdBar = ({ shops }) => {
  if (!shops || shops.length === 0) return null;
  const maxExpense = Math.max(...shops.map(s => parseFloat(s.total_expense) || 0), 1);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '14px', padding: '20px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#F8FAFC', marginBottom: '16px' }}>
        📊 店铺广告花费 & ROI
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {shops.slice(0, 12).map((shop) => (
          <div key={shop.shop_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '60px', fontSize: '11px', color: '#94A3B8', textAlign: 'right', flexShrink: 0 }}>
              {shop.shop_id}
            </div>
            <div style={{ flex: 1, height: '22px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${((parseFloat(shop.total_expense) || 0) / maxExpense) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #FF6B35 0%, #F7931E 100%)',
                borderRadius: '4px', minWidth: '40px',
                display: 'flex', alignItems: 'center', paddingLeft: '8px',
              }}>
                <span style={{ fontSize: '10px', color: '#fff', fontWeight: '600' }}>
                  {formatIDR(shop.total_expense)}
                </span>
              </div>
            </div>
            <div style={{
              width: '60px', fontSize: '11px', textAlign: 'right', flexShrink: 0, fontWeight: '600',
              color: roiColor(shop.avg_roi),
            }}>
              ROI {parseFloat(shop.avg_roi || 0).toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== 广告详情弹窗 ==========
const AdDetail = ({ ad, daily, onClose }) => {
  if (!ad) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: '#1E293B', borderRadius: '16px', width: '100%', maxWidth: '750px',
        maxHeight: '80vh', overflow: 'auto', padding: '28px',
        border: '1px solid rgba(255,255,255,0.08)',
      }} onClick={e => e.stopPropagation()}>
        {/* 标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#F8FAFC', marginBottom: '6px', lineHeight: 1.4 }}>
              {ad.ad_name}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              广告ID: {ad.platform_campaign_id} · 店铺: {ad.shop_id} · {ad.ad_type} · {ad.bidding_method}
              {ad.platform_item_id && <> · 商品: {ad.platform_item_id}</>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {/* KPI 网格 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: '花费', value: formatIDR(ad.expense), color: '#FF6B35' },
            { label: '展示', value: formatNum(ad.impression), color: '#3B82F6' },
            { label: '点击', value: formatNum(ad.clicks), color: '#8B5CF6' },
            { label: 'CTR', value: formatPct(ad.ctr), color: '#06B6D4' },
            { label: '广泛GMV', value: formatIDR(ad.broad_gmv), color: '#10B981' },
            { label: '广泛订单', value: ad.broad_order || 0, color: '#10B981' },
            { label: '广泛ROI', value: parseFloat(ad.broad_roi || 0).toFixed(2), color: roiColor(ad.broad_roi) },
            { label: '预算', value: formatIDR(ad.campaign_budget), color: '#F59E0B' },
            { label: '直接GMV', value: formatIDR(ad.direct_gmv), color: '#3B82F6' },
            { label: '直接订单', value: ad.direct_order || 0, color: '#3B82F6' },
            { label: '直接ROI', value: parseFloat(ad.direct_roi || 0).toFixed(2), color: roiColor(ad.direct_roi) },
            { label: '状态', value: ad.campaign_status, color: ad.campaign_status === 'ongoing' ? '#10B981' : '#6B7280' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* 每日趋势 */}
        {daily && daily.length > 0 && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#F8FAFC', marginBottom: '12px' }}>📈 每日数据 (近{daily.length}天)</div>
            <div style={{ maxHeight: '250px', overflow: 'auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '90px repeat(6, 1fr)',
                fontSize: '11px', color: '#64748B', fontWeight: '600',
                padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px 8px 0 0', position: 'sticky', top: 0,
              }}>
                <div>日期</div>
                <div style={{ textAlign: 'right' }}>花费</div>
                <div style={{ textAlign: 'right' }}>展示</div>
                <div style={{ textAlign: 'right' }}>点击</div>
                <div style={{ textAlign: 'right' }}>订单</div>
                <div style={{ textAlign: 'right' }}>GMV</div>
                <div style={{ textAlign: 'right' }}>ROI</div>
              </div>
              {daily.map(d => (
                <div key={d.date} style={{
                  display: 'grid',
                  gridTemplateColumns: '90px repeat(6, 1fr)',
                  fontSize: '11px', color: '#E2E8F0', padding: '6px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}>
                  <div>{d.date}</div>
                  <div style={{ textAlign: 'right' }}>{formatIDR(d.expense)}</div>
                  <div style={{ textAlign: 'right' }}>{formatNum(d.impression)}</div>
                  <div style={{ textAlign: 'right' }}>{formatNum(d.clicks)}</div>
                  <div style={{ textAlign: 'right' }}>{d.broad_order || 0}</div>
                  <div style={{ textAlign: 'right' }}>{formatIDR(d.broad_gmv)}</div>
                  <div style={{ textAlign: 'right', color: roiColor(d.broad_roi), fontWeight: '600' }}>
                    {parseFloat(d.broad_roi || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ========== 主组件 ==========
const AdCenter = () => {
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ongoing');
  const [shopFilter, setShopFilter] = useState('');
  const [matchedFilter, setMatchedFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [dailyData, setDailyData] = useState([]);

  const pageSize = 30;

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchAdStats();
      if (data.success) setStats(data);
    } catch (e) { console.error(e); }
  }, []);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (shopFilter) params.shopId = shopFilter;
      if (matchedFilter) params.matched = matchedFilter;
      const data = await fetchCampaigns(params);
      if (data.success) {
        setCampaigns(data.campaigns);
        setTotal(data.total);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, statusFilter, shopFilter, matchedFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const handleFetch = async () => {
    setFetching(true);
    try {
      const result = await triggerAdFetch('ongoing', false);
      if (result.success) {
        alert(`✅ 广告同步完成！${result.campaignsFetched}条, 匹配${result.itemsMatched}个, 耗时${result.duration}`);
        loadStats();
        loadCampaigns();
      } else {
        alert('❌ 拉取失败: ' + result.error);
      }
    } catch (e) { alert('❌ 错误: ' + e.message); }
    setFetching(false);
  };

  const handleDetail = async (ad) => {
    setDetail(ad);
    try {
      const data = await fetchDaily({ campaignId: ad.platform_campaign_id, shopId: ad.shop_id });
      if (data.success) setDailyData(data.records || []);
      else setDailyData([]);
    } catch (e) { setDailyData([]); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#F8FAFC', margin: 0, letterSpacing: '-0.5px' }}>
            📢 广告中心
          </h2>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
            Shopee 广告活动数据 · ROI 分析 · AI 决策支撑
          </div>
        </div>
        <button
          onClick={handleFetch}
          disabled={fetching}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: fetching ? 'wait' : 'pointer',
            background: fetching ? '#334155' : 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
            color: '#fff', fontSize: '13px', fontWeight: '600',
          }}
        >
          {fetching ? '⏳ 同步中...' : '🔄 同步广告数据'}
        </button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <StatCard icon="📢" label="广告总数" value={stats.totalCampaigns || 0} sub={`进行中: ${stats.ongoingCampaigns || '-'}`} color="#3B82F6" />
          <StatCard icon="💰" label="总花费" value={formatIDR(stats.totalExpense)} color="#FF6B35" />
          <StatCard icon="📈" label="总GMV" value={formatIDR(stats.totalGmv)} color="#10B981" />
          <StatCard icon="⚡" label="总ROI" value={parseFloat(stats.overallRoi || 0).toFixed(2)} color={roiColor(stats.overallRoi)} />
          <StatCard icon="🔗" label="商品匹配" value={`${stats.matchedCampaigns || 0}/${stats.totalCampaigns || 0}`} color="#8B5CF6" />
        </div>
      )}

      {/* 店铺广告分布 */}
      {stats?.byShop && <ShopAdBar shops={stats.byShop} />}

      {/* 筛选栏 */}
      <div style={{
        display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: '10px 14px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)', background: '#1E293B',
            color: '#F8FAFC', fontSize: '13px', outline: 'none',
          }}
        >
          <option value="">全部状态</option>
          <option value="ongoing">进行中</option>
          <option value="paused">已暂停</option>
          <option value="ended">已结束</option>
        </select>
        <select
          value={matchedFilter}
          onChange={e => { setMatchedFilter(e.target.value); setPage(1); }}
          style={{
            padding: '10px 14px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)', background: '#1E293B',
            color: '#F8FAFC', fontSize: '13px', outline: 'none',
          }}
        >
          <option value="">全部匹配</option>
          <option value="true">已匹配商品</option>
          <option value="false">未匹配</option>
        </select>
        {stats?.byShop && (
          <select
            value={shopFilter}
            onChange={e => { setShopFilter(e.target.value); setPage(1); }}
            style={{
              padding: '10px 14px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)', background: '#1E293B',
              color: '#F8FAFC', fontSize: '13px', outline: 'none', maxWidth: '180px',
            }}
          >
            <option value="">全部店铺</option>
            {stats.byShop.map(s => (
              <option key={s.shop_id} value={s.shop_id}>{s.shop_id} ({s.campaign_count})</option>
            ))}
          </select>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '12px', color: '#64748B' }}>
          共 {total} 条广告
        </span>
      </div>

      {/* 广告列表 */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px', overflow: 'hidden',
      }}>
        {/* 表头 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 100px 80px 80px 80px 80px 70px 60px',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase',
        }}>
          <div>广告</div>
          <div style={{ textAlign: 'right' }}>花费</div>
          <div style={{ textAlign: 'right' }}>展示</div>
          <div style={{ textAlign: 'right' }}>点击</div>
          <div style={{ textAlign: 'right' }}>GMV</div>
          <div style={{ textAlign: 'right' }}>订单</div>
          <div style={{ textAlign: 'right' }}>ROI</div>
          <div style={{ textAlign: 'center' }}>详情</div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748B' }}>加载中...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748B' }}>暂无数据</div>
        ) : (
          campaigns.map((ad) => (
            <div key={ad.platform_campaign_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 100px 80px 80px 80px 80px 70px 60px',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => handleDetail(ad)}
            >
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ad.ad_name}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span>{ad.shop_id}</span>
                  <span>·</span>
                  <span>{ad.ad_type}</span>
                  {ad.platform_item_id && (
                    <>
                      <span>·</span>
                      <span style={{ color: '#10B981' }}>🔗 已匹配</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#FF6B35', fontWeight: '600' }}>
                {formatIDR(ad.expense)}
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#94A3B8' }}>
                {formatNum(ad.impression)}
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#94A3B8' }}>
                {formatNum(ad.clicks)}
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#10B981', fontWeight: '500' }}>
                {formatIDR(ad.broad_gmv)}
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#F8FAFC' }}>
                {ad.broad_order || 0}
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: '700', color: roiColor(ad.broad_roi) }}>
                {parseFloat(ad.broad_roi || 0).toFixed(2)}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDetail(ad); }}
                  style={{ background: 'rgba(59,130,246,0.15)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: '#3B82F6', fontSize: '11px', cursor: 'pointer' }}
                >
                  查看
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', alignItems: 'center' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#E2E8F0', fontSize: '12px', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.3 : 1 }}
          >
            ‹ 上一页
          </button>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
            {page} / {totalPages}  (共{total}条)
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#E2E8F0', fontSize: '12px', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.3 : 1 }}
          >
            下一页 ›
          </button>
        </div>
      )}

      {/* 详情弹窗 */}
      {detail && (
        <AdDetail
          ad={detail}
          daily={dailyData}
          onClose={() => { setDetail(null); setDailyData([]); }}
        />
      )}
    </div>
  );
};

export default AdCenter;
