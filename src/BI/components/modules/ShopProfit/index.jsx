import React, { useState } from "react";
import { shopData } from "../../../data/mock";
import { formatCNY } from "../../../utils/format";

export function ShopProfitModule() {
  const [expandedShop, setExpandedShop] = useState(null);

  const totalRevenue = shopData.reduce((sum, s) => sum + s.revenue, 0);
  const totalAd = shopData.reduce((sum, s) => sum + s.ad, 0);
  const totalCost = shopData.reduce((sum, s) => sum + s.cost, 0);
  const totalProfit = shopData.reduce((sum, s) => sum + s.profit, 0);
  const totalOrders = shopData.reduce((sum, s) => sum + s.orders, 0);
  const avgRoi = totalAd > 0 ? totalRevenue / totalAd : 0;

  return (
    <div className="space-y-5">
      {/* 集团汇总 */}
      <div className="grid grid-cols-6 gap-4">
        {[
          { label: '总回款', value: formatCNY(totalRevenue), icon: '💰', bg: 'bg-blue-50' },
          { label: '总广告费', value: formatCNY(totalAd), icon: '📢', bg: 'bg-red-50', color: 'text-red-600' },
          { label: '总成本', value: formatCNY(totalCost), icon: '📦', bg: 'bg-gray-50' },
          { label: '总利润', value: formatCNY(totalProfit), icon: '✨', bg: 'bg-green-50', color: 'text-green-600' },
          { label: '整体ROI', value: avgRoi.toFixed(2), icon: '📊', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: '总订单量', value: totalOrders.toLocaleString(), icon: '🛒', bg: 'bg-orange-50' }
        ].map((item, i) => (
          <div key={i} className={`${item.bg} rounded-xl p-4 border border-gray-100`}>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            <div className={`text-xl font-bold ${item.color || 'text-gray-800'}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* 成本结构 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <div className="text-sm font-semibold text-gray-800 mb-4">📊 成本结构占比</div>
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: '商品成本', value: totalCost * 0.6, color: 'bg-blue-500' },
            { label: '广告费用', value: totalAd, color: 'bg-orange-500' },
            { label: '物流费用', value: totalCost * 0.25, color: 'bg-green-500' },
            { label: '平台扣点', value: totalCost * 0.15, color: 'bg-purple-500' }
          ].map((item, i) => {
            const pct = ((item.value / (totalCost + totalAd)) * 100).toFixed(1);
            return (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-800">{pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{formatCNY(item.value)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 店铺列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-800">🏪 各店铺利润</div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['店铺', '订单数', '销售额', '广告费', '成本', '利润', 'ROI', '利润率', '操作'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shopData.map((shop, i) => (
              <React.Fragment key={i}>
                <tr 
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setExpandedShop(expandedShop === shop.id ? null : shop.id)}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{shop.id}</td>
                  <td className="px-4 py-3 text-gray-600">{shop.orders}</td>
                  <td className="px-4 py-3 text-gray-600">{formatCNY(shop.revenue)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatCNY(shop.ad)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatCNY(shop.cost)}</td>
                  <td className={`px-4 py-3 font-semibold ${shop.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCNY(shop.profit)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${shop.roi >= 4 ? 'bg-green-100 text-green-700' : shop.roi >= 2 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}
                    `}>
                      {shop.roi.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{shop.rate.toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <span className="text-blue-600 text-xs">{expandedShop === shop.id ? '收起 ▲' : '展开 ▼'}</span>
                  </td>
                </tr>
                {expandedShop === shop.id && (
                  <tr>
                    <td colSpan={9} className="px-4 py-4 bg-gray-50">
                      <div className="text-sm text-gray-600">
                        店铺详情：{shop.id} 共 {shop.orders} 单，日均 {Math.round(shop.orders / 7)} 单，
                        仓储费 {formatCNY(shop.warehouse)}，包材费 {formatCNY(shop.packing)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
