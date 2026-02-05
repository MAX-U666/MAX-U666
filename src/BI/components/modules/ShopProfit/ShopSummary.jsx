/**
 * 集团汇总卡片组件
 */
import React from 'react';
import { formatCNY } from '../../../utils/format';
import { groupSummary } from '../../../data/mock';

export function ShopSummary() {
  const { totalRevenue, totalAd, totalCost, totalProfit, totalRoi, totalOrders } = groupSummary;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
      <h3 className="text-sm text-blue-100 mb-4">📊 集团口径汇总</h3>
      <div className="grid grid-cols-6 gap-6">
        <div>
          <div className="text-blue-200 text-xs">总回款</div>
          <div className="text-2xl font-bold">{formatCNY(totalRevenue)}</div>
        </div>
        <div>
          <div className="text-blue-200 text-xs">总广告费</div>
          <div className="text-2xl font-bold">{formatCNY(totalAd)}</div>
        </div>
        <div>
          <div className="text-blue-200 text-xs">总成本</div>
          <div className="text-2xl font-bold">{formatCNY(totalCost)}</div>
        </div>
        <div>
          <div className="text-blue-200 text-xs">总利润</div>
          <div className="text-2xl font-bold text-green-300">{formatCNY(totalProfit)}</div>
        </div>
        <div>
          <div className="text-blue-200 text-xs">整体ROI</div>
          <div className="text-2xl font-bold text-yellow-300">{totalRoi}</div>
        </div>
        <div>
          <div className="text-blue-200 text-xs">总订单量</div>
          <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

export default ShopSummary;
