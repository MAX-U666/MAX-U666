/**
 * 成本结构占比组件
 */
import React from 'react';
import { CostBar } from '../../common';
import { WAREHOUSE_FEES } from '../../../utils/constants';

export function CostStructure() {
  const costData = [
    { label: '商品成本', value: 28.6, color: 'bg-blue-500', amount: '¥230,511' },
    { label: '广告费用', value: 17.3, color: 'bg-orange-500', amount: '¥139,296' },
    { label: '仓操作费', value: 2.8, color: 'bg-cyan-500', amount: '¥22,560' },
    { label: '包材费', value: 0.5, color: 'bg-pink-500', amount: '¥4,027' },
  ];

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
      <h3 className="text-gray-500 text-sm mb-4 font-medium">💵 成本结构占比</h3>
      <div className="space-y-4">
        {costData.map((item, index) => (
          <CostBar key={index} {...item} />
        ))}
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">总成本占比</span>
            <span className="font-semibold">49.2%</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-green-600 font-medium">净利润率</span>
            <span className="text-green-600 font-bold text-lg">51.6%</span>
          </div>
        </div>
      </div>
      
      {/* 仓库费用标准 */}
      <div className="mt-5 pt-4 border-t border-gray-200">
        <h4 className="text-xs text-gray-400 mb-2">仓库费用标准</h4>
        <div className="grid grid-cols-3 gap-2">
          {WAREHOUSE_FEES.map((wh, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-cyan-600 text-xs font-medium">{wh.name}</div>
              <div className="font-bold text-sm">¥{wh.fee}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CostStructure;
