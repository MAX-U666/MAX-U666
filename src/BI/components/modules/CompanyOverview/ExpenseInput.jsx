/**
 * 公司级费用录入组件
 * 设计：2列布局 + 底部汇总条 + 重置/保存按钮
 */
import React, { useState } from 'react';

const formatCNY = (value) => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value);
};

const defaultExpenses = [
  { id: 1, name: '联盟营销佣金', value: 12500 },
  { id: 2, name: '平台费用', value: 8900 },
  { id: 3, name: '盈信测评成本', value: 3500 },
  { id: 4, name: '红人测评成本', value: 15000 },
  { id: 5, name: '线下店铺退款', value: 2200 },
  { id: 6, name: '物流补贴', value: 4800 },
];

export function ExpenseInput({ onSave }) {
  const [expenses, setExpenses] = useState(defaultExpenses);

  const handleChange = (id, newValue) => {
    setExpenses(prev => prev.map(exp => 
      exp.id === id ? { ...exp, value: parseFloat(newValue) || 0 } : exp
    ));
  };

  const total = expenses.reduce((sum, exp) => sum + exp.value, 0);

  const handleReset = () => setExpenses(defaultExpenses);

  const handleSave = () => {
    if (onSave) onSave({ expenses, total });
    alert('费用数据保存成功！');
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-xl">💵</span>
          公司级费用录入
        </h3>
        <p className="text-sm text-gray-500 mt-1">这些费用将从总利润中扣除，用于计算公司净利润</p>
      </div>
      
      {/* 2列布局 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {expenses.map((expense) => (
          <div 
            key={expense.id} 
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <label className="text-sm font-medium text-gray-700 w-28 shrink-0">
              {expense.name}
            </label>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-gray-400 font-medium">¥</span>
              <input
                type="number"
                value={expense.value}
                onChange={(e) => handleChange(expense.id, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="输入金额"
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* 底部汇总条 */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-lg">📊</span>
            <span className="font-medium text-gray-700">公司费用合计</span>
          </div>
          <span className="text-2xl font-bold text-blue-600">{formatCNY(total)}</span>
        </div>
      </div>
      
      {/* 重置/保存按钮 */}
      <div className="mt-6 flex justify-end gap-3">
        <button 
          onClick={handleReset} 
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
        >
          重置
        </button>
        <button 
          onClick={handleSave} 
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-sm"
        >
          保存费用
        </button>
      </div>
    </div>
  );
}

export default ExpenseInput;
