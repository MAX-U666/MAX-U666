/**
 * SKU利润模块
 */
import React, { useState } from 'react';
import { SkuOverview } from './SkuOverview';
import { SkuQuadrant } from './SkuQuadrant';
import { SkuRanking } from './SkuRanking';
import { SkuCharts } from './SkuCharts';
import { SkuTable } from './SkuTable';

export function SkuProfitModule() {
  const [timeRange, setTimeRange] = useState('today');
  const [quadrantFilter, setQuadrantFilter] = useState(null);
  const [skuFilter, setSkuFilter] = useState('all');

  return (
    <div className="space-y-6">
      {/* 时间维度切换 */}
      <div className="flex gap-2">
        {[
          { id: 'today', label: '今日' },
          { id: 'yesterday', label: '昨日' },
          { id: '7days', label: '近7天' },
          { id: '30days', label: '近30天' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTimeRange(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              timeRange === t.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SKU概览卡片 */}
      <SkuOverview />

      {/* SKU四象限 */}
      <SkuQuadrant 
        selectedQuadrant={quadrantFilter} 
        onSelect={setQuadrantFilter} 
      />

      {/* 筛选提示条 */}
      {quadrantFilter && (
        <div className="flex items-center gap-2 text-sm bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-gray-600">当前筛选：</span>
          <span className="px-2 py-1 rounded bg-white font-medium">
            {quadrantFilter === 'star' ? '🌟 明星SKU' : 
             quadrantFilter === 'potential' ? '💪 潜力SKU' :
             quadrantFilter === 'thin' ? '⚠️ 薄利SKU' : '🚨 问题SKU'}
          </span>
          <button 
            onClick={() => setQuadrantFilter(null)} 
            className="text-blue-600 hover:underline ml-2"
          >
            清除筛选
          </button>
        </div>
      )}

      {/* TOP榜单 */}
      <SkuRanking />

      {/* 双环饼图 + 散点图 */}
      <SkuCharts />

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">店铺:</label>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option>全部店铺</option>
              <option>B03</option>
              <option>15004</option>
              <option>15010</option>
              <option>15007</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">状态:</label>
            <select 
              value={skuFilter}
              onChange={(e) => setSkuFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">全部</option>
              <option value="profit">盈利SKU</option>
              <option value="loss">亏损SKU</option>
            </select>
          </div>
          <input 
            type="text" 
            placeholder="搜索SKU名称或编码..."
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64"
          />
          <button className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            查询
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
            导出Excel
          </button>
        </div>
      </div>

      {/* SKU利润总表 */}
      <SkuTable quadrantFilter={quadrantFilter} skuFilter={skuFilter} />

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">共 10 个SKU</div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">上一页</button>
          <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</span>
          <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">下一页</button>
        </div>
      </div>
    </div>
  );
}

export default SkuProfitModule;
