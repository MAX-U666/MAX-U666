import React, { Fragment, useState, useMemo } from 'react';
import { formatCNY } from '../../../utils/format';

export function OrderTable({ data, shops, loading }) {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedShop, setSelectedShop] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchText, setSearchText] = useState('');

  const shopList = ['全部', ...(shops || [])];

  const filteredData = useMemo(() => {
    let result = [...(data || [])];
    if (selectedShop !== '全部') result = result.filter(o => o.store === selectedShop);
    if (selectedStatus === 'profit') result = result.filter(o => o.profit > 0);
    else if (selectedStatus === 'loss') result = result.filter(o => o.profit <= 0);
    if (searchText.trim()) {
      const kw = searchText.toLowerCase();
      result = result.filter(o =>
        o.id.toLowerCase().includes(kw) ||
        o.items.some(i => i.sku.toLowerCase().includes(kw) || i.name.toLowerCase().includes(kw))
      );
    }
    return result;
  }, [data, selectedShop, selectedStatus, searchText]);

  const handleExport = () => {
    const headers = ['订单号', '店铺', '日期', 'SKU', '数量', '回款', '成本', '包材', '广告费', '利润', '利润率'];
    const rows = filteredData.map(o => [
      o.id, o.store, o.date,
      o.items.map(i => i.sku).join('+'),
      o.qty,
      o.revenue.toFixed(2), o.cost.toFixed(2), o.packing.toFixed(2),
      o.ad.toFixed(2), o.profit.toFixed(2),
      o.revenue > 0 ? ((o.profit / o.revenue) * 100).toFixed(1) + '%' : '0%'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `订单利润_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* 筛选栏 */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-4">
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
              <option value="all">全部</option>
              <option value="profit">盈利</option>
              <option value="loss">亏损</option>
            </select>
          </div>
          <div className="relative">
            <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
              placeholder="搜索订单号或SKU..."
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm w-64" />
            {searchText && <button onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>}
          </div>
        </div>
        <button onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">导出Excel</button>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">订单号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">店铺</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">日期</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">SKU</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">数量</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">回款</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">成本</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">广告费</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">利润</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">利润率</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="px-4 py-12 text-center text-gray-400">加载中...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan="10" className="px-4 py-12 text-center text-gray-500">暂无数据</td></tr>
            ) : filteredData.map((order) => {
              const profitRate = order.revenue > 0 ? (order.profit / order.revenue) * 100 : 0;
              const mainSku = order.items[0] || {};
              return (
                <Fragment key={order.id}>
                  <tr onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition ${expandedOrder === order.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-gray-400 transform transition-transform text-xs ${expandedOrder === order.id ? 'rotate-90' : ''}`}>▶</span>
                        <span className="font-medium text-gray-800 text-xs">{order.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{order.store}</span></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{order.date}</td>
                    <td className="px-4 py-3">
                      <div className="max-w-[120px] truncate text-gray-700 text-xs" title={mainSku.name}>{mainSku.name || mainSku.sku}</div>
                      {order.items.length > 1 && <div className="text-xs text-gray-400">+{order.items.length - 1}个商品</div>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{order.qty}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCNY(order.revenue)}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatCNY(order.cost + order.packing)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{formatCNY(order.ad)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {order.profit >= 0 ? '+' : ''}{formatCNY(order.profit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${profitRate > 30 ? 'text-green-600' : profitRate > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {profitRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                  
                  {expandedOrder === order.id && (
                    <tr>
                      <td colSpan="10" className="bg-gray-50 p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">📦 订单明细</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-gray-500 pb-1 border-b">
                                <span>SKU</span><span>数量</span><span>回款</span><span>成本</span><span>利润</span>
                              </div>
                              {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs items-center">
                                  <span className="text-gray-700 truncate max-w-[120px]" title={item.name}>{item.name || item.sku}</span>
                                  <span className="text-gray-600">×{item.qty}</span>
                                  <span className="text-blue-600">{formatCNY(item.revenue)}</span>
                                  <span className="text-orange-600">{formatCNY(item.cost + item.packing)}</span>
                                  <span className={item.profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{formatCNY(item.profit)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">💰 费用汇总</h4>
                            <div className="space-y-2">
                              {[
                                { label: '平台回款', value: order.revenue, color: 'text-blue-600' },
                                { label: '商品成本', value: order.cost, color: 'text-orange-500', neg: true },
                                { label: '包材费', value: order.packing, color: 'text-pink-500', neg: true },
                                { label: '广告费', value: order.ad, color: 'text-red-500', neg: true },
                              ].map((item, i) => (
                                <div key={i} className="flex justify-between py-1.5 border-b border-gray-100">
                                  <span className="text-sm text-gray-600">{item.label}</span>
                                  <span className={`text-sm font-medium ${item.color}`}>{item.neg ? '-' : ''}{formatCNY(item.value)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between py-2 bg-gray-50 rounded px-2 mt-1">
                                <span className="font-semibold text-gray-700">净利润</span>
                                <span className={`font-bold ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {order.profit >= 0 ? '+' : ''}{formatCNY(order.profit)}
                                </span>
                              </div>
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
          {filteredData.length > 0 && (
            <tfoot className="bg-gray-50">
              <tr className="font-semibold">
                <td className="px-4 py-4" colSpan="4">合计 ({filteredData.length} 单)</td>
                <td className="px-4 py-4 text-right">{filteredData.reduce((s, o) => s + o.qty, 0)}</td>
                <td className="px-4 py-4 text-right">{formatCNY(filteredData.reduce((s, o) => s + o.revenue, 0))}</td>
                <td className="px-4 py-4 text-right text-blue-600">{formatCNY(filteredData.reduce((s, o) => s + o.cost + o.packing, 0))}</td>
                <td className="px-4 py-4 text-right text-orange-600">{formatCNY(filteredData.reduce((s, o) => s + o.ad, 0))}</td>
                <td className="px-4 py-4 text-right text-green-600">{formatCNY(filteredData.reduce((s, o) => s + o.profit, 0))}</td>
                <td className="px-4 py-4 text-right">-</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
export default OrderTable;
