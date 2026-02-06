import React, { useState, useRef, useEffect } from "react";
import { ShopProfitModule } from "./components/modules/ShopProfit";
import { OrderProfitModule } from "./components/modules/OrderProfit";
import { SkuProfitModule } from "./components/modules/SkuProfit";
import { CompanyOverviewModule } from "./components/modules/CompanyOverview";
import { ProductManagementModule } from "./components/modules/ProductManagement";

const tabs = [
  { key: "sku", label: "SKU利润", icon: "📦" },
  { key: "shop", label: "店铺利润", icon: "🏪" },
  { key: "order", label: "订单利润", icon: "📋" },
  { key: "company", label: "公司总览", icon: "🏢" },
  { key: "products", label: "产品管理", icon: "🏷️" },
];

export default function BICenter({ defaultTab }) {
  // 从外部传入的 key 映射：bi-sku -> sku, bi-shop -> shop, etc.
  const mapTabKey = (key) => {
    if (!key) return 'sku';
    const mapped = key.replace('bi-', '');
    // bi-overview 对应内部 tab key 'company'
    if (mapped === 'overview') return 'company';
    return mapped;
  };

  const [activeTab, setActiveTab] = useState(mapTabKey(defaultTab));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 当外部 defaultTab 变化时同步
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(mapTabKey(defaultTab));
    }
  }, [defaultTab]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentTab = tabs.find(t => t.key === activeTab) || tabs[0];

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
      case "products":
        return <ProductManagementModule />;
      default:
        return <SkuProfitModule />;
    }
  };

  return (
    <div>
      {/* 页面标题 + 下拉选择器 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span>📊</span> BI 中心
          </h1>
          <p className="text-sm text-gray-500 mt-1">利润分析与经营洞察</p>
        </div>

        {/* 下拉选择器 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-orange-300 hover:shadow transition-all"
          >
            <span className="text-lg">{currentTab.icon}</span>
            <span className="font-medium text-gray-800">{currentTab.label}</span>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* 下拉菜单 */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setIsDropdownOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                    ${activeTab === tab.key 
                      ? 'bg-orange-50 text-orange-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                  {activeTab === tab.key && (
                    <svg className="w-4 h-4 ml-auto text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 模块内容 */}
      <div>
        {renderModule()}
      </div>
    </div>
  );
}
