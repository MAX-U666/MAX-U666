/**
 * 公司总览 - 总览页
 */
import React from 'react';
import { formatCNY } from '../../../utils/format';
import { groupSummary } from '../../../data/mock';

export function Overview() {
  return (
    <div className="space-y-5">
      {/* 公司级汇总 */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-6 text-white shadow-lg">
        <h3 className="text-sm text-orange-100 mb-4">🏢 公司级财务汇总</h3>
        <div className="grid grid-cols-6 gap-6">
          <div>
            <div className="text-orange-200 text-xs">总营收</div>
            <div className="text-2xl font-bold">{formatCNY(groupSummary.totalRevenue)}</div>
          </div>
          <div>
            <div className="text-orange-200 text-xs">总成本</div>
            <div className="text-2xl font-bold">{formatCNY(groupSummary.totalCost)}</div>
          </div>
          <div>
            <div className="text-orange-200 text-xs">总广告费</div>
            <div className="text-2xl font-bold">{formatCNY(groupSummary.totalAd)}</div>
          </div>
          <div>
            <div className="text-orange-200 text-xs">公司费用</div>
            <div className="text-2xl font-bold text-yellow-200">¥42,100</div>
          </div>
          <div>
            <div className="text-orange-200 text-xs">净利润</div>
            <div className="text-2xl font-bold text-green-200">¥373,972</div>
          </div>
          <div>
            <div className="text-orange-200 text-xs">净利润率</div>
            <div className="text-2xl font-bold text-green-200">46.4%</div>
          </div>
        </div>
      </div>

      {/* 店铺贡献度 + 关键指标 */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h3 className="text-gray-800 text-sm font-semibold mb-4">🏪 店铺利润贡献度</h3>
          <div className="space-y-3">
            {[
              { name: 'B03', profit: 118265, percent: 28.4, color: 'bg-blue-500' },
              { name: '15010', profit: 28416, percent: 6.8, color: 'bg-green-500' },
              { name: '15004', profit: 24064, percent: 5.8, color: 'bg-yellow-500' },
              { name: '15007', profit: 21022, percent: 5.0, color: 'bg-purple-500' },
              { name: '15009', profit: 8718, percent: 2.1, color: 'bg-pink-500' },
            ].map((shop, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{shop.name}</span>
                  <span className="text-gray-500">{formatCNY(shop.profit)} ({shop.percent}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${shop.color} h-2 rounded-full`} style={{width: `${shop.percent * 3}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h3 className="text-gray-800 text-sm font-semibold mb-4">📊 关键指标对比</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-green-600 text-xs font-medium">整体ROI</div>
              <div className="text-3xl font-bold text-green-700 mt-1">{groupSummary.totalRoi}</div>
              <div className="text-xs text-green-600 mt-1">✓ 超过目标值4</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-blue-600 text-xs font-medium">平均利润率</div>
              <div className="text-3xl font-bold text-blue-700 mt-1">51.6%</div>
              <div className="text-xs text-blue-600 mt-1">✓ 健康水平</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-orange-600 text-xs font-medium">广告费占比</div>
              <div className="text-3xl font-bold text-orange-700 mt-1">17.3%</div>
              <div className="text-xs text-orange-600 mt-1">⚡ 可优化空间</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-purple-600 text-xs font-medium">问题SKU</div>
              <div className="text-3xl font-bold text-purple-700 mt-1">3</div>
              <div className="text-xs text-red-600 mt-1">⚠️ 需要处理</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;
