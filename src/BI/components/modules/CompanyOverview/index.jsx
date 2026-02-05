import React, { useState } from "react";
import { Overview } from "./Overview";
import { ExpenseInput } from "./ExpenseInput";
import { TrendAnalysis } from "./TrendAnalysis";
import { WarningCenter } from "./WarningCenter";
import { RelationAnalysis } from "./RelationAnalysis";
import { GrowthAnalysis } from "./GrowthAnalysis";

const tabs = [
  { key: "overview", label: "总览", icon: "📊" },
  { key: "expense", label: "费用录入", icon: "💰" },
  { key: "trend", label: "趋势分析", icon: "📈" },
  { key: "warning", label: "预警中心", icon: "⚠️" },
  { key: "relation", label: "关联分析", icon: "🔗" },
  { key: "growth", label: "增长分析", icon: "🚀" }
];

export function CompanyOverviewModule() {
  const [activeTab, setActiveTab] = useState("overview");

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "expense":
        return <ExpenseInput onSave={(data) => console.log("Saved:", data)} />;
      case "trend":
        return <TrendAnalysis />;
      case "warning":
        return <WarningCenter />;
      case "relation":
        return <RelationAnalysis />;
      case "growth":
        return <GrowthAnalysis />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="space-y-5">
      {/* 子导航 - 白色风格 */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
}

export { Overview } from "./Overview";
export { ExpenseInput } from "./ExpenseInput";
export { TrendAnalysis } from "./TrendAnalysis";
export { WarningCenter } from "./WarningCenter";
export { RelationAnalysis } from "./RelationAnalysis";
export { GrowthAnalysis } from "./GrowthAnalysis";
