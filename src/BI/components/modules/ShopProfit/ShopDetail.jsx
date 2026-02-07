/**
 * 店铺详情展开面板 - 显示该店铺的SKU利润排行
 */
import React from 'react';
import { formatCNY } from '../../../utils/format';

export function ShopDetail({ shop }) {
  if (!shop || !shop.skus) return null;

  // SKU按利润排序
  const sortedSkus = [...shop.skus].sort((a, b) => b.profit - a.profit);
  const top10 = sortedSkus.slice(0, 10);
  const bottom5 = [...shop.skus].sort((a, b) => a.profit - b.profit).slice(0, 5);

  return (
    <div className="bg-gray-50 p-5 space-y-5">
      {/* 店铺指标卡片 */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: '订单量', value: shop.orders.toLocaleString(), color: 'text-blue-600' },
          { label: '回款', value: formatCNY(shop.revenue), color: 'text-blue-600' },
          { label: '商品成本', value: formatCNY(shop.cost), color: 'text-gray-600' },
          { label: '广告费', value: formatCNY(shop.ad), color: 'text-orange-500' },
          { label: '利润', value: formatCNY(shop.profit), color: shop.profit >= 0 ? 'text-green-600' : 'text-red-500' },
          { label: 'ROI', value: shop.roi.toFixed(2), color: 'text-purple-600' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-xs text-gray-400 mb-1">{item.label}</div>
            <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* 利润TOP10 */}
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">🏆 利润TOP10</h4>
          <table className="w-full text-xs">
            <thead className="text-gray-400">
              <tr>
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">SKU</th>
                <th className="text-right py-2">订单</th>
                <th className="text-right py-2">利润</th>
                <th className="text-right py-2">利润率</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((sku, i) => (
                <tr key={i} className="border-t border-gray-50">
                  <td className="py-2 text-gray-400">{i + 1}</td>
                  <td className="py-2 font-medium text-gray-700 max-w-[200px] truncate">{sku.sku}</td>
                  <td className="text-right py-2">{sku.orders}</td>
                  <td className={`text-right py-2 font-bold ${sku.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCNY(sku.profit)}</td>
                  <td className="text-right py-2">{sku.rate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 亏损TOP5 */}
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">⚠️ 亏损/低利润TOP5</h4>
          <table className="w-full text-xs">
            <thead className="text-gray-400">
              <tr>
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">SKU</th>
                <th className="text-right py-2">订单</th>
                <th className="text-right py-2">利润</th>
                <th className="text-right py-2">广告</th>
              </tr>
            </thead>
            <tbody>
              {bottom5.map((sku, i) => (
                <tr key={i} className="border-t border-gray-50">
                  <td className="py-2 text-gray-400">{i + 1}</td>
                  <td className="py-2 font-medium text-gray-700 max-w-[200px] truncate">{sku.sku}</td>
                  <td className="text-right py-2">{sku.orders}</td>
                  <td className={`text-right py-2 font-bold ${sku.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCNY(sku.profit)}</td>
                  <td className="text-right py-2 text-orange-500">{formatCNY(sku.ad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ShopDetail;
