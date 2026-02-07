import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '../BI/utils/helpers';

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
    authFetch('/api/decision/models')
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
        const r = await authFetch(`/api/decision/sku/search?q=${encodeURIComponent(searchQuery)}`);
        const d = await r.json();
        if (d.success) { setSearchResults(d.data); setShowDropdown(d.data.length > 0); }
      } catch (e) { console.error(e); }
      setSearching(false);
    }, 300);
  }, [searchQuery]);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectSku = async (item) => {
    setSelectedSku(item);
    setSearchQuery(item.item_id);
    setShowDropdown(false);
    setReport(null);
    setLoadingData(true);
    try {
      const r = await authFetch(`/api/decision/sku/${item.item_id}/data?days=7`);
      const d = await r.json();
      if (d.success) setSkuData(d);
    } catch (e) { console.error(e); }
    setLoadingData(false);
  };

  const handleSearchSubmit = async (e) => {
    if (e.key !== 'Enter' || !searchQuery.trim()) return;
    setShowDropdown(false);
    setReport(null);
    setSelectedSku({ item_id: searchQuery.trim(), name: '' });
    setLoadingData(true);
    try {
      const r = await authFetch(`/api/decision/sku/${searchQuery.trim()}/data?days=7`);
      const d = await r.json();
      if (d.success) {
        setSkuData(d);
        if (d.product) setSelectedSku({ item_id: searchQuery.trim(), name: d.product.name, sku_id: d.product.sku_id });
      }
    } catch (e) { console.error(e); }
    setLoadingData(false);
  };

  const handleAnalyze = async () => {
    if (!selectedSku?.item_id) return;
    setAnalyzing(true);
    setReport(null);
    try {
      const r = await authFetch(`/api/decision/sku/${selectedSku.item_id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel })
      });
      const d = await r.json();
      if (d.success) {
        setReport(d.report);
        setReportMeta({ model: d.model_name, elapsed: d.elapsed_ms, context: d.data_context });
      } else { alert('分析失败: ' + d.error); }
    } catch (e) { alert('分析失败: ' + e.message); }
    setAnalyzing(false);
  };

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder="🔍 输入链接ID / SKU编码 / 商品名搜索..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">搜索中...</span>
          )}
        </div>

        {/* 搜索下拉 */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSku(item)}
                className="px-4 py-3 cursor-pointer hover:bg-orange-50 border-b border-gray-50 last:border-b-0 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{item.item_id}</div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{item.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-orange-500">{item.recent_orders}单/30天</div>
                    <div className="text-xs text-gray-400">{item.shop_name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 选中SKU信息 + 模型选择 */}
      {selectedSku && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <span className="text-orange-500">🔗</span> {selectedSku.item_id}
              </div>
              {(selectedSku.name || skuData?.product?.name) && (
                <div className="text-xs text-gray-500 mt-1 max-w-md truncate">
                  {selectedSku.name || skuData?.product?.name}
                </div>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white cursor-pointer outline-none focus:border-orange-400"
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
                className={`px-5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${
                  analyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-sm'
                }`}
              >
                {analyzing ? '⏳ 分析中...' : '🧠 开始分析'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 数据加载中 */}
      {loadingData && (
        <div className="text-center py-10 text-gray-400 text-sm">⏳ 正在加载SKU数据...</div>
      )}

      {/* 7日数据概览 */}
      {skuData && !loadingData && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* 汇总卡片 */}
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
            <SummaryCard label="7日订单" value={skuData.summary.total_orders} suffix="单" color="text-orange-500" />
            <SummaryCard label="7日营收" value={`¥${skuData.summary.total_revenue_cny}`} color="text-emerald-500" />
            <SummaryCard label="7日利润" value={`¥${skuData.summary.total_profit_cny}`}
              color={skuData.summary.total_profit_cny >= 0 ? 'text-emerald-500' : 'text-red-500'} />
            <SummaryCard label="平均ROI" value={skuData.summary.avg_roi}
              color={skuData.summary.avg_roi >= 3 ? 'text-emerald-500' : 'text-amber-500'} />
          </div>

          {/* 每日明细表 */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  {['日期', '订单', '营收¥', '广告¥', '利润¥', '利润率', '曝光', '点击', 'CTR', 'CVR', 'ROI', '自然单%'].map(h => (
                    <th key={h} className="px-2.5 py-2.5 text-center font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skuData.daily.map((d, i) => {
                  const nr = d.orders > 0 ? Math.round(d.natural_orders / d.orders * 100) : 0;
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                      <td className="px-2.5 py-2 text-center text-gray-600 font-medium">{d.date}</td>
                      <td className="px-2.5 py-2 text-center font-semibold text-gray-800">{d.orders}</td>
                      <td className="px-2.5 py-2 text-center text-emerald-600">{d.revenue_cny}</td>
                      <td className="px-2.5 py-2 text-center text-amber-600">{d.ad_spend_cny}</td>
                      <td className={`px-2.5 py-2 text-center font-semibold ${d.profit_cny >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{d.profit_cny}</td>
                      <td className={`px-2.5 py-2 text-center ${d.profit_rate >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{d.profit_rate}%</td>
                      <td className="px-2.5 py-2 text-center text-gray-500">{d.impressions.toLocaleString()}</td>
                      <td className="px-2.5 py-2 text-center text-gray-500">{d.clicks}</td>
                      <td className="px-2.5 py-2 text-center text-gray-500">{d.ctr}%</td>
                      <td className={`px-2.5 py-2 text-center ${d.cvr >= 2 ? 'text-emerald-600' : 'text-amber-500'}`}>{d.cvr}%</td>
                      <td className={`px-2.5 py-2 text-center font-semibold ${d.roi >= 3 ? 'text-emerald-600' : d.roi >= 2 ? 'text-amber-500' : 'text-red-500'}`}>{d.roi}</td>
                      <td className={`px-2.5 py-2 text-center ${nr >= 40 ? 'text-emerald-600' : 'text-gray-500'}`}>{nr}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI分析中 */}
      {analyzing && (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <div className="text-3xl mb-3">🧠</div>
          <div className="text-sm text-gray-500">AI 正在分析中，请稍候...</div>
          <div className="text-xs text-gray-400 mt-1">
            使用模型: {availableModels.find(m => m.key === selectedModel)?.name || selectedModel}
          </div>
        </div>
      )}

      {/* AI分析报告 */}
      {report && !analyzing && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div
            onClick={() => setReportExpanded(!reportExpanded)}
            className="flex justify-between items-center px-5 py-3.5 cursor-pointer bg-gray-800 text-white"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📊</span>
              <span className="font-bold text-sm">AI 决策分析报告</span>
            </div>
            <div className="flex items-center gap-3">
              {reportMeta && (
                <span className="text-xs text-gray-400">
                  {reportMeta.model} · {(reportMeta.elapsed / 1000).toFixed(1)}s
                </span>
              )}
              <span className={`text-xs transition-transform ${reportExpanded ? 'rotate-180' : ''}`}>▼</span>
            </div>
          </div>
          {reportExpanded && (
            <div className="p-5 text-sm leading-relaxed text-gray-700 max-h-[600px] overflow-y-auto">
              <MarkdownRenderer content={report} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== 汇总卡片 ====================
const SummaryCard = ({ label, value, suffix, color }) => (
  <div className="py-4 px-3 text-center">
    <div className="text-xs text-gray-400 mb-1">{label}</div>
    <div className={`text-xl font-bold ${color}`}>{value}{suffix || ''}</div>
  </div>
);

// ==================== Markdown渲染器 ====================
const MarkdownRenderer = ({ content }) => {
  if (!content) return null;
  const lines = content.split('\n');
  const result = [];
  let inCode = false, codeLines = [], k = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();

    if (t.startsWith('```')) {
      if (inCode) {
        result.push(
          <pre key={k++} className="bg-gray-800 text-gray-200 rounded-lg p-4 my-3 text-xs leading-relaxed whitespace-pre-wrap overflow-auto">
            {codeLines.map((cl, j) => {
              const ct = cl.trim();
              let cls = 'text-gray-200';
              if (ct.startsWith('✅')) cls = 'text-green-400';
              else if (ct.startsWith('❌')) cls = 'text-red-400';
              else if (ct.startsWith('⏰')) cls = 'text-yellow-400';
              else if (ct.startsWith('【')) cls = 'text-orange-400';
              return <div key={j} className={cls}>{cl}</div>;
            })}
          </pre>
        );
        codeLines = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    // Headers
    if (t.startsWith('### ')) {
      result.push(<h4 key={k++} className="text-amber-500 text-sm font-semibold mt-5 mb-2 pl-3 border-l-3 border-amber-400">{t.slice(4)}</h4>);
      continue;
    }
    if (t.startsWith('## ')) {
      result.push(<h3 key={k++} className="text-orange-500 text-base font-bold mt-6 mb-2 pb-2 border-b border-orange-200">{t.slice(3)}</h3>);
      continue;
    }
    if (t.startsWith('# ')) {
      result.push(<h2 key={k++} className="text-gray-800 text-lg font-bold mt-5 mb-3">{t.slice(2)}</h2>);
      continue;
    }

    if (t === '---' || t === '***') {
      result.push(<hr key={k++} className="border-gray-200 my-4" />);
      continue;
    }

    // Table
    if (t.startsWith('|') && t.endsWith('|')) {
      const cells = t.split('|').filter(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c.trim()))) continue;
      result.push(
        <div key={k++} className="flex text-xs border-b border-gray-100">
          {cells.map((cell, j) => (
            <div key={j} className="flex-1 px-2 py-1.5 text-center text-gray-600">{cell.trim()}</div>
          ))}
        </div>
      );
      continue;
    }

    // Lists
    if (t.startsWith('- ') || t.startsWith('* ')) {
      result.push(
        <div key={k++} className="flex gap-2 my-1 pl-2">
          <span className="text-orange-500 font-bold">•</span>
          <span dangerouslySetInnerHTML={{ __html: inlineFmt(t.slice(2)) }} />
        </div>
      );
      continue;
    }
    if (/^\d+\.\s/.test(t)) {
      const num = t.match(/^(\d+)\./)[1];
      result.push(
        <div key={k++} className="flex gap-2 my-1 pl-2">
          <span className="text-orange-500 font-bold min-w-[18px]">{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: inlineFmt(t.replace(/^\d+\.\s/, '')) }} />
        </div>
      );
      continue;
    }

    // Special emoji lines
    if (t.startsWith('✅')) { result.push(<div key={k++} className="text-emerald-600 font-medium my-1 pl-2">{t}</div>); continue; }
    if (t.startsWith('❌')) { result.push(<div key={k++} className="text-red-500 font-medium my-1 pl-2">{t}</div>); continue; }
    if (t.startsWith('⏰')) { result.push(<div key={k++} className="text-amber-500 font-medium my-1 pl-2">{t}</div>); continue; }
    if (t.startsWith('⚠️')) { result.push(<div key={k++} className="text-amber-600 font-medium my-1 pl-2">{t}</div>); continue; }
    if (t.startsWith('【') && t.endsWith('】')) {
      result.push(<div key={k++} className="text-orange-500 font-bold text-sm mt-3 mb-1">{t}</div>);
      continue;
    }

    if (!t) { result.push(<div key={k++} className="h-2" />); continue; }

    result.push(<p key={k++} className="my-1" dangerouslySetInnerHTML={{ __html: inlineFmt(t) }} />);
  }
  return <>{result}</>;
};

function inlineFmt(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-800 font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-orange-600">$1</code>');
}

// ==================== 店铺决策占位 ====================
const ShopDecision = () => (
  <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
    <div className="text-5xl mb-3">🏪</div>
    <div className="text-gray-600 text-sm font-semibold">店铺决策模块</div>
    <div className="text-gray-400 text-xs mt-1">即将开放，敬请期待</div>
  </div>
);

export { SkuDecision, ShopDecision };
