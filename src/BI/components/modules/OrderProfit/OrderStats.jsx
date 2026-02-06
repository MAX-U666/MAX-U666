import React from 'react';
import { formatCNY } from '../../../utils/format';

export function OrderStats({ data, loading }) {
  const d = data || {};
  const stats = [
    { title: '总订单数', value: (d.totalOrders || 0).toLocaleString() },
    { title: '盈利订单', value: (d.profitOrders || 0).toLocaleString(), badge: d.totalOrders > 0 ? `${((d.profitOrders / d.totalOrders) * 100).toFixed(1)}%` : '0%', positive: true },
    { title: '亏损订单', value: (d.lossOrders || 0).toLocaleString(), badge: d.totalOrders > 0 ? `${((d.lossOrders / d.totalOrders) * 100).toFixed(1)}%` : '0%' },
    { title: '平均利润', value: formatCNY(d.avgProfit || 0), positive: (d.avgProfit || 0) >= 0 },
    { title: '总利润', value: formatCNY(d.totalProfit || 0), positive: (d.totalProfit || 0) >= 0 },
  ];

  return (
    <div className={`grid grid-cols-5 gap-4 ${loading ? 'animate-pulse' : ''}`}>
      {stats.map((stat, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">{stat.title}</div>
          <div className={`text-2xl font-bold ${stat.positive === false ? 'text-red-600' : stat.positive ? 'text-green-600' : 'text-gray-800'}`}>
            {stat.value}
          </div>
          {stat.badge && (
            <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
              stat.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>{stat.badge}</span>
          )}
        </div>
      ))}
    </div>
  );
}
export default OrderStats;
