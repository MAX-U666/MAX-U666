import React, { useState } from "react";
import { ShopProfitModule } from "./components/modules/ShopProfit";
import { OrderProfitModule } from "./components/modules/OrderProfit";
import { SkuProfitModule } from "./components/modules/SkuProfit";
import { CompanyOverviewModule } from "./components/modules/CompanyOverview";

const tabs = [
  { key: "shop", label: "店铺利润", icon: "🏪" },
  { key: "order", label: "订单利润", icon: "📋" },
  { key: "sku", label: "SKU利润", icon: "📦" },
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
      {/* Tab 切换栏 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        padding: '4px',
        background: '#F5F5F7',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.key 
                ? 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)' 
                : 'transparent',
              color: activeTab === tab.key ? '#fff' : '#666',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 模块内容 */}
      {renderModule()}
    </div>
  );
}
