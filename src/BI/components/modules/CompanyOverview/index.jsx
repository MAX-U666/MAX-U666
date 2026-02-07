/**
 * 公司总览 - 统一风格仪表盘，真实数据
 */
import React, { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCNY } from "../../../utils/format";

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#F97316'];

export function CompanyOverviewModule() {
  const [dateRange, setDateRange] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [shopList, setShopList] = useState([]);
  const [totals, setTotals] = useState({ revenue: 0, orders: 0, profit: 0, ad: 0, cost: 0, packing: 0 });
  const [skuStats, setSkuStats] = useState({ total: 0, profit: 0, loss: 0 });
  const [loading, setLoading] = useState(false);

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

      // 按店铺聚合
      const shopMap = {};
      let profitSkus = 0, lossSkus = 0;
      (json.data || []).forEach(sku => {
        const store = sku.store || '未知';
        if (!shopMap[store]) {
          shopMap[store] = { id: store, orders: 0, revenue: 0, cost: 0, packing: 0, ad: 0, profit: 0 };
        }
        const s = shopMap[store];
        s.orders += sku.orders || 0;
        s.revenue += sku.revenue || 0;
        s.cost += sku.cost || 0;
        s.packing += sku.packing || 0;
        s.ad += sku.ad || 0;
        s.profit += sku.profit || 0;
        if (sku.profit > 0) profitSkus++; else lossSkus++;
      });

      const list = Object.values(shopMap).map(s => ({
        ...s,
        roi: s.ad > 0 ? s.revenue / s.ad : 0,
        rate: s.revenue > 0 ? (s.profit / s.revenue) * 100 : 0,
      })).sort((a, b) => b.profit - a.profit);

      setShopList(list);
      setSkuStats({ total: (json.data || []).length, profit: profitSkus, loss: lossSkus });

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
      console.error('公司总览加载失败:', e);
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd]);

  useEffect(() => { fetchData(); }, [dateRange]);

  const avgProfitPerOrder = totals.orders > 0 ? totals.profit / totals.orders : 0;
  const avgRoi = totals.ad > 0 ? totals.revenue / totals.ad : 0;
  const profitRate = totals.revenue > 0 ? (totals.profit / totals.revenue * 100) : 0;
  const costRate = totals.revenue > 0 ? (totals.cost / totals.revenue * 100) : 0;
  const adRate = totals.revenue > 0 ? (totals.ad / totals.revenue * 100) : 0;
  const packRate = totals.revenue > 0 ? (totals.packing / totals.revenue * 100) : 0;

  // 饼图数据
  const pieData = shopList.map((s, i) => ({
    name: s.id,
    value: Math.max(s.profit, 0),
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-5">
      {/* 日期选择 */}
      <div className="flex items-center gap-2 text-sm">
        {["today", "yesterday", "7d", "30d"].map(r => (
          <button key={r} onClick={() => setDateRange(r)}
            className={`px-4 py-2 rounded-lg font-medium transition ${dateRange === r && !customStart ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
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
          {/* 核心指标卡片 */}
          <div className="grid grid-cols-6 gap-4">
            {[
              { label: '总回款', value: formatCNY(totals.revenue), icon: '💰', bg: 'bg-blue-50', color: 'text-blue-600' },
              { label: '总订单', value: totals.orders.toLocaleString(), icon: '🛒', bg: 'bg-orange-50', color: 'text-orange-600' },
              { label: '总利润', value: formatCNY(totals.profit), icon: '✨', bg: 'bg-green-50', color: 'text-green-600' },
              { label: '总广告', value: formatCNY(totals.ad), icon: '📢', bg: 'bg-red-50', color: 'text-red-600' },
              { label: '整体ROI', value: avgRoi.toFixed(2), icon: '📊', bg: 'bg-purple-50', color: 'text-purple-600' },
              { label: '单均利润', value: formatCNY(avgProfitPerOrder), icon: '📝', bg: 'bg-emerald-50', color: 'text-emerald-600' },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-xl p-4 border border-gray-100`}>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span>{item.icon}</span><span>{item.label}</span>
                </div>
                <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* 饼图 + 成本结构 */}
          <div className="grid grid-cols-2 gap-5">
            {/* 店铺利润占比 */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">🏪 各店铺利润占比</h3>
              {pieData.length > 0 ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCNY(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {pieData.map((item, i) => {
                      const total = pieData.reduce((s, d) => s + d.value, 0);
                      const pct = total > 0 ? (item.value / total * 100).toFixed(1) : 0;
                      return (
                        <div key={i} className="flex items-center gap-1.5 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-gray-600">{item.name}</span>
                          <span className="font-medium text-gray-800">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">暂无数据</div>
              )}
            </div>

            {/* 成本结构 */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">💵 成本结构占比</h3>
              <div className="space-y-5">
                {[
                  { label: '商品成本', value: totals.cost, pct: costRate, color: 'bg-blue-500' },
                  { label: '广告费用', value: totals.ad, pct: adRate, color: 'bg-orange-500' },
                  { label: '打包费用', value: totals.packing, pct: packRate, color: 'bg-pink-500' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">{formatCNY(item.value)}</span>
                        <span className="text-sm font-bold w-14 text-right">{item.pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className={`${item.color} h-3 rounded-full transition-all`} style={{ width: `${Math.min(item.pct, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-green-600">净利润率</span>
                    <span className="text-lg font-bold text-green-600">{profitRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 店铺排行 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">🏪 店铺利润排行</h3>
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 font-medium">#</th>
                  <th className="text-left py-3 font-medium">店铺</th>
                  <th className="text-right py-3 font-medium">订单</th>
                  <th className="text-right py-3 font-medium">回款</th>
                  <th className="text-right py-3 font-medium">成本</th>
                  <th className="text-right py-3 font-medium">打包</th>
                  <th className="text-right py-3 font-medium">广告</th>
                  <th className="text-right py-3 font-medium">利润</th>
                  <th className="text-right py-3 font-medium">利润率</th>
                  <th className="text-right py-3 font-medium">ROI</th>
                </tr>
              </thead>
              <tbody>
                {shopList.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 text-gray-400">{i + 1}</td>
                    <td className="py-3 font-medium text-gray-800">{s.id}</td>
                    <td className="text-right py-3">{s.orders.toLocaleString()}</td>
                    <td className="text-right py-3 text-blue-600">{formatCNY(s.revenue)}</td>
                    <td className="text-right py-3 text-gray-600">{formatCNY(s.cost)}</td>
                    <td className="text-right py-3 text-pink-500">{formatCNY(s.packing)}</td>
                    <td className="text-right py-3 text-orange-500">{formatCNY(s.ad)}</td>
                    <td className={`text-right py-3 font-bold ${s.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCNY(s.profit)}</td>
                    <td className={`text-right py-3 ${s.rate >= 0 ? 'text-green-600' : 'text-red-500'}`}>{s.rate.toFixed(1)}%</td>
                    <td className="text-right py-3 text-purple-600">{s.roi.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td className="py-3"></td>
                  <td className="py-3">合计</td>
                  <td className="text-right py-3">{totals.orders.toLocaleString()}</td>
                  <td className="text-right py-3 text-blue-600">{formatCNY(totals.revenue)}</td>
                  <td className="text-right py-3">{formatCNY(totals.cost)}</td>
                  <td className="text-right py-3 text-pink-500">{formatCNY(totals.packing)}</td>
                  <td className="text-right py-3 text-orange-500">{formatCNY(totals.ad)}</td>
                  <td className="text-right py-3 text-green-600">{formatCNY(totals.profit)}</td>
                  <td className="text-right py-3">{profitRate.toFixed(1)}%</td>
                  <td className="text-right py-3 text-purple-600">{avgRoi.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 底部统计 + 预警 */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">📊 快速统计</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: '运营店铺', value: shopList.length, color: 'text-blue-600' },
                  { label: '在售SKU', value: skuStats.total, color: 'text-gray-800' },
                  { label: '盈利SKU', value: skuStats.profit, color: 'text-green-600' },
                  { label: '亏损SKU', value: skuStats.loss, color: 'text-red-600' },
                  { label: '利润率', value: profitRate.toFixed(1) + '%', color: profitRate > 20 ? 'text-green-600' : 'text-orange-500' },
                  { label: '健康度', value: skuStats.total > 0 ? (skuStats.profit / skuStats.total * 100).toFixed(0) + '%' : '-', color: 'text-blue-600' },
                ].map((item, i) => (
                  <div key={i} className="text-center py-3 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">⚠️ 快速预警</h3>
              <div className="space-y-3">
                {(() => {
                  const warnings = [];
                  shopList.forEach(s => {
                    if (s.profit < 0) warnings.push({ level: '🔴', msg: `${s.id} 亏损 ${formatCNY(Math.abs(s.profit))}` });
                    else if (s.roi < 2 && s.ad > 0) warnings.push({ level: '🟡', msg: `${s.id} ROI仅${s.roi.toFixed(2)}，广告效率低` });
                  });
                  if (warnings.length === 0) {
                    return <div className="text-center py-6 text-green-500 font-medium">🟢 所有店铺运营正常</div>;
                  }
                  return warnings.slice(0, 5).map((w, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                      <span>{w.level}</span>
                      <span className="text-gray-700">{w.msg}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CompanyOverviewModule;
