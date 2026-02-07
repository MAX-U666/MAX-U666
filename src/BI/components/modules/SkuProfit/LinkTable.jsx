/**
 * 链接利润组件（独立模块）
 * 自带日期筛选、店铺过滤、概览统计
 */
import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { formatCNY } from '../../../utils/format';
import { authFetch } from '../../../utils/helpers';

const PAGE_SIZE = 20;

export function LinkTable() {
  const [dateRange, setDateRange] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [shop, setShop] = useState('');
  const [shops, setShops] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedLink, setExpandedLink] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const now = new Date(Date.now() + 7 * 3600000);
    setCustomStart(now.toISOString().split('T')[0]);
    setCustomEnd(now.toISOString().split('T')[0]);
  }, []);

  const fetchData = useCallback(async (useCustom = false) => {
    setLoading(true);
    try {
      let url;
      if (useCustom && customStart && customEnd) {
        url = `/api/profit/link-list?startDate=${customStart}&endDate=${customEnd}`;
      } else {
        url = `/api/profit/link-list?range=${dateRange}`;
      }
      if (shop) url += `&shop=${encodeURIComponent(shop)}`;
      const res = await authFetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
        const allShops = [...new Set((json.data || []).map(l => l.store).filter(Boolean))];
        setShops(allShops);
      }
    } catch (e) {
      console.error('链接利润加载失败:', e);
    }
    setLoading(false);
  }, [dateRange, customStart, customEnd, shop]);

  useEffect(() => { fetchData(); }, [dateRange, shop]);

  const filtered = searchKeyword
    ? data.filter(l => {
        const kw = searchKeyword.toLowerCase();
        return l.itemId.includes(kw) || l.mainName.toLowerCase().includes(kw) ||
          l.skus.some(s => s.sku.toLowerCase().includes(kw) || s.name.toLowerCase().includes(kw));
      })
    : data;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const overview = filtered.reduce((t, l) => ({
    links: t.links + 1, orders: t.orders + l.orders, revenue: t.revenue + l.revenue,
    cost: t.cost + l.cost, packing: t.packing + l.packing, ad: t.ad + l.ad, profit: t.profit + l.profit,
  }), { links: 0, orders: 0, revenue: 0, cost: 0, packing: 0, ad: 0, profit: 0 });

  const hasAd = filtered.filter(l => l.ad > 0).length;
  const noAd = filtered.length - hasAd;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span>🔗</span> 链接利润分析
      </h3>

      {/* 日期筛选 */}
      <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
        {[
          { key: 'today', label: '今日' }, { key: 'yesterday', label: '昨日' },
          { key: '7d', label: '近7天' }, { key: '30d', label: '近30天' }
        ].map(item => (
          <button key={item.key} onClick={() => { setDateRange(item.key); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              dateRange === item.key ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}>{item.label}</button>
        ))}
        <span className="text-gray-300 mx-1">|</span>
        <span className="text-gray-400">📅</span>
        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <span className="text-gray-400">至</span>
        <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <button onClick={() => { setDateRange('custom'); fetchData(true); setCurrentPage(1); }}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700">查询</button>
      </div>

      {/* 店铺 + 搜索 + 概览 */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">店铺:</span>
          <select value={shop} onChange={e => { setShop(e.target.value); setCurrentPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">全部</option>
            {shops.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <input type="text" placeholder="搜索链接ID或商品名称..."
          value={searchKeyword} onChange={e => { setSearchKeyword(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64" />
        <div className="flex items-center gap-3 ml-auto text-xs flex-wrap">
          <span className="text-gray-500">{overview.links}个链接</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">有广告<span className="font-bold text-orange-600 ml-1">{hasAd}</span></span>
          <span className="text-gray-500">无广告<span className="font-bold text-gray-600 ml-1">{noAd}</span></span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">订单<span className="font-bold text-gray-800 ml-1">{overview.orders.toLocaleString()}</span></span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">回款<span className="font-bold text-blue-600 ml-1">{formatCNY(overview.revenue)}</span></span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">广告<span className="font-bold text-orange-600 ml-1">{formatCNY(overview.ad)}</span></span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">利润<span className={`font-bold ml-1 ${overview.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCNY(overview.profit)}</span></span>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">链接ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">主商品</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">店铺</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">仓库</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">SKU数</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">订单</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">回款</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">成本</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">打包</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">广告费</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">利润</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">ROI</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">利润率</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="13" className="px-4 py-12 text-center text-gray-400">加载中...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan="13" className="px-4 py-12 text-center text-gray-500">暂无数据</td></tr>
            ) : (
              <>
                {paged.map(link => (
                  <Fragment key={link.itemId}>
                    <tr onClick={() => setExpandedLink(expandedLink === link.itemId ? null : link.itemId)}
                      className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition ${expandedLink === link.itemId ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-gray-400 transform transition-transform text-xs ${expandedLink === link.itemId ? 'rotate-90' : ''}`}>▶</span>
                          <span className="font-mono text-xs text-gray-700">{link.itemId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[180px] truncate text-gray-700 font-medium" title={link.mainName}>{link.mainName}</div>
                        {link.skuCount > 1 && <div className="text-xs text-gray-400">+{link.skuCount - 1}个规格</div>}
                      </td>
                      <td className="px-4 py-3 text-center"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{link.store}</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs text-gray-500">{link.warehouse}</span></td>
                      <td className="px-4 py-3 text-right text-gray-600">{link.skuCount}</td>
                      <td className="px-4 py-3 text-right text-gray-700 font-medium">{link.orders}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCNY(link.revenue)}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{formatCNY(link.cost)}</td>
                      <td className="px-4 py-3 text-right text-pink-600">{formatCNY(link.packing)}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{formatCNY(link.ad)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${link.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {link.profit >= 0 ? '+' : ''}{formatCNY(link.profit)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          link.roi >= 4 ? 'bg-green-100 text-green-700' : link.roi >= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>{link.roi >= 900 ? '∞' : link.roi.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${link.rate > 30 ? 'text-green-600' : link.rate > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {link.rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                    {expandedLink === link.itemId && (
                      <tr>
                        <td colSpan="13" className="bg-gray-50 p-4">
                          <div className="text-xs font-medium text-gray-500 mb-3">
                            链接 {link.itemId} 下共 {link.skus.length} 个SKU，广告费 {formatCNY(link.ad)} 按订单量分摊：
                          </div>
                          <table className="w-full text-xs">
                            <thead className="text-gray-400 border-b border-gray-200">
                              <tr>
                                <th className="text-left py-2 px-3">SKU编码</th>
                                <th className="text-left py-2 px-3">商品名称</th>
                                <th className="text-right py-2 px-3">订单</th>
                                <th className="text-right py-2 px-3">件数</th>
                                <th className="text-right py-2 px-3">回款</th>
                                <th className="text-right py-2 px-3">成本</th>
                                <th className="text-right py-2 px-3">打包</th>
                                <th className="text-right py-2 px-3">广告(分摊)</th>
                                <th className="text-right py-2 px-3">利润</th>
                                <th className="text-right py-2 px-3">占比</th>
                              </tr>
                            </thead>
                            <tbody>
                              {link.skus.map((s, i) => (
                                <tr key={i} className="border-b border-gray-100 hover:bg-white">
                                  <td className="py-2 px-3 font-mono text-gray-700">{s.sku}</td>
                                  <td className="py-2 px-3 text-gray-600 max-w-[180px] truncate" title={s.name}>{s.name}</td>
                                  <td className="text-right py-2 px-3 font-medium">{s.orders}</td>
                                  <td className="text-right py-2 px-3">{s.qty}</td>
                                  <td className="text-right py-2 px-3">{formatCNY(s.revenue)}</td>
                                  <td className="text-right py-2 px-3 text-blue-600">{formatCNY(s.cost)}</td>
                                  <td className="text-right py-2 px-3 text-pink-600">{formatCNY(s.packing)}</td>
                                  <td className="text-right py-2 px-3 text-orange-600">{formatCNY(s.ad)}</td>
                                  <td className={`text-right py-2 px-3 font-bold ${s.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {s.profit >= 0 ? '+' : ''}{formatCNY(s.profit)}
                                  </td>
                                  <td className="text-right py-2 px-3 text-gray-400">
                                    {link.orders > 0 ? (s.orders / link.orders * 100).toFixed(1) : 0}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold text-sm">
                  <td className="px-4 py-3" colSpan="5">合计 ({filtered.length}个链接)</td>
                  <td className="text-right px-4 py-3">{overview.orders.toLocaleString()}</td>
                  <td className="text-right px-4 py-3">{formatCNY(overview.revenue)}</td>
                  <td className="text-right px-4 py-3 text-blue-600">{formatCNY(overview.cost)}</td>
                  <td className="text-right px-4 py-3 text-pink-600">{formatCNY(overview.packing)}</td>
                  <td className="text-right px-4 py-3 text-orange-600">{formatCNY(overview.ad)}</td>
                  <td className={`text-right px-4 py-3 ${overview.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {overview.profit >= 0 ? '+' : ''}{formatCNY(overview.profit)}
                  </td>
                  <td className="text-center px-4 py-3 text-purple-600">
                    {overview.ad > 0 ? (overview.revenue / overview.ad).toFixed(1) : '∞'}
                  </td>
                  <td className="text-right px-4 py-3">
                    {overview.revenue > 0 ? (overview.profit / overview.revenue * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-200 text-sm disabled:opacity-30 hover:bg-gray-50">&lt;</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let page;
            if (totalPages <= 7) page = i + 1;
            else if (currentPage <= 4) page = i + 1;
            else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
            else page = currentPage - 3 + i;
            return (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded text-sm ${currentPage === page ? 'bg-orange-500 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>
                {page}
              </button>
            );
          })}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-gray-200 text-sm disabled:opacity-30 hover:bg-gray-50">&gt;</button>
        </div>
      )}
    </div>
  );
}

export default LinkTable;
