/**
 * BI 顶部导航组件
 */
import React from 'react';
import { TabDropdown } from './TabDropdown';
import { SHOPS, DATE_RANGES, RATE } from '../../utils/constants';

export function Header({ 
  activeTab, 
  onTabChange, 
  selectedShop, 
  onShopChange, 
  dateRange, 
  onDateRangeChange 
}) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-gray-800">GMV MAX</h1>
          
          <TabDropdown 
            activeTab={activeTab} 
            onTabChange={onTabChange} 
          />
        </div>
        
        {/* 全局筛选 */}
        <div className="flex gap-3 items-center">
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
            汇率: 1 IDR = ¥{RATE}
          </div>
          
          <select 
            value={selectedShop} 
            onChange={(e) => onShopChange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {SHOPS.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            {DATE_RANGES.map(d => (
              <button
                key={d.id}
                onClick={() => onDateRangeChange(d.id)}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  dateRange === d.id 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
