/**
 * SKU利润表格组件 - 独立日期查询 + 分页 + 合计摘要
 */
import React, { Fragment, useState, useMemo, useCallback, useEffect } from 'react';
import { formatCNY } from '../../../utils/format';
import { getSkuQuadrant } from '../../../utils/helpers';

const PAGE_SIZE = 20;
const statusList = [
  { key: 'all', label: '全部' },
  { key: 'profit', label: '盈利' },
  { key: 'loss', label: '亏损' },
];

export function SkuTable({ data: parentData, shops: parentShops, loading: parentLoading, quadrantFilter }) {
  const [expandedSku, setExpandedSku] = useState(null);
  const [selectedShop, setSelectedShop] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 独立日期查询
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customData, setCustomData] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);

  useEffect(() => {
    const now = new Date(Date.now() + 7 * 3600000);
    const todayStr = now.toISOString().split('T')[0];
    setStartDate(todayStr);
    setEndDate(todayStr);
  }, []);

  const fetchCustomData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setCustomLoading(true);
    try {
      const res = await fetch(`/api/profit/sku-list?startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();
      if (json.success) {
        setCustomData({ data: json.data || [], shops: json.shops || [] });
        setUseCustomDate(true);
        setCurrentPage(1);
      }
    } catch (err) { console.error(err); }
    setCustomLoading(false);
  }, [startDate, endDate]);

  const clearCustomDate = () => {
    setUseCustomDate(false);
    setCustomData(null);
    setCurrentPage(1);
  };

  const activeData = useCustomDate && customData ? customData.data : (parentData || []);
  const activeShops = useCustomDate && customData ? customData.shops : (parentShops || []);
  const isLoading = useCustomDate ? customLoading : parentLoading;
  const shopList = ['全部', ...activeShops];

  // 筛选
  const filteredData = useMemo(() => {
    let result = [...activeData];
    if (selectedShop !== '全部') result = result.filter(s => s.store === selectedShop);
    if (selectedStatus === 'profit') result = result.filter(s => s.profit > 0);
    else if (selectedStatus === 'loss') result = result.filter(s => s.profit <= 0);
    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();
      result = result.filter(s => s.sku.toLowerCase().includes(keyword) || s.name.toLowerCase().includes(keyword));
    }
    if (quadrantFilter) result = result.filter(s => getSkuQuadrant(s) === quadrantFilter);
    return result;
  }, [activeData, selectedShop, selectedStatus, searchText, quadrantFilter]);

  // 筛选变化时重置页码
  useEffect(() => { setCurrentPage(1); }, [selectedShop, selectedStatus, searchText, quadrantFilter]);

  // 分页
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 合计（基于全部筛选数据，不只当前页）
  const totals = useMemo(() => ({
    skus: filteredData.length,
    orders: filteredData.reduce((s, d) => s + d.orders, 0),
    revenue: filteredData.reduce((s, d) => s + d.revenue, 0),
    totalCost: filteredData.reduce((s, d) => s + d.cost + d.packing, 0),
    ad: filteredData.reduce((s, d) => s + d.ad, 0),
    profit: filteredData.reduce((s, d) => s + d.profit, 0),
  }), [filteredData]);

  const handleExport = () => {
    const headers = ['SKU编码', '商品名称', '店铺', '订单数', '回款(CNY)', '商品成本', '包材费', '广告费', '净利润', 'ROI', '利润率'];
    const rows = filteredData.map(sku => [
      sku.sku, sku.name, sku.store, sku.orders,
      sku.revenue.toFixed(2), sku.cost.toFixed(2), sku.packing.toFixed(2),
      sku.ad.toFixed(2), sku.profit.toFixed(2),
      sku.roi < 900 ? sku.roi.toFixed(2) : '∞', sku.rate.toFixed(1) + '%'
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SKU利润数据_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* 独立日期查询栏 */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <span className="text-sm font-medium text-gray-600">📅 自定义日期:</span>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" />
        <span className="text-gray-400">至</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" />
        <button onClick={fetchCustomData} disabled={customLoading}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {customLoading ? '查询中...' : '查询'}
        </button>
        {useCustomDate && (
          <>
            <button onClick={clearCustomDate}
              className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300">恢复默认</button>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              当前: {startDate} 至 {endDate}
            </span>
          </>
        )}
      </div>

      {/* 筛选栏 + 合计摘要 */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">店铺:</span>
            <select value={selectedShop} onChange={e => setSelectedShop(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              {shopList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">状态:</span>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              {statusList.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="relative">
            <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
              placeholder="搜索SKU名称或编码..."
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm w-56" />
            {searchText && (
              <button onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <span className="text-gray-500">{totals.skus}个SKU</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">出单<span className="font-bold text-gray-700 ml-0.5">{totals.orders}</span></span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">回款<span className="font-bold text-blue-600 ml-0.5">{formatCNY(totals.revenue)}</span></span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">成本<span className="font-bold text-orange-600 ml-0.5">{formatCNY(totals.totalCost)}</span></span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">广告<span className="font-bold text-pink-600 ml-0.5">{formatCNY(totals.ad)}</span></span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">利润<span className={`font-bold ml-0.5 ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCNY(totals.profit)}</span></span>
          </div>
          <button onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 whitespace-nowrap">导出Excel</button>
        </div>
      </div>

      {/* 表格 */}
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${isLoading ? 'animate-pulse' : ''}`}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">SKU编码</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">商品名称</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">店铺</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">订单数</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">回款(CNY)</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">总成本</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">广告费</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">净利润</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">ROI</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">利润率</th>
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr><td colSpan="10" className="px-4 py-12 text-center text-gray-500">{isLoading ? '加载中...' : '暂无数据'}</td></tr>
            ) : pagedData.map((sku) => {
              const quadrant = getSkuQuadrant(sku);
              return (
                <Fragment key={sku.sku}>
                  <tr onClick={() => setExpandedSku(expandedSku === sku.sku ? null : sku.sku)}
                    className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition ${expandedSku === sku.sku ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-gray-400 transform transition-transform text-xs ${expandedSku === sku.sku ? 'rotate-90' : ''}`}>▶</span>
                        <span className="font-medium text-gray-800 text-xs">{sku.sku}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="max-w-[180px] truncate text-gray-700 font-medium" title={sku.name}>{sku.name}</div></td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{sku.store}</span></td>
                    <td className="px-4 py-3 text-right text-gray-700 font-medium">{sku.orders}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCNY(sku.revenue)}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatCNY(sku.cost + sku.packing)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{formatCNY(sku.ad)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${sku.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {sku.profit >= 0 ? '+' : ''}{formatCNY(sku.profit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        sku.roi >= 4 ? 'bg-green-100 text-green-700' : sku.roi >= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{sku.roi >= 900 ? '∞' : sku.roi.toFixed(1)}{sku.roi >= 4 ? ' ✓' : ''}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${sku.rate > 30 ? 'text-green-600' : sku.rate > 0 ? 'text-yellow-600' : 'text-red-600'}`}>{sku.rate.toFixed(1)}%</span>
                    </td>
                  </tr>
                  {expandedSku === sku.sku && (
                    <tr>
                      <td colSpan="10" className="bg-gray-50 p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">💰 成本明细</h4>
                            <div className="space-y-2">
                              {[
                                { label: '商品成本', value: sku.cost, color: 'text-blue-600' },
                                { label: '包材费', value: sku.packing, color: 'text-pink-600' },
                                { label: '广告费', value: sku.ad, color: 'text-orange-600' },
                              ].map((item, i) => (
                                <div key={i} className="flex justify-between py-1.5 border-b border-gray-100">
                                  <span className="text-sm text-gray-600">{item.label}</span>
                                  <span className={`text-sm font-medium ${item.color}`}>{formatCNY(item.value)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between py-2 bg-gray-50 rounded px-2 mt-1">
                                <span className="font-semibold text-gray-700">总成本</span>
                                <span className="font-bold text-gray-800">{formatCNY(sku.cost + sku.packing + sku.ad)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 效率指标</h4>
                            <div className="space-y-2">
                              {[
                                { label: '单均回款', value: formatCNY(sku.orders > 0 ? sku.revenue / sku.orders : 0) },
                                { label: '单均成本', value: formatCNY(sku.orders > 0 ? (sku.cost + sku.packing) / sku.orders : 0) },
                                { label: '单均利润', value: formatCNY(sku.orders > 0 ? sku.profit / sku.orders : 0) },
                                { label: '广告占比', value: sku.revenue > 0 ? `${(sku.ad / sku.revenue * 100).toFixed(1)}%` : '0%' },
                              ].map((item, i) => (
                                <div key={i} className="flex justify-between py-1.5 border-b border-gray-100">
                                  <span className="text-sm text-gray-600">{item.label}</span>
                                  <span className="text-sm font-medium text-gray-800">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">🤖 SKU诊断</h4>
                            <div className="space-y-2">
                              <div className={`px-3 py-2 rounded-lg text-sm ${
                                quadrant === 'star' ? 'bg-green-50 text-green-700' :
                                quadrant === 'potential' ? 'bg-blue-50 text-blue-700' :
                                quadrant === 'thin' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {quadrant === 'star' && '⭐ 明星SKU - 高ROI高利润，核心盈利产品'}
                                {quadrant === 'potential' && '🚀 潜力SKU - 高ROI低销量，建议加大推广'}
                                {quadrant === 'thin' && '📉 薄利SKU - 低ROI高销量，优化广告或提价'}
                                {quadrant === 'problem' && '⚠️ 问题SKU - ROI<2或亏损，需立即调整'}
                              </div>
                              {sku.ad > 0 && sku.roi < 2 && (
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">⚡ 广告ROI过低({sku.roi.toFixed(1)})，建议降低出价或暂停广告</div>
                              )}
                              {sku.ad === 0 && sku.orders >= 5 && (
                                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">✅ 自然流量出单，无广告成本，利润率优秀</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            共 {filteredData.length} 条，第 {currentPage}/{totalPages} 页
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">首页</button>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">上一页</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) { page = i + 1; }
              else if (currentPage <= 3) { page = i + 1; }
              else if (currentPage >= totalPages - 2) { page = totalPages - 4 + i; }
              else { page = currentPage - 2 + i; }
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-sm rounded-lg ${
                    currentPage === page ? 'bg-orange-500 text-white' : 'border border-gray-300 hover:bg-gray-50'
                  }`}>{page}</button>
              );
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">下一页</button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">末页</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SkuTable;
