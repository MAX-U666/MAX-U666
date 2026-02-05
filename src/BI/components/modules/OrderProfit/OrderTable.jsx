/**
 * 订单明细表格组件
 */
import React, { Fragment, useState } from 'react';
import { formatCNY } from '../../../utils/format';
import { getOrderFlags } from '../../../utils/helpers';
import { orderData } from '../../../data/mock';

export function OrderTable() {
  const [expandedOrder, setExpandedOrder] = useState(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">订单号</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">店铺</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">日期</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">SKU</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">数量</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">回款</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">成本</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">广告费</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">利润</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">利润率</th>
            <th className="px-4 py-3 text-center font-medium text-gray-500">异常标记</th>
          </tr>
        </thead>
        <tbody>
          {orderData.map((order) => {
            const profitRate = (order.profit / order.revenue) * 100;
            const flags = getOrderFlags(order);
            
            return (
              <Fragment key={order.id}>
                <tr 
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition ${
                    expandedOrder === order.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-gray-400 transform transition-transform text-xs ${expandedOrder === order.id ? 'rotate-90' : ''}`}>▶</span>
                      <span className="font-medium text-gray-800 text-xs">{order.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{order.store}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.date}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-[120px] truncate text-gray-700" title={order.skuName}>{order.skuName}</div>
                    <div className="text-xs text-gray-400">{order.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{order.qty}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCNY(order.revenue)}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{formatCNY(order.cost)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{formatCNY(order.ad)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {order.profit >= 0 ? '+' : ''}{formatCNY(order.profit)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profitRate > 30 ? 'bg-green-100 text-green-700' :
                      profitRate > 0 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {profitRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {flags.length > 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        {flags.map((f, idx) => (
                          <span key={idx} title={f.label}>{f.icon}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-green-500" title="正常">✓</span>
                    )}
                  </td>
                </tr>
                
                {/* 展开的订单详情 */}
                {expandedOrder === order.id && (
                  <tr>
                    <td colSpan="11" className="bg-gray-50 p-4">
                      {/* 异常诊断卡片 */}
                      {flags.length > 0 && (
                        <div className="mb-4 flex gap-2 flex-wrap">
                          {flags.map((f, idx) => (
                            <div key={idx} className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                              f.color === 'red' ? 'bg-red-50 border border-red-200' :
                              f.color === 'orange' ? 'bg-orange-50 border border-orange-200' :
                              'bg-yellow-50 border border-yellow-200'
                            }`}>
                              <span>{f.icon}</span>
                              <span className="font-medium">{f.label}</span>
                              <span className="text-gray-500 text-xs">{f.detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-6">
                        {/* 成本明细 */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">💰 成本明细</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">平台回款 (CNY)</span>
                              <span className="text-sm font-medium text-blue-600">{formatCNY(order.revenue)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">商品成本</span>
                              <span className="text-sm font-medium text-orange-500">-{formatCNY(order.cost)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">仓储费</span>
                              <span className="text-sm font-medium text-cyan-600">-{formatCNY(order.warehouse)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">包材费</span>
                              <span className="text-sm font-medium text-pink-500">-{formatCNY(order.packing)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">广告费 (含税1.1)</span>
                              <span className="text-sm font-medium text-red-500">-{formatCNY(order.ad)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 mt-2 bg-gray-50 rounded px-2">
                              <span className="text-sm font-semibold text-gray-700">净利润</span>
                              <span className={`text-base font-bold ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {order.profit >= 0 ? '+' : ''}{formatCNY(order.profit)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 利润指标 */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 利润指标</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500 mb-1">利润率</div>
                              <div className={`text-xl font-bold ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {profitRate.toFixed(1)}%
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500 mb-1">单品利润</div>
                              <div className={`text-xl font-bold ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCNY(order.profit / order.qty)}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500 mb-1">ROI</div>
                              <div className="text-xl font-bold text-blue-600">
                                {(order.revenue / order.ad).toFixed(2)}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500 mb-1">广告占比</div>
                              <div className="text-xl font-bold text-orange-500">
                                {((order.ad / order.revenue) * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          
                          {/* AI诊断 */}
                          <div className="mt-4 p-3 rounded-lg border border-dashed border-gray-300">
                            <div className="text-xs text-gray-500 mb-2">AI 诊断</div>
                            {order.profit < 0 ? (
                              <div className="text-sm text-red-600">
                                ⚠️ 此订单亏损，广告费占比 {((order.ad / order.revenue) * 100).toFixed(1)}% 过高，建议优化广告投放或考虑下架
                              </div>
                            ) : profitRate < 20 ? (
                              <div className="text-sm text-yellow-600">
                                ⚡ 此订单利润率较低，可考虑优化成本结构
                              </div>
                            ) : (
                              <div className="text-sm text-green-600">
                                ✅ 此订单利润健康，ROI={(order.revenue / order.ad).toFixed(2)} 达标
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default OrderTable;
