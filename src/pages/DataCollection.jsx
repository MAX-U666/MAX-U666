import React, { useState, useEffect } from 'react';

// ========== API 封装 ==========
const API_BASE = '';
const apiGet = async (url, params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}${url}${query ? '?' + query : ''}`);
  return res.json();
};
const apiPost = async (url, body = {}) => {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
};

// ========== 格式化 ==========
const formatTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const getDefaultDateFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};
const getToday = () => new Date().toISOString().slice(0, 10);

// ========== 主组件 ==========
const DataCollection = () => {
  // Cookie 状态
  const [cookieStatus, setCookieStatus] = useState({ configured: false, cookieLength: 0, updatedAt: null });
  const [newCookie, setNewCookie] = useState('');
  const [cookieUpdating, setCookieUpdating] = useState(false);
  const [cookieMsg, setCookieMsg] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // 每日采集（订单+广告）
  const [orderDateFrom, setOrderDateFrom] = useState(getDefaultDateFrom());
  const [orderDateTo, setOrderDateTo] = useState(getToday());
  const [adDailyDays, setAdDailyDays] = useState(5);
  const [dailyFetching, setDailyFetching] = useState(false);

  // 商品采集
  const [productFetching, setProductFetching] = useState(false);
  const [productResult, setProductResult] = useState(null);

  // 采集日志
  const [logs, setLogs] = useState([]);

  // ========== 初始化 ==========
  useEffect(() => {
    loadCookieStatus();
    loadLogs();
  }, []);

  const loadCookieStatus = async () => {
    try {
      const res = await apiGet('/api/easyboss/orders/cookie-status');
      if (res.success) setCookieStatus(res);
    } catch (e) { console.error('Cookie状态加载失败', e); }
  };

  const loadLogs = async () => {
    try {
      const res = await apiGet('/api/easyboss/orders/logs', { limit: 10 });
      if (res.success) setLogs(res.logs || []);
    } catch (e) { console.error('日志加载失败', e); }
  };

  // ========== Cookie 更新 ==========
  const handleUpdateCookie = async () => {
    if (!newCookie || newCookie.trim().length < 20) {
      setCookieMsg({ type: 'error', text: 'Cookie太短，请粘贴完整的Cookie字符串' });
      return;
    }
    const required = ['dmerp_sid', 'loginTokenS', 'acw_tc'];
    const missing = required.filter(k => !newCookie.includes(k));
    if (missing.length > 0) {
      setCookieMsg({ type: 'error', text: `缺少关键字段: ${missing.join(', ')}，请确认从Network Headers复制` });
      return;
    }

    setCookieUpdating(true);
    setCookieMsg(null);
    try {
      const res = await apiPost('/api/easyboss/orders/set-cookie', { cookie: newCookie.trim() });
      if (res.success) {
        setCookieMsg({ type: 'success', text: `✅ Cookie已更新 (${res.length}字符)` });
        setNewCookie('');
        setCookieStatus(prev => ({ ...prev, expired: false }));
        loadCookieStatus();
      } else {
        setCookieMsg({ type: 'error', text: `❌ ${res.error || '更新失败'}` });
      }
    } catch (e) {
      setCookieMsg({ type: 'error', text: `❌ 网络错误: ${e.message}` });
    } finally {
      setCookieUpdating(false);
    }
  };

  // 采集状态 - 独立
  const [orderFetching, setOrderFetching] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [adFetching, setAdFetching] = useState(false);
  const [adResult, setAdResult] = useState(null);

  // ========== 订单采集 ==========
  const handleOrderFetch = async () => {
    setOrderFetching(true);
    setOrderResult(null);
    try {
      const res = await apiPost('/api/easyboss/orders/fetch', {
        dateFrom: orderDateFrom + ' 00:00:00',
        dateTo: orderDateTo + ' 23:59:59',
      });
      setOrderResult(res);
      if (res.error && (res.error.includes('50001') || res.error.includes('登录'))) {
        setCookieStatus(prev => ({ ...prev, expired: true }));
      }
      loadLogs();
    } catch (e) {
      setOrderResult({ error: e.message });
    } finally {
      setOrderFetching(false);
    }
  };

  // ========== 广告采集 ==========
  const handleAdFetch = async () => {
    setAdFetching(true);
    setAdResult(null);
    try {
      const res = await apiPost('/api/easyboss/ads/fetch', {
        status: 'ongoing',
        fetchDaily: true,
        dailyDays: adDailyDays,
      });
      setAdResult(res);
      if (res.error && (res.error.includes('50001') || res.error.includes('登录'))) {
        setCookieStatus(prev => ({ ...prev, expired: true }));
      }
      loadLogs();
    } catch (e) {
      setAdResult({ error: e.message });
    } finally {
      setAdFetching(false);
    }
  };

  // ========== 全部采集（订单+广告）==========
  const handleDailyFetch = async () => {
    setDailyFetching(true);
    setOrderResult(null);
    setAdResult(null);
    try {
      // 订单
      setOrderFetching(true);
      const orderRes = await apiPost('/api/easyboss/orders/fetch', {
        dateFrom: orderDateFrom + ' 00:00:00',
        dateTo: orderDateTo + ' 23:59:59',
      });
      setOrderResult(orderRes);
      setOrderFetching(false);

      // 广告
      setAdFetching(true);
      const adRes = await apiPost('/api/easyboss/ads/fetch', {
        status: 'ongoing',
        fetchDaily: true,
        dailyDays: adDailyDays,
      });
      setAdResult(adRes);
      setAdFetching(false);

      const orderFailed = orderRes.error && (orderRes.error.includes('50001') || orderRes.error.includes('登录'));
      const adFailed = adRes.error && (adRes.error.includes('50001') || adRes.error.includes('登录'));
      if (orderFailed || adFailed) {
        setCookieStatus(prev => ({ ...prev, expired: true }));
      }
      loadLogs();
    } catch (e) {
      setOrderFetching(false);
      setAdFetching(false);
    } finally {
      setDailyFetching(false);
    }
  };

  // ========== 商品采集 ==========
  const handleProductFetch = async () => {
    setProductFetching(true);
    setProductResult(null);
    try {
      const res = await apiPost('/api/easyboss/products/fetch', { status: 'onsale', matchAds: true });
      setProductResult({ ...res, time: new Date().toISOString() });
      loadLogs();
    } catch (e) {
      setProductResult({ error: e.message, time: new Date().toISOString() });
    } finally {
      setProductFetching(false);
    }
  };

  // ========== 样式 ==========
  const card = {
    background: '#FFFFFF',
    border: '1px solid #E8E8ED',
    borderRadius: '14px',
    padding: '24px',
    marginBottom: '16px',
  };
  const labelSt = { fontSize: '12px', color: '#999', marginBottom: '4px', letterSpacing: '0.3px' };
  const btnOrange = (disabled) => ({
    padding: '10px 24px',
    borderRadius: '10px',
    border: 'none',
    background: disabled ? '#ccc' : 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    opacity: disabled ? 0.6 : 1,
    whiteSpace: 'nowrap',
  });
  const dateInput = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '13px', outline: 'none' };
  const tagStyle = (color, bg) => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
    color, background: bg,
  });

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* 页头 */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
          🔧 数据采集中心
        </h2>
        <p style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
          EasyBoss Cookie管理 & 数据抓取控制台
        </p>
      </div>

      {/* ===== Cookie 管理 ===== */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: '600' }}>🔑 Cookie</span>
            {cookieStatus.configured ? (
              cookieStatus.expired ? (
                <span style={tagStyle('#EF4444', '#FEF2F2')}>🔴 已过期</span>
              ) : (
                <span style={tagStyle('#059669', '#ECFDF5')}>🟢 有效</span>
              )
            ) : (
              <span style={tagStyle('#EF4444', '#FEF2F2')}>🔴 未配置</span>
            )}
          </div>
          {cookieStatus.configured && (
            <span style={{ fontSize: '12px', color: '#999' }}>
              {formatTime(cookieStatus.updatedAt)} 更新 · {cookieStatus.cookieLength}字符
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <textarea
            value={newCookie}
            onChange={(e) => { setNewCookie(e.target.value); setCookieMsg(null); }}
            placeholder="粘贴完整Cookie（从F12 → Network → Headers → Cookie行复制）"
            rows={3}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #E0E0E0',
              fontSize: '13px', fontFamily: 'monospace', outline: 'none', resize: 'vertical', minHeight: '60px',
            }}
          />
          <button onClick={handleUpdateCookie} disabled={cookieUpdating || !newCookie.trim()} style={btnOrange(cookieUpdating || !newCookie.trim())}>
            {cookieUpdating ? '⏳ 更新中...' : '🔄 更新'}
          </button>
        </div>

        {cookieMsg && (
          <div style={{
            marginTop: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
            background: cookieMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: cookieMsg.type === 'success' ? '#059669' : '#DC2626',
          }}>
            {cookieMsg.text}
          </div>
        )}

        <div
          onClick={() => setShowTutorial(!showTutorial)}
          style={{ marginTop: '12px', fontSize: '12px', color: '#FF6B35', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', userSelect: 'none' }}
        >
          <span style={{ transform: showTutorial ? 'rotate(90deg)' : 'none', transition: '0.2s', display: 'inline-block' }}>▶</span>
          不会获取Cookie？点击查看教程
        </div>

        {showTutorial && (
          <div style={{ marginTop: '12px', padding: '16px', background: '#FAFAFA', borderRadius: '10px', fontSize: '13px', lineHeight: '2', color: '#555' }}>
            <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>📖 获取Cookie步骤：</div>
            <div><strong>① </strong>Chrome打开 <a href="https://www.easyboss.com" target="_blank" rel="noreferrer" style={{ color: '#FF6B35' }}>easyboss.com</a> 并登录</div>
            <div><strong>② </strong>按 <code style={{ background: '#E8E8ED', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>F12</code> → 点顶部 <strong>Network</strong></div>
            <div><strong>③ </strong>刷新页面，在请求列表中随便点一个请求</div>
            <div><strong>④ </strong>右侧 <strong>Headers</strong> → 找到 <strong>Cookie:</strong> 这一行</div>
            <div><strong>⑤ </strong>选中整行值 → <code style={{ background: '#E8E8ED', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Ctrl+C</code> 复制 → 粘贴到上方输入框</div>
            <div style={{ marginTop: '12px', padding: '10px 12px', background: '#FFF7ED', borderRadius: '8px', border: '1px solid #FED7AA', fontSize: '12px', color: '#9A3412' }}>
              ⚠️ 必须从 Network→Headers 复制，<code>document.cookie</code> 拿不到httpOnly字段<br />
              ⚠️ 必须包含：<strong>dmerp_sid</strong>、<strong>loginTokenS</strong>、<strong>acw_tc</strong>
            </div>

            <details style={{ marginTop: '12px' }}>
              <summary style={{ fontSize: '12px', color: '#999', cursor: 'pointer' }}>备用：服务器控制台命令</summary>
              <pre style={{ marginTop: '8px', background: '#1a1a2e', color: '#E0E0E0', padding: '14px', borderRadius: '8px', fontSize: '11px', lineHeight: '1.6', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
{`# 写入Cookie到数据库
mysql -u root -p'密码' gmvmax << 'EOSQL'
UPDATE eb_config
SET config_value = '粘贴Cookie', updated_at = NOW()
WHERE config_key = 'easyboss_cookie';
EOSQL

# 重启服务
pm2 restart gmv-max

# 手动抓订单
curl -X POST localhost:3001/api/easyboss/orders/fetch \\
  -H 'Content-Type: application/json' -d '{"days":3}'

# 手动抓广告
curl -X POST localhost:3001/api/easyboss/ads/fetch \\
  -H 'Content-Type: application/json' \\
  -d '{"status":"ongoing","fetchDaily":true,"dailyDays":5}'`}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* ===== 订单采集 ===== */}
      <div style={card}>
        <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>📋 订单采集</div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={labelSt}>起始日期</div>
            <input type="date" value={orderDateFrom} onChange={(e) => setOrderDateFrom(e.target.value)} style={dateInput} />
          </div>
          <div>
            <div style={labelSt}>截止日期</div>
            <input type="date" value={orderDateTo} onChange={(e) => setOrderDateTo(e.target.value)} style={dateInput} />
          </div>
          <button onClick={handleOrderFetch} disabled={orderFetching} style={btnOrange(orderFetching)}>
            {orderFetching ? '⏳ 采集中...' : '▶ 采集订单'}
          </button>
        </div>

        {orderFetching && (
          <div style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '10px', background: '#FFF7ED', border: '1px solid #FED7AA', fontSize: '13px', color: '#9A3412', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #FF6B35', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            正在采集 {orderDateFrom} ~ {orderDateTo} 的订单...
          </div>
        )}

        {orderResult && !orderFetching && (
          <div style={{
            marginTop: '12px', padding: '12px 16px', borderRadius: '10px', fontSize: '13px',
            background: orderResult.error ? '#FEF2F2' : '#F0FDF4',
            border: `1px solid ${orderResult.error ? '#FECACA' : '#BBF7D0'}`,
          }}>
            {orderResult.error ? (
              <span style={{ color: '#DC2626' }}>❌ {orderResult.error}</span>
            ) : (
              <span style={{ color: '#059669' }}>
                ✅ 订单完成: {orderDateFrom}~{orderDateTo} → {orderResult.totalFetched || orderResult.total || 0}条
                {orderResult.inserted != null && ` (新增${orderResult.inserted})`}
              </span>
            )}
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* ===== 广告采集 ===== */}
      <div style={card}>
        <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>📺 广告采集</div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={labelSt}>每日明细天数</div>
            <select value={adDailyDays} onChange={(e) => setAdDailyDays(parseInt(e.target.value))} style={{ ...dateInput, minWidth: '80px' }}>
              {[3, 5, 7, 14, 30].map(d => <option key={d} value={d}>近{d}天</option>)}
            </select>
          </div>
          <button onClick={handleAdFetch} disabled={adFetching} style={btnOrange(adFetching)}>
            {adFetching ? '⏳ 采集中...' : '▶ 采集广告'}
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
          💡 拉取状态为 ongoing（进行中）的广告 + 每日明细
        </div>

        {adFetching && (
          <div style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '10px', background: '#FFF7ED', border: '1px solid #FED7AA', fontSize: '13px', color: '#9A3412', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #FF6B35', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            正在采集广告数据 (ongoing / 近{adDailyDays}天明细)...
          </div>
        )}

        {adResult && !adFetching && (
          <div style={{
            marginTop: '12px', padding: '12px 16px', borderRadius: '10px', fontSize: '13px',
            background: adResult.error ? '#FEF2F2' : '#F0FDF4',
            border: `1px solid ${adResult.error ? '#FECACA' : '#BBF7D0'}`,
          }}>
            {adResult.error ? (
              <span style={{ color: '#DC2626' }}>❌ {adResult.error}</span>
            ) : (
              <span style={{ color: '#059669' }}>
                ✅ 广告完成: ongoing/近{adDailyDays}天 → {adResult.totalCampaigns || 0}条广告
                {adResult.totalDailyRecords != null && ` / ${adResult.totalDailyRecords}条明细`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ===== 商品采集 ===== */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '15px', fontWeight: '600' }}>📦 商品采集</span>
          <span style={{ fontSize: '11px', color: '#999', background: '#F5F5F5', padding: '3px 8px', borderRadius: '4px' }}>建议每周一次</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={handleProductFetch} disabled={productFetching} style={{
            ...btnOrange(productFetching),
            background: productFetching ? '#ccc' : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          }}>
            {productFetching ? '⏳ 采集中...' : '▶ 立即采集商品'}
          </button>
          <span style={{ fontSize: '12px', color: '#999' }}>拉取在售商品 + 自动匹配广告</span>
        </div>

        {productResult && (
          <div style={{
            padding: '14px 16px', borderRadius: '10px', marginTop: '12px',
            background: productResult.error ? '#FEF2F2' : '#F0FDF4',
            border: `1px solid ${productResult.error ? '#FECACA' : '#BBF7D0'}`,
            fontSize: '13px',
          }}>
            {productResult.error ? (
              <div style={{ color: '#DC2626' }}>❌ {productResult.error}</div>
            ) : (
              <div style={{ color: '#166534' }}>
                ✅ {productResult.totalProducts || productResult.total || 0}个商品
                {productResult.matched != null && ` · ${productResult.matched}个已匹配广告`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== 采集日志 ===== */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '15px', fontWeight: '600' }}>📜 采集日志</span>
          <span onClick={loadLogs} style={{ fontSize: '12px', color: '#FF6B35', cursor: 'pointer' }}>🔄 刷新</span>
        </div>

        {logs.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#999', textAlign: 'center', padding: '20px' }}>暂无采集记录</div>
        ) : (
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {logs.map((log, i) => (
              <div key={log.id || i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 0', borderBottom: i < logs.length - 1 ? '1px solid #F0F0F0' : 'none', fontSize: '13px',
              }}>
                <span style={{ color: '#999', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {formatTime(log.created_at)}
                </span>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: log.success ? '#10B981' : '#EF4444',
                }} />
                <span style={{ color: '#333' }}>
                  {log.fetch_type === 'ads' ? '📺 广告' : log.fetch_type === 'products' ? '📦 商品' : '📋 订单'}
                </span>
                {log.date_from && log.date_to && (
                  <span style={{ color: '#999' }}>{formatDate(log.date_from)}~{formatDate(log.date_to)}</span>
                )}
                <span style={{ color: '#666' }}>
                  {log.total_fetched != null ? `${log.total_fetched}条` : ''}
                  {log.error_message && <span style={{ color: '#EF4444' }}> {log.error_message}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataCollection;
