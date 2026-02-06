import React from 'react';
import { formatCNY } from '../../../utils/format';

export function LossOrders({ lossTop, lowProfitTop }) {
  const lossList = lossTop || [];
  const lowList = lowProfitTop || [];

  const totalLoss = lossList.reduce((s, o) => s + o.profit, 0);

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* 亏损订单 */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex justify-between items-center">
          <h3 className="text-red-700 text-sm font-semibold flex items-center gap-2">
            <span>🚨</span> 亏损订单 TOP10
          </h3>
          <span className="text-xs text-red-600 font-semibold bg-red-100 px-2 py-1 rounded">
            总亏损: {formatCNY(totalLoss)}
          </span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">订单号</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">店铺</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">SKU</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">亏损</th>
              </tr>
            </thead>
            <tbody>
              {lossList.length === 0 ? (
                <tr><td colSpan="4" className="px-3 py-6 text-center text-gray-400">无亏损订单 🎉</td></tr>
              ) : lossList.map((o, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-red-50">
                  <td className="px-3 py-2 font-mono text-gray-600">{o.id}</td>
                  <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{o.store}</span></td>
                  <td className="px-3 py-2 max-w-[120px] truncate" title={o.items?.[0]?.name}>{o.items?.[0]?.name || o.items?.[0]?.sku || '-'}</td>
                  <td className="px-3 py-2 text-right text-red-600 font-bold">{formatCNY(o.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 低利润订单 */}
      <div className="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden">
        <div className="bg-yellow-50 px-5 py-3 border-b border-yellow-200 flex justify-between items-center">
          <h3 className="text-yellow-700 text-sm font-semibold flex items-center gap-2">
            <span>⚡</span> 低利润订单 TOP10 (¥0~¥5)
          </h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">订单号</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">店铺</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">SKU</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">利润</th>
              </tr>
            </thead>
            <tbody>
              {lowList.length === 0 ? (
                <tr><td colSpan="4" className="px-3 py-6 text-center text-gray-400">暂无数据</td></tr>
              ) : lowList.map((o, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-yellow-50">
                  <td className="px-3 py-2 font-mono text-gray-600">{o.id}</td>
                  <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{o.store}</span></td>
                  <td className="px-3 py-2 max-w-[120px] truncate" title={o.items?.[0]?.name}>{o.items?.[0]?.name || o.items?.[0]?.sku || '-'}</td>
                  <td className="px-3 py-2 text-right text-yellow-600 font-bold">{formatCNY(o.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default LossOrders;
