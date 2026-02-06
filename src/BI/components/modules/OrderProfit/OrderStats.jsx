import React from 'react';
import { formatCNY } from '../../../utils/format';

export function OrderStats({ data, loading }) {
  const d = data || {};
  const sc = d.statusCounts || {};

  const stats = [
    { title: '总订单', value: (d.totalOrders || 0).toLocaleString(), icon: '📋', bg: 'bg-blue-50', iconBg: 'bg-blue-100' },
    { title: '已完成', value: (d.finishedOrders || 0).toLocaleString(), icon: '✅', bg: 'bg-green-50', iconBg: 'bg-green-100' },
    { title: '发货中', value: ((sc.wait_receiver_confirm || 0) + (sc.wait_seller_send || 0)).toLocaleString(), icon: '🚚', bg: 'bg-yellow-50', iconBg: 'bg-yellow-100' },
    { title: '已取消', value: (sc.cancelled || 0).toLocaleString(), icon: '❌', bg: 'bg-red-50', iconBg: 'bg-red-100' },
    { title: '已退款', value: ((sc.returned || 0) + (sc.refunding || 0)).toLocaleString(), icon: '↩️', bg: 'bg-orange-50', iconBg: 'bg-orange-100' },
  ];

  const profitStats = [
    { title: '盈利订单', value: (d.profitOrders || 0).toLocaleString(), sub: d.finishedOrders > 0 ? `${((d.profitOrders / d.finishedOrders) * 100).toFixed(1)}%` : '0%', subColor: 'text-green-600', icon: '📈', bg: 'bg-green-50', iconBg: 'bg-green-100' },
    { title: '亏损订单', value: (d.lossOrders || 0).toLocaleString(), sub: d.finishedOrders > 0 ? `${((d.lossOrders / d.finishedOrders) * 100).toFixed(1)}%` : '0%', subColor: 'text-red-600', icon: '📉', bg: 'bg-red-50', iconBg: 'bg-red-100' },
    { title: '平均利润', value: formatCNY(d.avgProfit || 0), positive: (d.avgProfit || 0) >= 0, icon: '💵', bg: 'bg-purple-50', iconBg: 'bg-purple-100' },
    { title: '总利润(已完成)', value: formatCNY(d.totalProfit || 0), positive: (d.totalProfit || 0) >= 0, icon: '💰', bg: 'bg-cyan-50', iconBg: 'bg-cyan-100' },
  ];

  return (
    <div className="space-y-4">
      {/* 订单状态统计 */}
      <div className={`grid grid-cols-5 gap-4 ${loading ? 'animate-pulse' : ''}`}>
        {stats.map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-2">{s.title}</div>
                <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              </div>
              <div className={`w-10 h-10 ${s.iconBg} rounded-lg flex items-center justify-center text-lg`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 利润统计(基于已完成订单) */}
      <div className={`grid grid-cols-4 gap-4 ${loading ? 'animate-pulse' : ''}`}>
        {profitStats.map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-2">{s.title}</div>
                <div className={`text-2xl font-bold ${s.positive === false ? 'text-red-600' : s.positive ? 'text-green-600' : 'text-gray-800'}`}>
                  {s.value}
                </div>
                {s.sub && <div className={`text-sm mt-1 ${s.subColor}`}>{s.sub}</div>}
              </div>
              <div className={`w-10 h-10 ${s.iconBg} rounded-lg flex items-center justify-center text-lg`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default OrderStats;
