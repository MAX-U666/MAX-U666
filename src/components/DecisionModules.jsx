import React, { useState, useEffect, useRef } from 'react';

// ==================== SKU决策模块 ====================
const SkuDecision = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSku, setSelectedSku] = useState(null);
  const [skuData, setSkuData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  
  // AI 分析
  const [selectedModel, setSelectedModel] = useState('qwen');
  const [availableModels, setAvailableModels] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [reportMeta, setReportMeta] = useState(null);
  const [reportExpanded, setReportExpanded] = useState(true);
  
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // 加载可用模型
  useEffect(() => {
    fetch('/api/decision/models')
      .then(r => r.json())
      .then(d => { if (d.success) setAvailableModels(d.models); })
      .catch(() => {});
  }, []);

  // 搜索防抖
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/decision/sku/search?q=${encodeURIComponent(searchQuery)}`);
        const d = await r.json();
        if (d.success) {
          setSearchResults(d.data);
          setShowDropdown(d.data.length > 0);
        }
      } catch (e) { console.error(e); }
      setSearching(false);
    }, 300);
  }, [searchQuery]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 选中SKU后加载数据
  const handleSelectSku = async (item) => {
    setSelectedSku(item);
    setSearchQuery(item.item_id);
    setShowDropdown(false);
    setReport(null);
    setLoadingData(true);
    
    try {
      const r = await fetch(`/api/decision/sku/${item.item_id}/data?days=7`);
      const d = await r.json();
      if (d.success) setSkuData(d);
      else alert('加载失败: ' + d.error);
    } catch (e) { alert('加载失败: ' + e.message); }
    setLoadingData(false);
  };

  // 也支持直接输入item_id回车
  const handleSearchSubmit = async (e) => {
    if (e.key !== 'Enter' || !searchQuery.trim()) return;
    setShowDropdown(false);
    setReport(null);
    setSelectedSku({ item_id: searchQuery.trim(), name: '' });
    setLoadingData(true);
    try {
      const r = await fetch(`/api/decision/sku/${searchQuery.trim()}/data?days=7`);
      const d = await r.json();
      if (d.success) {
        setSkuData(d);
        if (d.product) setSelectedSku({ item_id: searchQuery.trim(), name: d.product.name, sku_id: d.product.sku_id });
      }
    } catch (e) { console.error(e); }
    setLoadingData(false);
  };

  // AI分析
  const handleAnalyze = async () => {
    if (!selectedSku?.item_id) return;
    setAnalyzing(true);
    setReport(null);
    try {
      const r = await fetch(`/api/decision/sku/${selectedSku.item_id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel })
      });
      const d = await r.json();
      if (d.success) {
        setReport(d.report);
        setReportMeta({ model: d.model_name, elapsed: d.elapsed_ms, context: d.data_context });
      } else {
        alert('分析失败: ' + d.error);
      }
    } catch (e) { alert('分析失败: ' + e.message); }
    setAnalyzing(false);
  };

  // ==================== 渲染 ====================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 搜索栏 */}
      <div ref={searchRef} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="输入链接ID / SKU / 商品名搜索..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none',
                background: '#F8FAFC', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocusCapture={e => e.target.style.borderColor = '#FF6B35'}
              onBlurCapture={e => e.target.style.borderColor = '#E2E8F0'}
            />
            {searching && (
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94A3B8' }}>
                搜索中...
              </div>
            )}
          </div>
        </div>

        {/* 搜索下拉 */}
        {showDropdown && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: '4px',
            maxHeight: '300px', overflowY: 'auto'
          }}>
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSku(item)}
                style={{
                  padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
                onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{item.item_id}</div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{item.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#FF6B35', fontWeight: '600' }}>{item.recent_orders}单/30天</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>{item.shop_name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 选中的SKU信息 + 模型选择 + 分析按钮 */}
      {selectedSku && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)',
          borderRadius: '12px', padding: '14px', border: '1px solid #FED7AA'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400E' }}>
                🔗 {selectedSku.item_id}
              </div>
              {(selectedSku.name || skuData?.product?.name) && (
                <div style={{ fontSize: '11px', color: '#B45309', marginTop: '2px' }}>
                  {selectedSku.name || skuData?.product?.name}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0',
                  fontSize: '12px', background: '#FFF', cursor: 'pointer', outline: 'none'
                }}
              >
                {availableModels.map(m => (
                  <option key={m.key} value={m.key} disabled={!m.available}>
                    {m.name} {!m.available ? '(未配置)' : ''}
                  </option>
                ))}
                {availableModels.length === 0 && <option value="qwen">千问 qwen-plus</option>}
              </select>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || loadingData}
                style={{
                  padding: '6px 16px', borderRadius: '8px', border: 'none',
                  background: analyzing ? '#94A3B8' : '#FF6B35', color: '#FFF',
                  fontSize: '12px', fontWeight: '600', cursor: analyzing ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {analyzing ? '⏳ 分析中...' : '🧠 开始分析'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 数据加载中 */}
      {loadingData && (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '13px' }}>
          ⏳ 正在加载SKU数据...
        </div>
      )}

      {/* 7日数据概览 */}
      {skuData && !loadingData && (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {/* 汇总卡片 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', borderBottom: '1px solid #E2E8F0' }}>
            {[
              { label: '7日订单', value: skuData.summary.total_orders, suffix: '单', color: '#FF6B35' },
              { label: '7日营收', value: `¥${skuData.summary.total_revenue_cny}`, color: '#10B981' },
              { label: '7日利润', value: `¥${skuData.summary.total_profit_cny}`, color: skuData.summary.total_profit_cny >= 0 ? '#10B981' : '#EF4444' },
              { label: '平均ROI', value: skuData.summary.avg_roi, color: skuData.summary.avg_roi >= 3 ? '#10B981' : '#F59E0B' },
            ].map((card, i) => (
              <div key={i} style={{
                padding: '14px', textAlign: 'center',
                borderRight: i < 3 ? '1px solid #E2E8F0' : 'none',
              }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>{card.label}</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: card.color }}>
                  {card.value}{card.suffix || ''}
                </div>
              </div>
            ))}
          </div>

          {/* 每日明细表 */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['日期', '订单', '营收¥', '广告¥', '利润¥', '利润率', '曝光', '点击', 'CTR', 'CVR', 'ROI', '自然单占比'].map(h => (
                    <th key={h} style={{ padding: '8px 6px', textAlign: 'center', color: '#64748B', fontWeight: '600', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skuData.daily.map((d, i) => {
                  const naturalRate = d.orders > 0 ? Math.round(d.natural_orders / d.orders * 100) : 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FFFBEB'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '7px 6px', textAlign: 'center', color: '#475569', fontWeight: '500' }}>{d.date}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: '600', color: '#1E293B' }}>{d.orders}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', color: '#10B981' }}>{d.revenue_cny}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', color: '#F59E0B' }}>{d.ad_spend_cny}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: '600', color: d.profit_cny >= 0 ? '#10B981' : '#EF4444' }}>{d.profit_cny}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', color: d.profit_rate >= 0 ? '#10B981' : '#EF4444' }}>{d.profit_rate}%</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', color: '#64748B' }}>{d.impressions.toLocaleString()}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', color: '#64748B' }}>{d.clicks}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', color: '#64748B' }}>{d.ctr}%</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', color: d.cvr >= 2 ? '#10B981' : '#F59E0B' }}>{d.cvr}%</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: '600', color: d.roi >= 3 ? '#10B981' : d.roi >= 2 ? '#F59E0B' : '#EF4444' }}>{d.roi}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', color: naturalRate >= 40 ? '#10B981' : '#64748B' }}>{naturalRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI分析报告 */}
      {analyzing && (
        <div style={{
          background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0',
          padding: '40px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>🧠</div>
          <div style={{ color: '#64748B', fontSize: '13px' }}>AI 正在分析中，请稍候...</div>
          <div style={{ color: '#94A3B8', fontSize: '11px', marginTop: '4px' }}>
            使用模型: {availableModels.find(m => m.key === selectedModel)?.name || selectedModel}
          </div>
        </div>
      )}

      {report && !analyzing && (
        <div style={{
          background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden'
        }}>
          {/* 报告头部 */}
          <div 
            onClick={() => setReportExpanded(!reportExpanded)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', cursor: 'pointer',
              background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
              color: '#FFF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>📊</span>
              <span style={{ fontWeight: '700', fontSize: '14px' }}>AI 决策分析报告</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {reportMeta && (
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                  {reportMeta.model} · {(reportMeta.elapsed / 1000).toFixed(1)}s
                </span>
              )}
              <span style={{ fontSize: '12px' }}>{reportExpanded ? '▼' : '▶'}</span>
            </div>
          </div>

          {/* 报告内容 - Markdown渲染 */}
          {reportExpanded && (
            <div style={{ padding: '20px', fontSize: '13px', lineHeight: '1.8', color: '#334155' }}>
              <MarkdownRenderer content={report} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== Markdown 简易渲染器 ====================
const MarkdownRenderer = ({ content }) => {
  if (!content) return null;
  
  const lines = content.split('\n');
  const result = [];
  let inCode = false;
  let codeLines = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCode) {
        result.push(
          <pre key={key++} style={{
            background: '#1E293B', color: '#E2E8F0', borderRadius: '8px',
            padding: '14px', margin: '12px 0', fontSize: '12px', lineHeight: '1.7',
            whiteSpace: 'pre-wrap', overflow: 'auto'
          }}>
            {codeLines.map((cl, j) => (
              <div key={j} style={{
                color: cl.trim().startsWith('✅') ? '#4ADE80' :
                       cl.trim().startsWith('❌') ? '#F87171' :
                       cl.trim().startsWith('⏰') ? '#FBBF24' :
                       cl.trim().startsWith('【') ? '#FB923C' : '#E2E8F0'
              }}>{cl}</div>
            ))}
          </pre>
        );
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) { codeLines.push(line); continue; }

    // Headers
    if (trimmed.startsWith('### ')) {
      result.push(<h4 key={key++} style={{ color: '#F59E0B', fontSize: '14px', fontWeight: '600', margin: '20px 0 8px', borderLeft: '3px solid #F59E0B', paddingLeft: '10px' }}>{trimmed.slice(4)}</h4>);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      result.push(<h3 key={key++} style={{ color: '#FF6B35', fontSize: '16px', fontWeight: '700', margin: '24px 0 10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,107,53,0.3)' }}>{trimmed.slice(3)}</h3>);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      result.push(<h2 key={key++} style={{ color: '#1E293B', fontSize: '18px', fontWeight: '700', margin: '20px 0 12px' }}>{trimmed.slice(2)}</h2>);
      continue;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      result.push(<hr key={key++} style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '16px 0' }} />);
      continue;
    }

    // Bold inline
    let processed = trimmed;
    // Table rows
    if (processed.startsWith('|') && processed.endsWith('|')) {
      // Simple table rendering
      const cells = processed.split('|').filter(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c.trim()))) continue; // separator row
      const isHeader = i > 0 && lines[i+1]?.trim().startsWith('|') && lines[i+1]?.includes('---');
      result.push(
        <div key={key++} style={{
          display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
          gap: '0', fontSize: '11px', borderBottom: '1px solid #F1F5F9',
          background: isHeader ? '#F8FAFC' : 'transparent'
        }}>
          {cells.map((cell, j) => (
            <div key={j} style={{
              padding: '6px 8px', textAlign: 'center',
              fontWeight: isHeader ? '600' : '400',
              color: isHeader ? '#64748B' : '#334155',
              borderRight: j < cells.length - 1 ? '1px solid #F1F5F9' : 'none'
            }}>{cell.trim()}</div>
          ))}
        </div>
      );
      continue;
    }

    // List items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = trimmed.slice(2);
      result.push(
        <div key={key++} style={{ display: 'flex', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
          <span style={{ color: '#FF6B35', fontWeight: '700' }}>•</span>
          <span dangerouslySetInnerHTML={{ __html: boldInline(text) }} />
        </div>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)[1];
      const text = trimmed.replace(/^\d+\.\s/, '');
      result.push(
        <div key={key++} style={{ display: 'flex', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
          <span style={{ color: '#FF6B35', fontWeight: '700', minWidth: '18px' }}>{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: boldInline(text) }} />
        </div>
      );
      continue;
    }

    // Special lines
    if (trimmed.startsWith('✅') || trimmed.startsWith('❌') || trimmed.startsWith('⏰') || trimmed.startsWith('📌') || trimmed.startsWith('⚠️')) {
      const color = trimmed.startsWith('✅') ? '#10B981' : trimmed.startsWith('❌') ? '#EF4444' : trimmed.startsWith('⏰') ? '#F59E0B' : '#FF6B35';
      result.push(<div key={key++} style={{ color, fontWeight: '500', margin: '4px 0', paddingLeft: '8px' }}>{trimmed}</div>);
      continue;
    }

    if (trimmed.startsWith('【') && trimmed.endsWith('】')) {
      result.push(<div key={key++} style={{ color: '#FF6B35', fontWeight: '700', fontSize: '13px', margin: '12px 0 6px' }}>{trimmed}</div>);
      continue;
    }

    // Empty line
    if (!trimmed) { result.push(<div key={key++} style={{ height: '8px' }} />); continue; }

    // Normal paragraph
    result.push(<p key={key++} style={{ margin: '4px 0' }} dangerouslySetInnerHTML={{ __html: boldInline(trimmed) }} />);
  }

  return <>{result}</>;
};

function boldInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1E293B;font-weight:600">$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:#F1F5F9;padding:1px 5px;border-radius:4px;font-size:12px;color:#FF6B35">$1</code>');
}

// ==================== 店铺决策占位 ====================
const ShopDecision = () => (
  <div style={{
    background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0',
    padding: '40px', textAlign: 'center'
  }}>
    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏪</div>
    <div style={{ color: '#64748B', fontSize: '14px', fontWeight: '600' }}>店铺决策模块</div>
    <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '4px' }}>即将开放，敬请期待</div>
  </div>
);

export { SkuDecision, ShopDecision };
