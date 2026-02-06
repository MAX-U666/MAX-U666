import React from 'react';
import { formatCNY } from '../../../utils/format';

export function OrderByShop({ data, loading }) {
  const shopData = data || [];

  const totals = {
    orders: shopData.reduce((s, d) => s + d.orders, 0),
    lossOrders: shopData.reduce((s, d) => s + d.lossOrders, 0),
    totalProfit: shopData.reduce((s, d) => s + d.totalProfit, 0),
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${loading ? 'animate-pulse' : ''}`}>
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-gray-700 text-sm font-semibold">🏪 店铺维度订单分析</h3>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">店铺</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">总订单</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">平均单笔利润</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">亏损订单</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">亏损占比</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">平均客单价</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">总利润</th>
          </tr>
        </thead>
        <tbody>
          {shopData.length === 0 ? (
            <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
          ) : shopData.map((shop, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
              <td className="px-4 py-3 font-semibold text-gray-800">{shop.store}</td>
              <td className="px-4 py-3 text-right text-gray-700">{shop.orders.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">
                <span className={`font-medium ${shop.avgProfit >= 5 ? 'text-green-600' : shop.avgProfit >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatCNY(shop.avgProfit)}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-red-600 font-medium">{shop.lossOrders}</td>
              <td className="px-4 py-3 text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  shop.lossRate <= 10 ? 'bg-green-100 text-green-700' :
                  shop.lossRate <= 20 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>{shop.lossRate.toFixed(1)}%</span>
              </td>
              <td className="px-4 py-3 text-right">{formatCNY(shop.avgPrice)}</td>
              <td className="px-4 py-3 text-right">
                <span className={`font-bold ${shop.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCNY(shop.totalProfit)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        {shopData.length > 0 && (
          <tfoot className="bg-gray-50">
            <tr className="font-semibold">
              <td className="px-4 py-3">合计</td>
              <td className="px-4 py-3 text-right">{totals.orders}</td>
              <td className="px-4 py-3 text-right">{formatCNY(totals.orders > 0 ? totals.totalProfit / totals.orders : 0)}</td>
              <td className="px-4 py-3 text-right text-red-600">{totals.lossOrders}</td>
              <td className="px-4 py-3 text-right">{totals.orders > 0 ? ((totals.lossOrders / totals.orders) * 100).toFixed(1) : 0}%</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right text-green-600">{formatCNY(totals.totalProfit)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
export default OrderByShop;
