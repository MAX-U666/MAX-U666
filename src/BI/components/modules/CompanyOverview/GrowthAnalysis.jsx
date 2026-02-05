/**
 * 增长分析组件
 * 设计：4个渐变色增长卡片 + 增长趋势图 + 店铺增长排名/SKU增长TOP5
 */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts';

// 增长卡片数据
const growthCards = [
  { 
    title: '月销售额增长', 
    value: '+28.5%', 
    amount: '¥458,200',
    icon: '📈',
    gradient: 'from-green-400 via-green-500 to-emerald-600',
    isPositive: true
  },
  { 
    title: '月利润增长', 
    value: '+15.3%', 
    amount: '¥128,500',
    icon: '💰',
    gradient: 'from-blue-400 via-blue-500 to-indigo-600',
    isPositive: true
  },
  { 
    title: '新增SKU', 
    value: '+12', 
    amount: '本月新增',
    icon: '📦',
    gradient: 'from-purple-400 via-purple-500 to-violet-600',
    isPositive: true
  },
  { 
    title: '客单价增长', 
    value: '+8.2%', 
    amount: '¥156.80',
    icon: '🛒',
    gradient: 'from-orange-400 via-orange-500 to-amber-600',
    isPositive: true
  },
];

// 增长趋势数据
const growthTrendData = [
  { month: '1月', sales: 280000, profit: 85000, orders: 1800 },
  { month: '2月', sales: 320000, profit: 92000, orders: 2100 },
  { month: '3月', sales: 295000, profit: 78000, orders: 1950 },
  { month: '4月', sales: 380000, profit: 105000, orders: 2400 },
  { month: '5月', sales: 420000, profit: 118000, orders: 2650 },
  { month: '6月', sales: 458000, profit: 128000, orders: 2850 },
];

// 店铺增长排名数据
const shopGrowthData = [
  { name: '店铺C', growth: 35.2, color: '#10B981' },
  { name: '店铺A', growth: 28.5, color: '#3B82F6' },
  { name: '店铺D', growth: 18.3, color: '#8B5CF6' },
  { name: '店铺B', growth: 12.1, color: '#F59E0B' },
];

// SKU增长TOP5数据
const skuGrowthData = [
  { sku: 'SKU-A008', name: '美白精华液', growth: 125.5, sales: 28500 },
  { sku: 'SKU-C012', name: '保湿面膜', growth: 89.2, sales: 35200 },
  { sku: 'SKU-B003', name: '防晒霜SPF50', growth: 72.8, sales: 22800 },
  { sku: 'SKU-D015', name: '洁面乳', growth: 58.3, sales: 18500 },
  { sku: 'SKU-A021', name: '眼霜', growth: 45.6, sales: 15200 },
];

export function GrowthAnalysis() {
  return (
    <div className="space-y-6">
      {/* 4个渐变色增长卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {growthCards.map((card, index) => (
          <div 
            key={index}
            className={`bg-gradient-to-br ${card.gradient} rounded-xl p-5 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl opacity-90">{card.icon}</span>
              <span className={`text-2xl font-bold ${card.isPositive ? 'text-white' : 'text-red-200'}`}>
                {card.value}
              </span>
            </div>
            <div className="text-lg font-semibold mb-1 opacity-95">{card.amount}</div>
            <div className="text-sm opacity-80">{card.title}</div>
          </div>
        ))}
      </div>

      {/* 增长趋势图 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span>
          月度增长趋势
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis 
                yAxisId="left" 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => `¥${(value/1000).toFixed(0)}k`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === '订单数') return [value, name];
                  return [`¥${value.toLocaleString()}`, name];
                }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="sales" 
                name="销售额" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="profit" 
                name="利润" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="orders" 
                name="订单数" 
                stroke="#F59E0B" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 店铺增长排名 + SKU增长TOP5 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 店铺增长排名 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏆</span>
            店铺增长排名
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shopGrowthData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, '增长率']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="growth" radius={[0, 4, 4, 0]}>
                  {shopGrowthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SKU增长TOP5 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🚀</span>
            SKU增长TOP5
          </h3>
          <div className="space-y-3">
            {skuGrowthData.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.sku}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-600 font-bold">+{item.growth}%</div>
                  <div className="text-xs text-gray-500">¥{item.sales.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GrowthAnalysis;
