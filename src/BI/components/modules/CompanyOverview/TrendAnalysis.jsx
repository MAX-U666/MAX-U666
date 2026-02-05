/**
 * 趋势分析组件
 * 设计：4个趋势卡片 + 近30天利润柱状图 + 店铺对比/ROI趋势占位图
 */
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

// 模拟近30天利润数据
const profitData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  profit: Math.floor(Math.random() * 15000) + 5000,
  revenue: Math.floor(Math.random() * 50000) + 20000,
}));

// 趋势卡片数据
const trendCards = [
  { 
    title: '本月利润趋势', 
    value: '¥128,500', 
    change: '+12.5%', 
    isUp: true,
    icon: '📈',
    color: 'from-green-500 to-emerald-600'
  },
  { 
    title: '环比上月', 
    value: '¥114,200', 
    change: '+8.3%', 
    isUp: true,
    icon: '📊',
    color: 'from-blue-500 to-indigo-600'
  },
  { 
    title: '同比去年', 
    value: '¥98,700', 
    change: '+30.2%', 
    isUp: true,
    icon: '📅',
    color: 'from-purple-500 to-violet-600'
  },
  { 
    title: '预测下月', 
    value: '¥135,000', 
    change: '+5.1%', 
    isUp: true,
    icon: '🔮',
    color: 'from-orange-500 to-amber-600'
  },
];

// 店铺对比数据
const shopCompareData = [
  { name: '店铺A', profit: 45000, cost: 32000 },
  { name: '店铺B', profit: 38000, cost: 28000 },
  { name: '店铺C', profit: 52000, cost: 35000 },
  { name: '店铺D', profit: 28000, cost: 22000 },
];

// ROI趋势数据
const roiTrendData = Array.from({ length: 12 }, (_, i) => ({
  month: `${i + 1}月`,
  roi: (Math.random() * 2 + 2).toFixed(2),
  target: 3.5,
}));

export function TrendAnalysis() {
  return (
    <div className="space-y-6">
      {/* 4个趋势卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {trendCards.map((card, index) => (
          <div 
            key={index}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                card.isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {card.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">{card.value}</div>
            <div className="text-sm text-gray-500">{card.title}</div>
          </div>
        ))}
      </div>

      {/* 近30天利润柱状图 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span>
          近30天利润趋势
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `¥${(value/1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value) => [`¥${value.toLocaleString()}`, '利润']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar 
                dataKey="profit" 
                fill="url(#profitGradient)" 
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 店铺对比 + ROI趋势 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 店铺利润对比 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏪</span>
            店铺利润对比
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shopCompareData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(value) => `¥${(value/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => `¥${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Bar dataKey="profit" name="利润" fill="#10B981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="cost" name="成本" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROI趋势 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📈</span>
            ROI趋势分析
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roiTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 5]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="roi" 
                  name="实际ROI" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  name="目标ROI" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrendAnalysis;
