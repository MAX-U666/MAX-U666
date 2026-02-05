/**
 * 公司总览模块 - 主入口
 * 设计：蓝色风格子导航
 */
import React, { useState } from 'react';
import { Overview } from './Overview';
import { ExpenseInput } from './ExpenseInput';
import { TrendAnalysis } from './TrendAnalysis';
import { WarningCenter } from './WarningCenter';
import { RelationAnalysis } from './RelationAnalysis';
import { GrowthAnalysis } from './GrowthAnalysis';

const subModules = [
  { id: 'overview', name: '总览仪表盘', icon: '📊', component: Overview },
  { id: 'expense', name: '费用录入', icon: '💵', component: ExpenseInput },
  { id: 'trend', name: '趋势分析', icon: '📈', component: TrendAnalysis },
  { id: 'warning', name: '预警中心', icon: '⚠️', component: WarningCenter },
  { id: 'relation', name: '关联分析', icon: '🔗', component: RelationAnalysis },
  { id: 'growth', name: '增长分析', icon: '🚀', component: GrowthAnalysis },
];

export function CompanyOverviewModule() {
  const [activeModule, setActiveModule] = useState('overview');

  const ActiveComponent = subModules.find(m => m.id === activeModule)?.component || Overview;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 蓝色风格子导航 */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            {subModules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeModule === module.id
                    ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-lg">{module.icon}</span>
                <span>{module.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <ActiveComponent />
      </div>
    </div>
  );
}

export default CompanyOverviewModule;
