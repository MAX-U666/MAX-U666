/**
 * 店铺利润表格组件
 */
import React, { Fragment } from 'react';
import { formatCNY } from '../../../utils/format';
import { getHealthStatus } from '../../../utils/helpers';
import { shopData } from '../../../data/mock';

export function ShopTable({ expandedShop, onExpand, showExtraCols, onToggleExtraCols }) {
  // 计算合计
  const totals = {
    orders: shopData.reduce((sum, s) => sum + s.orders, 0),
    revenue: shopData.reduce((sum, s) => sum + s.revenue, 0),
    cost: shopData.reduce((sum, s) => sum + s.cost, 0),
    ad: shopData.reduce((sum, s) => sum + s.ad, 0),
    profit: shopData.reduce((sum, s) => sum + s.profit, 0),
    warehouse: shopData.reduce((sum, s) => sum + s.warehouse, 0),
    packing: shopData.reduce((sum, s) => sum + s.packing, 0),
  };

  return (
    <div className="col-span-3 bg-white rounded-xl p-5 shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 text-sm font-medium">🏪 店铺利润汇总</h3>
        <div className="flex gap-2 text-xs items-center">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExtraCols(); }}
            className={`px-3 py-1 rounded-full font-medium transition ${
              showExtraCols ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {showExtraCols ? '收起明细 ↑' : '展开仓储/包材 ↓'}
          </button>
          <span className="text-gray-300">|</span>
          <button className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">ROI排序</button>
          <button className="text-gray-400 hover:text-gray-600 px-3 py-1">利润排序</button>
        </div>
      </div>
      
      <table className="w-full text-sm">
        <thead className="text-gray-400 border-b border-gray-100">
          <tr>
            <th className="text-left py-3 font-medium">店铺</th>
            <th className="text-right py-3 font-medium bg-green-50 text-green-600">毛利润</th>
            <th className="text-right py-3 font-medium">ROI</th>
            <th className="text-right py-3 font-medium">利润率</th>
            <th className="text-center py-3 font-medium">健康度</th>
            <th className="text-right py-3 font-medium">订单量</th>
            <th className="text-right py-3 font-medium">回款</th>
            <th className="text-right py-3 font-medium">成本</th>
            <th className="text-right py-3 font-medium">广告费</th>
            {showExtraCols && (
              <Fragment>
                <th className="text-right py-3 font-medium text-cyan-500">仓储费</th>
                <th className="text-right py-3 font-medium text-pink-500">包材费</th>
              </Fragment>
            )}
          </tr>
        </thead>
        <tbody>
          {shopData.map((shop, i) => {
            const health = getHealthStatus(shop.roi, shop.rate);
            return (
              <tr 
                key={i} 
                className={`border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition ${
                  expandedShop === shop.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => onExpand(expandedShop === shop.id ? null : shop.id)}
              >
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${expandedShop === shop.id ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                    <span className="font-semibold text-gray-800">{shop.id}</span>
                  </div>
                </td>
                <td className="text-right bg-green-50">
                  <span className={`font-bold text-lg ${shop.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCNY(shop.profit)}
                  </span>
                </td>
                <td className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    shop.roi >= 4 ? 'bg-green-100 text-green-700' : 
                    shop.roi >= 2 ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {shop.roi.toFixed(2)} {shop.roi >= 4 ? '✓' : '!'}
                  </span>
                </td>
                <td className={`text-right font-medium ${
                  shop.rate > 30 ? 'text-green-600' : 
                  shop.rate > 15 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {shop.rate.toFixed(1)}%
                </td>
                <td className="text-center">
                  <span className="text-lg" title={
                    health === 'good' ? '健康：ROI≥4 且 利润率>30%' :
                    health === 'warning' ? '关注：ROI≥2 或 利润率>15%' :
                    '警告：ROI<2 且 利润率<15%'
                  }>
                    {health === 'good' ? '🟢' : health === 'warning' ? '🟡' : '🔴'}
                  </span>
                </td>
                <td className="text-right text-gray-600">{shop.orders}</td>
                <td className="text-right font-medium">{formatCNY(shop.revenue)}</td>
                <td className="text-right text-blue-600">{formatCNY(shop.cost)}</td>
                <td className="text-right text-orange-600">{formatCNY(shop.ad)}</td>
                {showExtraCols && (
                  <Fragment>
                    <td className="text-right text-cyan-600">{formatCNY(shop.warehouse)}</td>
                    <td className="text-right text-pink-600">{formatCNY(shop.packing)}</td>
                  </Fragment>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr className="font-semibold">
            <td className="py-4">合计</td>
            <td className="text-right bg-green-50 text-green-600 text-lg font-bold">{formatCNY(totals.profit)}</td>
            <td className="text-right">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">5.78</span>
            </td>
            <td className="text-right text-green-600">51.6%</td>
            <td className="text-center">🟢</td>
            <td className="text-right">{totals.orders.toLocaleString()}</td>
            <td className="text-right">{formatCNY(totals.revenue)}</td>
            <td className="text-right text-blue-600">{formatCNY(totals.cost)}</td>
            <td className="text-right text-orange-600">{formatCNY(totals.ad)}</td>
            {showExtraCols && (
              <Fragment>
                <td className="text-right text-cyan-600">{formatCNY(totals.warehouse)}</td>
                <td className="text-right text-pink-600">{formatCNY(totals.packing)}</td>
              </Fragment>
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default ShopTable;
