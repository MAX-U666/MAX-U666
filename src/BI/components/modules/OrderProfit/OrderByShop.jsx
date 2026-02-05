/**
 * 店铺维度订单分析组件
 */
import React from 'react';
import { formatCNY } from '../../../utils/format';

export function OrderByShop() {
  const shopOrderData = [
    { store: 'B03', orders: 515, avgProfit: 229.64, lossOrders: 23, lossRate: 4.5, avgPrice: 573.46, totalProfit: 118265.05 },
    { store: '15004', orders: 289, avgProfit: 83.27, lossOrders: 45, lossRate: 15.6, avgPrice: 612.72, totalProfit: 24064.87 },
    { store: '15010', orders: 199, avgProfit: 142.80, lossOrders: 12, lossRate: 6.0, avgPrice: 450.00, totalProfit: 28416.74 },
    { store: '15007', orders: 156, avgProfit: 134.76, lossOrders: 8, lossRate: 5.1, avgPrice: 435.13, totalProfit: 21022.00 },
    { store: '15009', orders: 89, avgProfit: 97.96, lossOrders: 5, lossRate: 5.6, avgPrice: 388.31, totalProfit: 8718.00 },
  ];

  const totals = {
    orders: shopOrderData.reduce((s, d) => s + d.orders, 0),
    lossOrders: shopOrderData.reduce((s, d) => s + d.lossOrders, 0),
    totalProfit: shopOrderData.reduce((s, d) => s + d.totalProfit, 0),
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-gray-700 text-sm font-semibold">🏪 店铺维度订单分析</h3>
        <div className="text-xs text-gray-400">按权限显示可见店铺</div>
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
            <th className="px-4 py-3 text-center font-medium text-gray-500">操作</th>
          </tr>
        </thead>
        <tbody>
          {shopOrderData.map((shop, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
              <td className="px-4 py-3">
                <span className="font-semibold text-gray-800">{shop.store}</span>
              </td>
              <td className="px-4 py-3 text-right text-gray-700">{shop.orders.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">
                <span className={`font-medium ${shop.avgProfit >= 150 ? 'text-green-600' : shop.avgProfit >= 100 ? 'text-yellow-600' : 'text-orange-600'}`}>
                  {formatCNY(shop.avgProfit)}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-red-600 font-medium">{shop.lossOrders}</td>
              <td className="px-4 py-3 text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  shop.lossRate <= 5 ? 'bg-green-100 text-green-700' :
                  shop.lossRate <= 10 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {shop.lossRate.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right text-blue-600">{formatCNY(shop.avgPrice)}</td>
              <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCNY(shop.totalProfit)}</td>
              <td className="px-4 py-3 text-center">
                <button className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition">
                  查看亏损
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr className="font-semibold">
            <td className="px-4 py-3">合计</td>
            <td className="px-4 py-3 text-right">{totals.orders.toLocaleString()}</td>
            <td className="px-4 py-3 text-right text-green-600">{formatCNY(totals.totalProfit / totals.orders)}</td>
            <td className="px-4 py-3 text-right text-red-600">{totals.lossOrders}</td>
            <td className="px-4 py-3 text-right">
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                {((totals.lossOrders / totals.orders) * 100).toFixed(1)}%
              </span>
            </td>
            <td className="px-4 py-3 text-right text-blue-600">-</td>
            <td className="px-4 py-3 text-right text-green-600">{formatCNY(totals.totalProfit)}</td>
            <td className="px-4 py-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default OrderByShop;
