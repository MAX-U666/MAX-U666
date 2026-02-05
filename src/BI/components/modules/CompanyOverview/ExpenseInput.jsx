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
    <div className="space-y-5">
      {/* 周期选择 */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">录入周期：</span>
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
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
            className="bg-white rounded-xl p-4 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{cat.icon}</span>
              <span className="text-gray-700 text-sm font-medium">{cat.label}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
              <input
                type="number"
                value={expenses[cat.key]}
                onChange={e => handleChange(cat.key, e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-8 pr-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 汇总和保存 */}
      <div className="flex items-center justify-between bg-orange-50 rounded-xl p-4 border border-orange-200">
        <div>
          <span className="text-gray-600 text-sm">本{period === "daily" ? "日" : period === "weekly" ? "周" : "月"}总支出：</span>
          <span className="text-2xl font-bold text-orange-600 ml-2">
            ¥{totalExpense.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
        >
          保存录入
        </button>
      </div>
    </div>
  );
}
