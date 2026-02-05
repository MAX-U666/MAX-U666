/**
 * 店铺详情展开面板组件
 */
import React from 'react';
import { MetricCard } from '../../common';
import { formatCNY } from '../../../utils/format';
import { RATE } from '../../../utils/constants';
import { shopData, b03SkuData } from '../../../data/mock';

export function ShopDetail({ shopId, onClose }) {
  const shop = shopData.find(s => s.id === shopId);
  if (!shop) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">📊 {shopId} 店铺利润分析</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕ 收起</button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-6 gap-4 mb-6">
          <MetricCard label="汇率" value={`1IDR = ¥${RATE}`} />
          <MetricCard label="回款" value={formatCNY(shop.revenue)} color="blue" />
          <MetricCard label="成本" value={formatCNY(shop.cost)} color="blue" />
          <MetricCard label="仓储费" value={formatCNY(shop.warehouse)} color="cyan" />
          <MetricCard label="包材费" value={formatCNY(shop.packing)} color="pink" />
          <MetricCard label="广告费" value={formatCNY(shop.ad)} color="orange" />
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          <MetricCard label="毛利润" value={formatCNY(shop.profit)} color="green" highlight />
          <MetricCard label="ROI" value={shop.roi.toFixed(2)} status="达标" color="green" />
          <MetricCard label="单笔利润" value={formatCNY(shop.profit / shop.orders)} status="达标" color="green" />
          <MetricCard label="客单价" value={formatCNY(shop.revenue / shop.orders)} />
          <MetricCard label="利润率" value={`${shop.rate.toFixed(1)}%`} color="green" />
          <MetricCard label="广告占比" value={`${((shop.ad / shop.revenue) * 100).toFixed(1)}%`} color="orange" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* TOP10 SKU */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-green-500">✨</span> 利润最高 SKU TOP10
            </h4>
            <table className="w-full text-xs">
              <thead className="text-gray-400">
                <tr>
                  <th className="text-left py-2 font-medium">#</th>
                  <th className="text-left py-2 font-medium">商品名称</th>
                  <th className="text-right py-2 font-medium">订单</th>
                  <th className="text-right py-2 font-medium">利润</th>
                  <th className="text-right py-2 font-medium">ROI</th>
                  <th className="text-right py-2 font-medium">利润率</th>
                </tr>
              </thead>
              <tbody>
                {b03SkuData.top10.map((sku, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-400 text-white' :
                        i === 1 ? 'bg-gray-300 text-white' :
                        i === 2 ? 'bg-orange-400 text-white' :
                        'bg-gray-100 text-gray-500'
                      }`}>{i + 1}</span>
                    </td>
                    <td className="py-2 max-w-[150px] truncate text-gray-700" title={sku.name}>{sku.name}</td>
                    <td className="text-right text-gray-500">{sku.orders}</td>
                    <td className="text-right text-green-600 font-semibold">{formatCNY(sku.profit)}</td>
                    <td className="text-right">{sku.roi.toFixed(2)}</td>
                    <td className="text-right text-gray-500">{sku.rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom5 SKU */}
          <div className="bg-red-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-red-500">⚠️</span> 利润最低 SKU TOP5（需关注）
            </h4>
            <table className="w-full text-xs">
              <thead className="text-gray-400">
                <tr>
                  <th className="text-left py-2 font-medium">#</th>
                  <th className="text-left py-2 font-medium">商品名称</th>
                  <th className="text-right py-2 font-medium">订单</th>
                  <th className="text-right py-2 font-medium">利润</th>
                  <th className="text-right py-2 font-medium">ROI</th>
                  <th className="text-right py-2 font-medium">建议</th>
                </tr>
              </thead>
              <tbody>
                {b03SkuData.bottom5.map((sku, i) => (
                  <tr key={i} className="border-b border-red-100">
                    <td className="py-2">
                      <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    </td>
                    <td className="py-2 max-w-[150px] truncate text-gray-700" title={sku.name}>{sku.name}</td>
                    <td className="text-right text-gray-500">{sku.orders}</td>
                    <td className={`text-right font-semibold ${sku.profit < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {formatCNY(sku.profit)}
                    </td>
                    <td className={`text-right ${sku.roi < 2 ? 'text-red-600' : 'text-gray-600'}`}>
                      {sku.roi.toFixed(2)}
                    </td>
                    <td className="text-right">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        sku.profit < 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {sku.profit < 0 ? '下架' : '优化'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShopDetail;
