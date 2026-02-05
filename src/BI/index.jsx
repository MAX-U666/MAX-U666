import React, { useState } from "react";
import { ShopProfitModule } from "./components/modules/ShopProfit";
import { OrderProfitModule } from "./components/modules/OrderProfit";
import { SkuProfitModule } from "./components/modules/SkuProfit";
import { CompanyOverviewModule } from "./components/modules/CompanyOverview";

const tabs = [
  { key: "sku", label: "SKU利润", icon: "📦" },
  { key: "shop", label: "店铺利润", icon: "🏪" },
  { key: "order", label: "订单利润", icon: "📋" },
  { key: "company", label: "公司总览", icon: "🏢" },
];

export default function BICenter() {
  const [activeTab, setActiveTab] = useState("sku");

  const renderModule = () => {
    switch (activeTab) {
      case "shop":
        return <ShopProfitModule />;
      case "order":
        return <OrderProfitModule />;
      case "sku":
        return <SkuProfitModule />;
      case "company":
        return <CompanyOverviewModule />;
      default:
        return <SkuProfitModule />;
    }
  };

  return (
    <div>
      {/* 页面标题 - 跟订单中心风格一致 */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <span>📊</span> BI 中心
        </h1>
        <p className="text-sm text-gray-500 mt-1">利润分析与经营洞察</p>
      </div>

      {/* 子模块 Tab 切换 - 简洁风格 */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
              ${activeTab === tab.key 
                ? 'bg-orange-500 text-white shadow-sm' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 模块内容 */}
      <div>
        {renderModule()}
      </div>
    </div>
  );
}
