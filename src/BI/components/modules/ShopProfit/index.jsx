import React, { useState, useEffect, useCallback } from "react";
import { formatCNY } from "../../../utils/format";
import { ShopDetail } from "./ShopDetail";

export function ShopProfitModule() {
  const [dateRange, setDateRange] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [shopList, setShopList] = useState([]);
  const [totals, setTotals] = useState({ revenue: 0, orders: 0, profit: 0, ad: 0, cost: 0, packing: 0 });
  const [loading, setLoading] = useState(false);
  const [activeShopTab, setActiveShopTab] = useState(null);

  const fetchData = useCallback(async (useCustom = false) => {
    setLoading(true);
    try {
      let url;
      if (useCustom && customStart && customEnd) {
        url = `/api/profit/sku-list?startDate=${customStart}&endDate=${customEnd}`;
      } else {
        url = `/api/profit/sku-list?range=${dateRange}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (!json.success) return;

      // 按店铺聚合SKU数据
      const shopMap = {};
      (json.data || []).forEach(sku => {
        const store = sku.store || '未知';
        if (!shopMap[store]) {
          shopMap[store] = { id: store, orders: 0, qty: 0, revenue: 0, cost: 0, packing: 0, ad: 0, profit: 0, skus: [] };
        }
        const s = shopMap[store];
        s.orders += sku.orders || 0;
        s.qty += sku.qty || 0;
        s.revenue += sku.revenue || 0;
        s.cost += sku.cost || 0;
        s.packing += sku.packing || 0;
        s.ad += sku.ad || 0;
        s.profit += sku.profit || 0;
        s.skus.push(sku);
      });

      // 转数组，排序
      const list = Object.values(shopMap).map(s => ({
        ...s,
        roi: s.ad > 0 ? s.revenue / s.ad : 0,
        rate: s.revenue > 0 ? (s.profit / s.revenue) * 100 : 0,
        avgProfit: s.orders > 0 ? s.profit / s.orders : 0,
      })).sort((a, b) => b.profit - a.profit);

      setShopList(list);
      if (!activeShopTab && list.length > 0) setActiveShopTab(list[0].id);

      // 汇总
      const ov = json.overview || {};
      setTotals({
        revenue: ov.totalRevenue || 0,
        orders: ov.totalOrders || 0,
        profit: ov.totalProfit || 0,
        ad: ov.totalAd || 0,
        cost: ov.totalCost || 0,
        packing: ov.totalPacking || 0,
      });
    } catch (e) {
      console.error('店铺利润加载失败:', e);
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd, activeShopTab]);

  useEffect(() => { fetchData(); }, [dateRange]);

  const avgProfitPerOrder = totals.orders > 0 ? totals.profit / totals.orders : 0;
  const avgRoi = totals.ad > 0 ? totals.revenue / totals.ad : 0;
  const totalExpense = totals.cost + totals.packing + totals.ad;
  const costRate = totals.revenue > 0 ? (totals.cost / totals.revenue * 100) : 0;
  const adRate = totals.revenue > 0 ? (totals.ad / totals.revenue * 100) : 0;
  const packRate = totals.revenue > 0 ? (totals.packing / totals.revenue * 100) : 0;
  const profitRate = totals.revenue > 0 ? (totals.profit / totals.revenue * 100) : 0;

  return (
    <div className="space-y-5">
      {/* 日期选择 */}
      <div className="flex items-center gap-2 text-sm">
        {["today", "yesterday", "7d", "30d"].map(r => (
          <button key={r} onClick={() => setDateRange(r)}
            className={`px-4 py-2 rounded-lg font-medium transition ${dateRange === r && !customStart ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {r === 'today' ? '今日' : r === 'yesterday' ? '昨日' : r === '7d' ? '近7天' : '近30天'}
          </button>
        ))}
        <span className="text-gray-300 mx-1">|</span>
        <span className="text-gray-400">📅</span>
        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <span className="text-gray-400">至</span>
        <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <button onClick={() => fetchData(true)}
          className="bg-orange-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-orange-600">查询</button>
      </div>

      {loading && <div className="text-center py-8 text-gray-400">加载中...</div>}

      {!loading && (
        <>
          {/* A. 集团汇总 */}
          <div className="grid grid-cols-7 gap-4">
            {[
              { label: '总回款', value: formatCNY(totals.revenue), icon: '💰', bg: 'bg-blue-50', color: 'text-blue-600' },
              { label: '总订单', value: totals.orders.toLocaleString(), icon: '🛒', bg: 'bg-orange-50', color: 'text-orange-600' },
              { label: '总利润', value: formatCNY(totals.profit), icon: '✨', bg: 'bg-green-50', color: 'text-green-600' },
              { label: '单笔利润', value: formatCNY(avgProfitPerOrder), icon: '📝', bg: 'bg-emerald-50', color: 'text-emerald-600' },
              { label: '总广告', value: formatCNY(totals.ad), icon: '📢', bg: 'bg-red-50', color: 'text-red-600' },
              { label: '整体ROI', value: avgRoi.toFixed(2), icon: '📊', bg: 'bg-purple-50', color: 'text-purple-600' },
              { label: '总成本', value: formatCNY(totals.cost), icon: '📦', bg: 'bg-gray-50', color: 'text-gray-600' },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-xl p-4 border border-gray-100`}>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span>{item.icon}</span><span>{item.label}</span>
                </div>
                <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* B. 成本结构 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="text-sm font-semibold text-gray-800 mb-4">📊 成本结构占比</div>
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: '商品成本', value: totals.cost, pct: costRate, color: 'bg-blue-500' },
                { label: '广告费用', value: totals.ad, pct: adRate, color: 'bg-orange-500' },
                { label: '打包费用', value: totals.packing, pct: packRate, color: 'bg-green-500' },
                { label: '净利润率', value: totals.profit, pct: profitRate, color: 'bg-emerald-500' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-bold">{item.pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className={`${item.color} h-3 rounded-full`} style={{ width: `${Math.min(item.pct, 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{formatCNY(item.value)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* C. 店铺利润表格 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">🏪 店铺利润汇总</h3>
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 font-medium">店铺</th>
                  <th className="text-right py-3 font-medium">订单量</th>
                  <th className="text-right py-3 font-medium">回款</th>
                  <th className="text-right py-3 font-medium">商品成本</th>
                  <th className="text-right py-3 font-medium">打包费</th>
                  <th className="text-right py-3 font-medium">广告费</th>
                  <th className="text-right py-3 font-medium">利润</th>
                  <th className="text-right py-3 font-medium">利润率</th>
                  <th className="text-right py-3 font-medium">ROI</th>
                  <th className="text-right py-3 font-medium">单均利润</th>
                  <th className="text-center py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {shopList.map(s => (
                  <React.Fragment key={s.id}>
                    <tr className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setActiveShopTab(activeShopTab === s.id ? null : s.id)}>
                      <td className="py-3 font-medium text-gray-800">{s.id}</td>
                      <td className="text-right py-3">{s.orders.toLocaleString()}</td>
                      <td className="text-right py-3 text-blue-600">{formatCNY(s.revenue)}</td>
                      <td className="text-right py-3 text-gray-600">{formatCNY(s.cost)}</td>
                      <td className="text-right py-3 text-pink-500">{formatCNY(s.packing)}</td>
                      <td className="text-right py-3 text-orange-500">{formatCNY(s.ad)}</td>
                      <td className={`text-right py-3 font-bold ${s.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCNY(s.profit)}</td>
                      <td className={`text-right py-3 ${s.rate >= 0 ? 'text-green-600' : 'text-red-500'}`}>{s.rate.toFixed(1)}%</td>
                      <td className="text-right py-3 text-purple-600">{s.roi.toFixed(2)}</td>
                      <td className="text-right py-3">{formatCNY(s.avgProfit)}</td>
                      <td className="text-center py-3">
                        <span className="text-gray-400">{activeShopTab === s.id ? '▲' : '▼'}</span>
                      </td>
                    </tr>
                    {activeShopTab === s.id && (
                      <tr><td colSpan="11" className="p-0">
                        <ShopDetail shop={s} />
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
                {/* 合计行 */}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td className="py-3">合计</td>
                  <td className="text-right py-3">{totals.orders.toLocaleString()}</td>
                  <td className="text-right py-3 text-blue-600">{formatCNY(totals.revenue)}</td>
                  <td className="text-right py-3">{formatCNY(totals.cost)}</td>
                  <td className="text-right py-3 text-pink-500">{formatCNY(totals.packing)}</td>
                  <td className="text-right py-3 text-orange-500">{formatCNY(totals.ad)}</td>
                  <td className="text-right py-3 text-green-600">{formatCNY(totals.profit)}</td>
                  <td className="text-right py-3">{profitRate.toFixed(1)}%</td>
                  <td className="text-right py-3 text-purple-600">{avgRoi.toFixed(2)}</td>
                  <td className="text-right py-3">{formatCNY(avgProfitPerOrder)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default ShopProfitModule;
