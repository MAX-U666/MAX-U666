import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCNY } from '../../../utils/format';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444'];

export function OrderTrend({ data }) {
  const orders = data || [];
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-gray-700 text-sm font-semibold mb-4">📈 订单利润趋势</h3>
        <div className="text-center text-gray-400 py-12">暂无数据</div>
      </div>
    );
  }

  // 按日期+店铺聚合
  const dateShopMap = {};
  const allShops = new Set();
  orders.forEach(o => {
    if (!o.date) return;
    if (!dateShopMap[o.date]) dateShopMap[o.date] = {};
    if (!dateShopMap[o.date][o.store]) dateShopMap[o.date][o.store] = 0;
    dateShopMap[o.date][o.store] += o.profit;
    allShops.add(o.store);
  });

  const shopList = [...allShops].sort();
  const chartData = Object.keys(dateShopMap).sort().map(date => {
    const row = { date: date.slice(5) }; // MM-DD
    shopList.forEach(s => { row[s] = Math.round((dateShopMap[date][s] || 0) * 100) / 100; });
    return row;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-gray-700 text-sm font-semibold mb-4">📈 订单利润趋势（按店铺）</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `¥${v}`} />
          <Tooltip formatter={(value) => formatCNY(value)} />
          <Legend />
          {shopList.map((shop, i) => (
            <Line key={shop} type="monotone" dataKey={shop} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export default OrderTrend;
