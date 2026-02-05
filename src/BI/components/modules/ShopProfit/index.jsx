import React, { useState } from "react";
import { shopData } from "../../../data/mock";
import { formatCNY } from "../../../utils/format";
import { ShopDetail } from "./ShopDetail";

export function ShopProfitModule() {
  // 当前选中的店铺Tab（默认第一个店铺）
  const [activeShopTab, setActiveShopTab] = useState(shopData[0]?.id || 'B03');

  const totalRevenue = shopData.reduce((sum, s) => sum + s.revenue, 0);
  const totalAd = shopData.reduce((sum, s) => sum + s.ad, 0);
  const totalCost = shopData.reduce((sum, s) => sum + s.cost, 0);
  const totalProfit = shopData.reduce((sum, s) => sum + s.profit, 0);
  const totalOrders = shopData.reduce((sum, s) => sum + s.orders, 0);
  const avgRoi = totalAd > 0 ? totalRevenue / totalAd : 0;
  const avgProfitPerOrder = totalOrders > 0 ? totalProfit / totalOrders : 0;

  return (
    <div className="space-y-5">
      {/* A. 集团汇总 - 新顺序: 总回款→总订单→总利润→单笔利润→总广告→整体ROI→总成本 */}
      <div className="grid grid-cols-7 gap-4">
        {[
          { label: '总回款', value: formatCNY(totalRevenue), icon: '💰', bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: '总订单', value: totalOrders.toLocaleString(), icon: '🛒', bg: 'bg-orange-50', color: 'text-orange-600' },
          { label: '总利润', value: formatCNY(totalProfit), icon: '✨', bg: 'bg-green-50', color: 'text-green-600' },
          { label: '单笔利润', value: formatCNY(avgProfitPerOrder), icon: '📝', bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: '总广告', value: formatCNY(totalAd), icon: '📢', bg: 'bg-red-50', color: 'text-red-600' },
          { label: '整体ROI', value: avgRoi.toFixed(2), icon: '📊', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: '总成本', value: formatCNY(totalCost), icon: '📦', bg: 'bg-gray-50', color: 'text-gray-600' },
        ].map((item, i) => (
          <div key={i} className={`${item.bg} rounded-xl p-4 border border-gray-100`}>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>{item.icon}</span>
              <span>{item.label}</span>
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

      {/* C. 店铺列表 - 列顺序: 店铺→回款→订单数→利润→广告费→ROI→成本 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-800">🏪 各店铺利润</div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['店铺', '回款', '订单数', '利润', '广告费', 'ROI', '成本'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shopData.map((shop, i) => (
              <tr 
                key={i}
                className={`border-b border-gray-50 hover:bg-gray-50 transition ${
                  activeShopTab === shop.id ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-3 font-medium text-gray-800">{shop.id}</td>
                <td className="px-4 py-3 text-gray-600">{formatCNY(shop.revenue)}</td>
                <td className="px-4 py-3 text-gray-600">{shop.orders}</td>
                <td className={`px-4 py-3 font-semibold ${shop.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCNY(shop.profit)}
                </td>
                <td className="px-4 py-3 text-gray-600">{formatCNY(shop.ad)}</td>
                <td className="px-4 py-3">
                  <span className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${shop.roi >= 4 ? 'bg-green-100 text-green-700' : shop.roi >= 2 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}
                  `}>
                    {shop.roi.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{formatCNY(shop.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* D. 店铺详情 - 独立板块，Tab切换 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tab标签页 */}
        <div className="flex border-b border-gray-200">
          {shopData.map((shop) => (
            <button
              key={shop.id}
              onClick={() => setActiveShopTab(shop.id)}
              className={`
                px-6 py-3 text-sm font-medium transition-all relative
                ${activeShopTab === shop.id 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className="flex items-center gap-2">
                <span>{shop.id}</span>
                {shop.profit > 0 ? (
                  <span className="text-green-500 text-xs">+{formatCNY(shop.profit)}</span>
                ) : (
                  <span className="text-red-500 text-xs">{formatCNY(shop.profit)}</span>
                )}
              </span>
              {/* 选中指示条 */}
              {activeShopTab === shop.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
        
        {/* 店铺详情内容 */}
        <ShopDetail shopId={activeShopTab} isStandalone={true} />
      </div>
    </div>
  );
}
