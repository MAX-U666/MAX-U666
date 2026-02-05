/**
 * 公司总览仪表盘组件
 * 设计：蓝紫色渐变风格
 */
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// 核心指标数据
const coreMetrics = [
  { 
    title: '本月总销售额', 
    value: '¥458,200', 
    change: '+12.5%', 
    isUp: true,
    icon: '💰',
    gradient: 'from-blue-500 to-indigo-600'
  },
  { 
    title: '本月总利润', 
    value: '¥128,500', 
    change: '+8.3%', 
    isUp: true,
    icon: '📈',
    gradient: 'from-green-500 to-emerald-600'
  },
  { 
    title: '广告总花费', 
    value: '¥85,600', 
    change: '+15.2%', 
    isUp: false,
    icon: '📢',
    gradient: 'from-purple-500 to-violet-600'
  },
  { 
    title: '平均ROI', 
    value: '3.25', 
    change: '+0.15', 
    isUp: true,
    icon: '🎯',
    gradient: 'from-orange-500 to-amber-600'
  },
];

// 店铺分布数据
const shopDistribution = [
  { name: '店铺A', value: 35, color: '#3B82F6' },
  { name: '店铺B', value: 28, color: '#10B981' },
  { name: '店铺C', value: 22, color: '#8B5CF6' },
  { name: '店铺D', value: 15, color: '#F59E0B' },
];

// SKU状态数据
const skuStatus = [
  { name: '盈利SKU', value: 45, color: '#10B981' },
  { name: '持平SKU', value: 12, color: '#F59E0B' },
  { name: '亏损SKU', value: 8, color: '#EF4444' },
];

// 快捷入口
const quickActions = [
  { name: '录入费用', icon: '💵', path: 'expense', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { name: '查看预警', icon: '⚠️', path: 'warning', color: 'bg-red-50 text-red-700 hover:bg-red-100' },
  { name: '趋势分析', icon: '📈', path: 'trend', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
  { name: '增长报告', icon: '🚀', path: 'growth', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
];

export function Overview() {
  return (
    <div className="space-y-6">
      {/* 顶部欢迎横幅 */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">👋 欢迎回来，管理员</h1>
            <p className="text-blue-100 opacity-90">今日数据概览 · 2026年2月5日 星期三</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">¥458,200</div>
            <div className="text-blue-100 text-sm">本月累计销售额</div>
          </div>
        </div>
      </div>

      {/* 4个核心指标卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {coreMetrics.map((metric, index) => (
          <div 
            key={index}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.gradient} flex items-center justify-center text-xl text-white`}>
                {metric.icon}
              </span>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                metric.isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {metric.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">{metric.value}</div>
            <div className="text-sm text-gray-500">{metric.title}</div>
          </div>
        ))}
      </div>

      {/* 中间区域：饼图 + 快捷入口 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 店铺销售占比 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🏪 店铺销售占比</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shopDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {shopDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {shopDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-gray-600">{item.name}</span>
                <span className="font-medium text-gray-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* SKU盈亏状态 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📦 SKU盈亏状态</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={skuStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {skuStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {skuStatus.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-gray-600">{item.name}</span>
                <span className="font-medium text-gray-800">{item.value}个</span>
              </div>
            ))}
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ 快捷入口</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className={`${action.color} rounded-xl p-4 text-center transition-all hover:scale-105`}
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="text-sm font-medium">{action.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部快速统计 */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-800">4</div>
            <div className="text-sm text-gray-500">运营店铺</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">65</div>
            <div className="text-sm text-gray-500">在售SKU</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">45</div>
            <div className="text-sm text-gray-500">盈利SKU</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">3</div>
            <div className="text-sm text-gray-500">预警数量</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">92%</div>
            <div className="text-sm text-gray-500">健康度</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;
