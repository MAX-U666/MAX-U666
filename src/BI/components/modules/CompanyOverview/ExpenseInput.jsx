import React, { useState } from "react";

const expenseCategories = [
  { key: "salary", label: "工资支出", icon: "👥" },
  { key: "rent", label: "房租水电", icon: "🏢" },
  { key: "logistics", label: "物流仓储", icon: "📦" },
  { key: "marketing", label: "营销推广", icon: "📢" },
  { key: "office", label: "办公杂费", icon: "📎" },
  { key: "other", label: "其他支出", icon: "📋" }
];

export function ExpenseInput({ onSave }) {
  const [expenses, setExpenses] = useState({
    salary: "",
    rent: "",
    logistics: "",
    marketing: "",
    office: "",
    other: ""
  });
  const [period, setPeriod] = useState("monthly");

  const handleChange = (key, value) => {
    setExpenses(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const totalExpense = Object.values(expenses)
    .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  const handleSave = () => {
    if (onSave) {
      onSave({ expenses, period, total: totalExpense });
    }
  };

  return (
    <div className="space-y-6">
      {/* 周期选择 */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">录入周期：</span>
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                period === p
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-[#1a1f2e] text-gray-400 hover:bg-[#252b3d]"
              }`}
            >
              {p === "daily" ? "日" : p === "weekly" ? "周" : "月"}
            </button>
          ))}
        </div>
      </div>

      {/* 费用录入卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {expenseCategories.map(cat => (
          <div
            key={cat.key}
            className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-700/50"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{cat.icon}</span>
              <span className="text-gray-300 text-sm">{cat.label}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                value={expenses[cat.key]}
                onChange={e => handleChange(cat.key, e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg py-2 pl-8 pr-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 汇总和保存 */}
      <div className="flex items-center justify-between bg-[#1a1f2e] rounded-xl p-4 border border-gray-700/50">
        <div>
          <span className="text-gray-400 text-sm">本{period === "daily" ? "日" : period === "weekly" ? "周" : "月"}总支出：</span>
          <span className="text-2xl font-bold text-white ml-2">
            ¥{totalExpense.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          保存录入
        </button>
      </div>
    </div>
  );
}
