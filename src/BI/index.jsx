import React, { useState } from "react";
import { Header } from "./components/layout/Header";
import { TabDropdown } from "./components/layout/TabDropdown";
import { ShopProfitModule } from "./components/modules/ShopProfit";
import { OrderProfitModule } from "./components/modules/OrderProfit";
import { SkuProfitModule } from "./components/modules/SkuProfit";
import { CompanyOverviewModule } from "./components/modules/CompanyOverview";
import { useFilters } from "./hooks/useFilters";
import { tabs, shops } from "./utils/constants";

export default function BICenter() {
  const [activeTab, setActiveTab] = useState("shop");
  const { filters, setDateRange, setSelectedShop } = useFilters();

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
        return <ShopProfitModule />;
    }
  };

  const currentTab = tabs.find(t => t.key === activeTab);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* 顶部导航 */}
      <Header
        dateRange={filters.dateRange}
        onDateRangeChange={setDateRange}
        selectedShop={filters.selectedShop}
        onShopChange={setSelectedShop}
        shops={shops}
      />

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tab 切换 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <TabDropdown
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            <h1 className="text-xl font-semibold text-white">
              {currentTab?.label || "BI 中心"}
            </h1>
          </div>
          
          {/* 右侧操作区 */}
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-[#1a1f2e] hover:bg-[#252b3d] rounded-lg text-sm text-gray-300 transition-colors">
              导出报表
            </button>
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm text-white transition-colors">
              刷新数据
            </button>
          </div>
        </div>

        {/* 模块内容 */}
        <div className="bg-[#161b22] rounded-2xl p-6 border border-gray-800">
          {renderModule()}
        </div>
      </div>
    </div>
  );
}

// 导出所有模块供外部使用
export { ShopProfitModule } from "./components/modules/ShopProfit";
export { OrderProfitModule } from "./components/modules/OrderProfit";
export { SkuProfitModule } from "./components/modules/SkuProfit";
export { CompanyOverviewModule } from "./components/modules/CompanyOverview";
