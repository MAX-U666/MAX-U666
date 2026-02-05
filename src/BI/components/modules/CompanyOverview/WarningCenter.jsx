/**
 * 预警中心组件
 * 设计：4个统计卡片（严重预警/一般预警/信息提示/健康SKU）+ 预警列表
 */
import React, { useState } from 'react';

// 预警统计数据
const warningStats = [
  { 
    title: '严重预警', 
    count: 3, 
    icon: '🔴',
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700'
  },
  { 
    title: '一般预警', 
    count: 8, 
    icon: '🟡',
    color: 'from-yellow-500 to-amber-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700'
  },
  { 
    title: '信息提示', 
    count: 12, 
    icon: '🔵',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  },
  { 
    title: '健康SKU', 
    count: 45, 
    icon: '🟢',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700'
  },
];

// 预警列表数据
const warningList = [
  { 
    id: 1, 
    level: '严重', 
    type: 'ROI异常',
    sku: 'SKU-A001',
    shop: '店铺A',
    message: 'ROI连续3天低于1.5，建议暂停广告',
    time: '10分钟前',
    levelColor: 'bg-red-100 text-red-700 border-red-200'
  },
  { 
    id: 2, 
    level: '严重', 
    type: '库存预警',
    sku: 'SKU-B023',
    shop: '店铺B',
    message: '库存仅剩15件，预计2天内售罄',
    time: '25分钟前',
    levelColor: 'bg-red-100 text-red-700 border-red-200'
  },
  { 
    id: 3, 
    level: '严重', 
    type: '亏损预警',
    sku: 'SKU-C012',
    shop: '店铺C',
    message: '本周累计亏损¥2,350，建议调整定价策略',
    time: '1小时前',
    levelColor: 'bg-red-100 text-red-700 border-red-200'
  },
  { 
    id: 4, 
    level: '一般', 
    type: '转化下降',
    sku: 'SKU-A005',
    shop: '店铺A',
    message: '转化率环比下降25%，建议优化详情页',
    time: '2小时前',
    levelColor: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  },
  { 
    id: 5, 
    level: '一般', 
    type: '广告效果',
    sku: 'SKU-D008',
    shop: '店铺D',
    message: '广告点击率低于类目均值，建议更换素材',
    time: '3小时前',
    levelColor: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  },
  { 
    id: 6, 
    level: '信息', 
    type: '价格变动',
    sku: 'SKU-B015',
    shop: '店铺B',
    message: '竞品价格下调10%，建议关注市场动态',
    time: '5小时前',
    levelColor: 'bg-blue-100 text-blue-700 border-blue-200'
  },
];

export function WarningCenter() {
  const [filter, setFilter] = useState('all');

  const filteredWarnings = filter === 'all' 
    ? warningList 
    : warningList.filter(w => w.level === filter);

  return (
    <div className="space-y-6">
      {/* 4个统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {warningStats.map((stat, index) => (
          <div 
            key={index}
            onClick={() => setFilter(stat.title === '健康SKU' ? 'all' : stat.title.replace('预警', '').replace('提示', '信息'))}
            className={`${stat.bgColor} ${stat.borderColor} border rounded-xl p-5 cursor-pointer hover:shadow-md transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">{stat.icon}</span>
              <span className={`text-3xl font-bold ${stat.textColor}`}>{stat.count}</span>
            </div>
            <div className={`text-sm font-medium ${stat.textColor}`}>{stat.title}</div>
          </div>
        ))}
      </div>

      {/* 筛选标签 */}
      <div className="flex gap-2">
        {['all', '严重', '一般', '信息'].map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === level 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {level === 'all' ? '全部' : level}
          </button>
        ))}
      </div>

      {/* 预警列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>⚠️</span>
            预警详情列表
            <span className="text-sm font-normal text-gray-500">
              （共 {filteredWarnings.length} 条）
            </span>
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredWarnings.map((warning) => (
            <div 
              key={warning.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${warning.levelColor}`}>
                    {warning.level}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">{warning.type}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-sm text-gray-500">{warning.sku}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-sm text-gray-500">{warning.shop}</span>
                    </div>
                    <p className="text-sm text-gray-600">{warning.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{warning.time}</span>
                  <button className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    处理
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WarningCenter;
