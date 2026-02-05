import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../utils/apiFetch';

// ========== API ==========
const api = (path) => apiGet(`/api/easyboss/analytics/${path}`);

// ========== 格式化 ==========
const fmtIDR = (v) => {
  const n = parseFloat(v) || 0;
  if (n >= 1e9) return `Rp ${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `Rp ${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `Rp ${(n/1e3).toFixed(0)}K`;
  return `Rp ${n.toFixed(0)}`;
};
const fmtNum = (v) => {
  const n = parseInt(v) || 0;
  return n >= 1000 ? n.toLocaleString() : n;
};
const fmtPct = (cur, prev) => {
  if (!prev || prev === 0) return null;
  const pct = ((cur - prev) / prev * 100).toFixed(0);
  return { value: `${pct > 0 ? '+' : ''}${pct}%`, up: pct > 0 };
};

// action_type 转显示标签
const getActionLabel = (type) => {
  const map = {
    'increase': '🟢 加预算',
    'maintain': '🟡 维持',
    'observe': '🟠 观察',
    'decrease': '🔴 减预算',
    'pause': '🔴 暂停',
  };
  return map[type] || type;
};

// ========== KPI 卡片 ==========
const KpiCard = ({ icon, label, value, sub, change }) => (
  <div style={{
    background: '#FFFFFF',
    borderRadius: '14px', padding: '18px 20px',
    border: '1px solid #E8E8ED',
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ fontSize: '11px', color: '#999', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span>{icon}</span> {label}
    </div>
    <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.5px' }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
      {sub && <span style={{ fontSize: '11px', color: '#999' }}>{sub}</span>}
      {change && (
        <span style={{ fontSize: '11px', fontWeight: '600', color: change.up ? '#10B981' : '#EF4444' }}>
          {change.up ? '↑' : '↓'} {change.value}
        </span>
      )}
    </div>
  </div>
);

// ========== 趋势图（纯CSS柱状图）==========
const TrendChart = ({ data, metric, label, color = '#3B82F6' }) => {
  if (!data || data.length === 0) return null;
  const values = data.map(d => parseFloat(d[metric]) || 0);
  const max = Math.max(...values, 1);

  return (
    <div style={{
      background: '#FAFBFC', borderRadius: '14px', padding: '20px',
      border: '1px solid #E8E8ED',
    }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>📈 {label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '120px' }}>
        {data.map((d, i) => {
          const v = parseFloat(d[metric]) || 0;
          const h = Math.max((v / max) * 100, 2);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ fontSize: '9px', color: '#666', whiteSpace: 'nowrap' }}>
                {metric === 'roi' ? v.toFixed(1) : v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v}
              </div>
              <div style={{
                width: '100%', height: `${h}%`, borderRadius: '4px 4px 2px 2px',
                background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
                minHeight: '3px', transition: 'height 0.5s ease',
              }} />
              <div style={{ fontSize: '8px', color: '#999', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                {(d.date || '').substring(5)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ========== 广告决策卡（带执行按钮）==========
const DecisionCard = ({ ad, onExecute, onIgnore, executing }) => {
  const bgMap = {
    '🟢 加预算': 'rgba(16,185,129,0.08)',
    '🟡 维持': 'rgba(245,158,11,0.06)',
    '🟠 观察': 'rgba(249,115,22,0.08)',
    '🔴 减预算': 'rgba(239,68,68,0.08)',
    '🔴 暂停': 'rgba(239,68,68,0.1)',
  };
  const borderMap = {
    '🟢 加预算': 'rgba(16,185,129,0.2)',
    '🟡 维持': 'rgba(245,158,11,0.15)',
    '🟠 观察': 'rgba(249,115,22,0.2)',
    '🔴 减预算': 'rgba(239,68,68,0.2)',
    '🔴 暂停': 'rgba(239,68,68,0.25)',
  };
  
  const isExecuted = ad.execution_status === 'executed';
  const isIgnored = ad.execution_status === 'ignored';
  const isPending = !isExecuted && !isIgnored;

  return (
    <div style={{
      background: isExecuted ? 'rgba(16,185,129,0.04)' : isIgnored ? '#FAFBFC' : (bgMap[ad.action] || '#FFFFFF'),
      border: `1px solid ${isExecuted ? 'rgba(16,185,129,0.3)' : isIgnored ? '#E8E8ED' : (borderMap[ad.action] || '#E8E8ED')}`,
      borderRadius: '12px', padding: '14px 16px',
      opacity: isIgnored ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', flex: 1, lineHeight: 1.4 }}>
          {(ad.ad_name || '').substring(0, 60)}{ad.ad_name?.length > 60 ? '...' : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>{ad.action}</div>
          {isExecuted && <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>✓ 已执行</span>}
          {isIgnored && <span style={{ fontSize: '11px', color: '#999', fontWeight: '600' }}>已忽略</span>}
        </div>
      </div>
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>{ad.reason || ad.ai_reason}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#999' }}>
          <span>花费: {fmtIDR(ad.cost_period || ad.cost_before)}</span>
          <span>GMV: {fmtIDR(ad.gmv_period || ad.gmv_before)}</span>
          <span style={{ color: parseFloat(ad.roi || ad.roi_before) >= 3 ? '#10B981' : parseFloat(ad.roi || ad.roi_before) >= 1.5 ? '#F59E0B' : '#EF4444', fontWeight: '600' }}>
            ROI: {parseFloat(ad.roi || ad.roi_before || 0).toFixed(2)}
          </span>
          <span>订单: {ad.orders_period || 0}</span>
        </div>
        {isPending && onExecute && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => onIgnore(ad)}
              disabled={executing}
              style={{
                padding: '5px 10px', borderRadius: '6px', border: '1px solid #E8E8ED',
                background: '#fff', color: '#666', fontSize: '11px', cursor: 'pointer',
              }}
            >忽略</button>
            <button
              onClick={() => onExecute(ad)}
              disabled={executing}
              style={{
                padding: '5px 12px', borderRadius: '6px', border: 'none',
                background: 'linear-gradient(135deg, #FF6B35, #F7931E)', color: '#fff',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer',
              }}
            >✓ 确认执行</button>
          </div>
        )}
        {(isExecuted || isIgnored) && ad.executor_name && (
          <div style={{ fontSize: '10px', color: '#999' }}>
            {ad.executor_name} · {ad.executed_at ? new Date(ad.executed_at).toLocaleString('zh-CN') : ''}
          </div>
        )}
      </div>
    </div>
  );
};

// ========== 商品排行 ==========
const ProductRank = ({ products }) => {
  if (!products || products.length === 0) return null;
  return (
    <div style={{
      background: '#FAFBFC', borderRadius: '14px', padding: '20px',
      border: '1px solid #E8E8ED',
    }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '14px' }}>🏆 商品利润排行 (近30天)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 80px 80px 80px 70px 60px', fontSize: '11px', color: '#999', fontWeight: '600', padding: '8px 0', borderBottom: '1px solid #E8E8ED' }}>
        <div>#</div><div>商品</div><div style={{textAlign:'right'}}>订单</div><div style={{textAlign:'right'}}>GMV</div>
        <div style={{textAlign:'right'}}>利润</div><div style={{textAlign:'right'}}>广告费</div><div style={{textAlign:'right'}}>ROI</div>
      </div>
      {products.map((p, i) => (
        <div key={`${p.platform_item_id}-${p.shop_id}`} style={{
          display: 'grid', gridTemplateColumns: '30px 1fr 80px 80px 80px 70px 60px',
          fontSize: '11px', color: '#333', padding: '10px 0',
          borderBottom: '1px solid #F0F0F3',
        }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: i < 3 ? ['#FF6B35', '#F59E0B', '#8B5CF6'][i] : '#F0F0F3',
            color: i < 3 ? '#fff' : '#64748B', fontWeight: '700', fontSize: '10px',
          }}>{i + 1}</div>
          <div>
            <div style={{ color: '#1a1a1a', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
              {p.item_name}
            </div>
            <div style={{ fontSize: '10px', color: '#999' }}>{p.shop_name}</div>
          </div>
          <div style={{textAlign:'right', fontWeight:'600'}}>{fmtNum(p.order_count)}</div>
          <div style={{textAlign:'right'}}>{fmtIDR(p.total_gmv)}</div>
          <div style={{textAlign:'right', color: parseFloat(p.total_profit) > 0 ? '#10B981' : '#EF4444', fontWeight:'600'}}>
            {fmtIDR(p.total_profit)}
          </div>
          <div style={{textAlign:'right', color:'#F59E0B'}}>{parseFloat(p.ad_cost) > 0 ? fmtIDR(p.ad_cost) : '-'}</div>
          <div style={{textAlign:'right', color: parseFloat(p.ad_roi) >= 3 ? '#10B981' : parseFloat(p.ad_roi) >= 1 ? '#F59E0B' : '#64748B', fontWeight:'600'}}>
            {parseFloat(p.ad_roi) > 0 ? parseFloat(p.ad_roi).toFixed(1) : '-'}
          </div>
        </div>
      ))}
    </div>
  );
};

// ========== 主组件 ==========
const ExecuteCenter = () => {
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [products, setProducts] = useState([]);
  const [decisions, setDecisions] = useState(null);
  const [pendingLogs, setPendingLogs] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [trendDays, setTrendDays] = useState(14);
  const [activeTab, setActiveTab] = useState('pending'); // pending | history

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, tr, pr, dc, pending, history] = await Promise.all([
        api('overview'),
        api(`trend?days=${trendDays}`),
        api('top-products?limit=10&days=30'),
        api('ad-decisions?days=7'),
        apiGet('/api/easyboss/execute/pending'),
        apiGet('/api/easyboss/execute/history?days=7'),
      ]);
      if (ov.success) setOverview(ov);
      if (tr.success) setTrend(tr.trend || []);
      if (pr.success) setProducts(pr.products || []);
      if (dc.success) setDecisions(dc);
      if (pending.success) setPendingLogs(pending.logs || []);
      if (history.success) setExecutionHistory(history.logs || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [trendDays]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // 同步AI决策到执行队列
  const syncDecisions = async () => {
    if (!decisions?.decisions?.length) return;
    setExecuting(true);
    try {
      const actionMap = {
        '🟢 加预算': 'increase',
        '🟡 维持': 'maintain',
        '🟠 观察': 'observe',
        '🔴 减预算': 'decrease',
        '🔴 暂停': 'pause',
      };
      const toSync = decisions.decisions.map(d => ({
        ...d,
        action_type: actionMap[d.action] || 'maintain',
      }));
      await apiPost('/api/easyboss/execute/log', { decisions: toSync });
      await loadAll();
    } catch (e) { console.error(e); }
    setExecuting(false);
  };

  // 执行决策
  const handleExecute = async (log) => {
    if (!window.confirm(`确认执行「${log.ad_name}」的「${log.action || log.action_type}」操作？`)) return;
    setExecuting(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await apiPost('/api/easyboss/execute/action', { 
        logId: log.id, 
        action: 'execute',
      });
      await loadAll();
    } catch (e) { console.error(e); }
    setExecuting(false);
  };

  // 忽略决策
  const handleIgnore = async (log) => {
    setExecuting(true);
    try {
      await apiPost('/api/easyboss/execute/action', { 
        logId: log.id, 
        action: 'ignore',
      });
      await loadAll();
    } catch (e) { console.error(e); }
    setExecuting(false);
  };

  const t = overview?.today || {};
  const y = overview?.yesterday || {};
  const w = overview?.week || {};

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
            🎯 数据分析中心
          </h2>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            实时概览 · 趋势分析 · AI决策建议
          </div>
        </div>
        <button onClick={loadAll} disabled={loading}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: loading ? '#ccc' : '#F5F5F7',
            color: '#555', fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
          {loading ? '加载中...' : '🔄 刷新'}
        </button>
      </div>

      {loading && !overview ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          加载数据中...
        </div>
      ) : (
        <>
          {/* 今日KPI */}
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '12px' }}>📊 今日实时</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <KpiCard icon="📦" label="今日订单" value={fmtNum(t.orders)} sub="笔" change={fmtPct(t.orders, y.orders)} />
            <KpiCard icon="💰" label="今日GMV" value={fmtIDR(t.gmv)} change={fmtPct(t.gmv, y.gmv)} />
            <KpiCard icon="📈" label="今日利润" value={fmtIDR(t.profit)} change={fmtPct(t.profit, y.profit)} />
            <KpiCard icon="📢" label="广告花费" value={fmtIDR(t.adCost)} change={fmtPct(t.adCost, y.adCost)} />
            <KpiCard icon="🎯" label="广告ROI" value={t.roi || '0'}
              sub={`广告GMV: ${fmtIDR(t.adGmv)}`}
              change={fmtPct(t.roi, y.roi)} />
          </div>

          {/* 本周汇总 */}
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '12px' }}>📅 近7天汇总</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '28px' }}>
            <KpiCard icon="📦" label="总订单" value={fmtNum(w.orders)} />
            <KpiCard icon="💰" label="总GMV" value={fmtIDR(w.gmv)} />
            <KpiCard icon="📈" label="总利润" value={fmtIDR(w.profit)}
              sub={w.gmv > 0 ? `利润率 ${(w.profit / w.gmv * 100).toFixed(1)}%` : ''} />
            <KpiCard icon="📢" label="广告总花费" value={fmtIDR(w.adCost)}
              sub={`广告订单: ${fmtNum(w.adOrders)}`} />
            <KpiCard icon="🎯" label="周均ROI" value={w.roi || '0'}
              sub={`广告GMV: ${fmtIDR(w.adGmv)}`} />
          </div>

          {/* 趋势图 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#666' }}>📈 趋势分析</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[7, 14, 30].map(d => (
                <button key={d} onClick={() => setTrendDays(d)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '11px',
                    background: trendDays === d ? '#FF6B35' : '#F5F5F7',
                    color: trendDays === d ? '#fff' : '#64748B', cursor: 'pointer',
                  }}>{d}天</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
            <TrendChart data={trend} metric="orders" label="每日订单" color="#3B82F6" />
            <TrendChart data={trend} metric="gmv" label="每日GMV" color="#10B981" />
            <TrendChart data={trend} metric="adCost" label="每日广告花费" color="#F59E0B" />
            <TrendChart data={trend} metric="roi" label="每日广告ROI" color="#8B5CF6" />
          </div>

          {/* 商品排行 */}
          <div style={{ marginBottom: '28px' }}>
            <ProductRank products={products} />
          </div>

          {/* ========== 执行中心 ========== */}
          <div style={{
            background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E8ED',
            overflow: 'hidden', marginBottom: '28px',
          }}>
            {/* 标题栏 */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #E8E8ED',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(255,107,53,0.06) 0%, rgba(247,147,30,0.03) 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FF6B35, #F7931E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '16px',
                }}>⚡</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a' }}>执行中心</div>
                  <div style={{ fontSize: '11px', color: '#999' }}>AI决策执行与追踪</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {decisions?.decisions?.length > 0 && (
                  <button onClick={syncDecisions} disabled={executing}
                    style={{
                      padding: '8px 14px', borderRadius: '8px', border: '1px solid #E8E8ED',
                      background: '#fff', color: '#666', fontSize: '12px', cursor: 'pointer',
                    }}>
                    📥 同步今日决策
                  </button>
                )}
              </div>
            </div>

            {/* Tab切换 */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #E8E8ED', display: 'flex', gap: '8px' }}>
              <button onClick={() => setActiveTab('pending')}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600',
                  background: activeTab === 'pending' ? 'linear-gradient(135deg, #FF6B35, #F7931E)' : '#F5F5F7',
                  color: activeTab === 'pending' ? '#fff' : '#666', cursor: 'pointer',
                }}>
                待执行 {pendingLogs.length > 0 && `(${pendingLogs.length})`}
              </button>
              <button onClick={() => setActiveTab('history')}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600',
                  background: activeTab === 'history' ? 'linear-gradient(135deg, #FF6B35, #F7931E)' : '#F5F5F7',
                  color: activeTab === 'history' ? '#fff' : '#666', cursor: 'pointer',
                }}>
                执行历史
              </button>
              <button onClick={() => setActiveTab('ai')}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600',
                  background: activeTab === 'ai' ? 'linear-gradient(135deg, #FF6B35, #F7931E)' : '#F5F5F7',
                  color: activeTab === 'ai' ? '#fff' : '#666', cursor: 'pointer',
                }}>
                AI建议 {decisions?.decisions?.length > 0 && `(${decisions.decisions.length})`}
              </button>
            </div>

            {/* 内容区 */}
            <div style={{ padding: '20px', minHeight: '200px' }}>
              {/* 待执行列表 */}
              {activeTab === 'pending' && (
                pendingLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                    <div>暂无待执行的决策</div>
                    <div style={{ fontSize: '11px', marginTop: '8px' }}>点击「同步今日决策」从AI建议导入</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pendingLogs.map(log => (
                      <DecisionCard
                        key={log.id}
                        ad={{ ...log, action: getActionLabel(log.action_type) }}
                        onExecute={handleExecute}
                        onIgnore={handleIgnore}
                        executing={executing}
                      />
                    ))}
                  </div>
                )
              )}

              {/* 执行历史 */}
              {activeTab === 'history' && (
                executionHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                    <div>暂无执行记录</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {executionHistory.map(log => (
                      <DecisionCard
                        key={log.id}
                        ad={{ ...log, action: getActionLabel(log.action_type) }}
                        executing={false}
                      />
                    ))}
                  </div>
                )
              )}

              {/* AI建议（原来的decisions） */}
              {activeTab === 'ai' && decisions && (
                <>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', marginBottom: '14px' }}>
                    {decisions.summary.increase > 0 && <span style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', color: '#10B981' }}>🟢加预算 {decisions.summary.increase}</span>}
                    {decisions.summary.maintain > 0 && <span style={{ padding: '4px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', color: '#F59E0B' }}>🟡维持 {decisions.summary.maintain}</span>}
                    {decisions.summary.observe > 0 && <span style={{ padding: '4px 10px', background: 'rgba(249,115,22,0.1)', borderRadius: '12px', color: '#F97316' }}>🟠观察 {decisions.summary.observe}</span>}
                    {decisions.summary.decrease > 0 && <span style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#EF4444' }}>🔴减预算 {decisions.summary.decrease}</span>}
                    {decisions.summary.pause > 0 && <span style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#EF4444' }}>⛔暂停 {decisions.summary.pause}</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {decisions.decisions.map((ad, i) => (
                      <DecisionCard key={`${ad.platform_campaign_id}-${i}`} ad={ad} executing={false} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ExecuteCenter;
