/**
 * BI Tab 下拉菜单组件
 */
import React, { useState } from 'react';
import { BI_TABS } from '../../utils/constants';

export function TabDropdown({ activeTab, onTabChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentTab = BI_TABS.find(t => t.id === activeTab);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <span className="text-blue-600 font-bold text-lg">BI</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-700 font-medium">
          {currentTab?.icon} {currentTab?.name}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {BI_TABS.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              } ${index !== BI_TABS.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TabDropdown;
