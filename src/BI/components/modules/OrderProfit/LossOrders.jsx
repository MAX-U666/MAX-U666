/**
 * 亏损订单 & 低利润订单模块
 */
import React from 'react';
import { formatCNY } from '../../../utils/format';

export function LossOrders() {
  const lossOrderData = [
    { id: 'ORD-0115-089', store: 'B03', sku: '二氧化碳洗发水(小)', loss: -24.05, suggestion: '下架' },
    { id: 'ORD-0115-092', store: '15004', sku: 'ZSYG*3+139-ID911', loss: -53.03, suggestion: '下架' },
    { id: 'ORD-0115-078', store: 'B03', sku: '红色牙线', loss: -6.18, suggestion: '优化' },
    { id: 'ORD-0114-156', store: '15010', sku: '试用装小样3ml', loss: -12.50, suggestion: '下架' },
    { id: 'ORD-0114-167', store: '15004', sku: '旅行装套装5件', loss: -8.72, suggestion: '优化' },
    { id: 'ORD-0114-189', store: 'B03', sku: '紫色牙膏', loss: -4.72, suggestion: '优化' },
    { id: 'ORD-0113-201', store: '15007', sku: '赠品福袋', loss: -3.20, suggestion: '下架' },
    { id: 'ORD-0113-215', store: '15010', sku: '老款清洁面膜', loss: -7.85, suggestion: '下架' },
    { id: 'ORD-0113-228', store: 'B03', sku: '折扣套装A', loss: -2.15, suggestion: '优化' },
    { id: 'ORD-0112-089', store: '15004', sku: '清仓款洗面奶', loss: -15.30, suggestion: '下架' },
  ];

  const lowProfitData = [
    { id: 'ORD-0115-045', store: 'B03', sku: '普通洗面奶100ml', profit: 0.52, suggestion: '优化' },
    { id: 'ORD-0115-067', store: '15004', sku: '基础护肤套装', profit: 1.23, suggestion: '优化' },
    { id: 'ORD-0115-082', store: '15010', sku: '补水面膜3片', profit: 2.15, suggestion: '观察' },
    { id: 'ORD-0114-103', store: 'B03', sku: '旅行装润唇膏', profit: 0.85, suggestion: '优化' },
    { id: 'ORD-0114-118', store: '15007', sku: '试用装洗发水', profit: 3.42, suggestion: '观察' },
    { id: 'ORD-0114-134', store: '15004', sku: '基础版牙膏', profit: 1.78, suggestion: '优化' },
    { id: 'ORD-0113-156', store: 'B03', sku: '清洁棉片50片', profit: 4.25, suggestion: '观察' },
    { id: 'ORD-0113-178', store: '15010', sku: '迷你护手霜', profit: 2.90, suggestion: '观察' },
    { id: 'ORD-0113-192', store: '15007', sku: '普通款牙刷', profit: 0.35, suggestion: '优化' },
    { id: 'ORD-0112-205', store: 'B03', sku: '入门款洁面乳', profit: 4.82, suggestion: '观察' },
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* 亏损订单模块 */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex justify-between items-center">
          <h3 className="text-red-700 text-sm font-semibold flex items-center gap-2">
            <span>🚨</span> 亏损订单（利润 &lt; ¥0）
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">共 <span className="font-bold text-red-600">93</span> 单</span>
            <span className="text-xs text-red-600 font-semibold bg-red-100 px-2 py-1 rounded">
              亏损总额: -¥1,247.35
            </span>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">订单号</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">店铺</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">SKU</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">亏损</th>
                <th className="px-3 py-2 text-center font-medium text-gray-500">建议</th>
              </tr>
            </thead>
            <tbody>
              {lossOrderData.map((order, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-red-50 transition">
                  <td className="px-3 py-2 font-mono text-gray-600">{order.id}</td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{order.store}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-700 max-w-[100px] truncate" title={order.sku}>{order.sku}</td>
                  <td className="px-3 py-2 text-right font-bold text-red-600">{formatCNY(order.loss)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      order.suggestion === '下架' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>{order.suggestion}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* 分页 */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="text-xs text-gray-500">显示 1-10 / 共93条</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-100">上一页</button>
            <span className="px-2 py-1 bg-red-500 text-white rounded text-xs">1</span>
            <span className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600">2</span>
            <span className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600">3</span>
            <span className="text-xs text-gray-400">...</span>
            <span className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600">10</span>
            <button className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-100">下一页</button>
          </div>
        </div>
      </div>

      {/* 低利润订单模块 */}
      <div className="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden">
        <div className="bg-yellow-50 px-5 py-3 border-b border-yellow-200 flex justify-between items-center">
          <h3 className="text-yellow-700 text-sm font-semibold flex items-center gap-2">
            <span>⚠️</span> 低利润订单（¥0 - ¥5）
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">共 <span className="font-bold text-yellow-600">312</span> 单</span>
            <span className="text-xs text-yellow-600 font-semibold bg-yellow-100 px-2 py-1 rounded">
              利润总额: ¥892.45
            </span>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">订单号</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">店铺</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">SKU</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">利润</th>
                <th className="px-3 py-2 text-center font-medium text-gray-500">建议</th>
              </tr>
            </thead>
            <tbody>
              {lowProfitData.map((order, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-yellow-50 transition">
                  <td className="px-3 py-2 font-mono text-gray-600">{order.id}</td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{order.store}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-700 max-w-[100px] truncate" title={order.sku}>{order.sku}</td>
                  <td className="px-3 py-2 text-right font-bold text-yellow-600">+{formatCNY(order.profit)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      order.suggestion === '优化' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                    }`}>{order.suggestion}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* 分页 */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="text-xs text-gray-500">显示 1-10 / 共312条</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-100">上一页</button>
            <span className="px-2 py-1 bg-yellow-500 text-white rounded text-xs">1</span>
            <span className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600">2</span>
            <span className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600">3</span>
            <span className="text-xs text-gray-400">...</span>
            <span className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600">32</span>
            <button className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-100">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LossOrders;
