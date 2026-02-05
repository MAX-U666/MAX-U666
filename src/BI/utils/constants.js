/**
 * BI 模块 - 常量配置
 */

// 印尼盾对人民币汇率
export const RATE = 0.00046;

// Tab 配置 (多种导出名兼容)
export const tabs = [
  { key: 'shop', id: 'shop', label: '店铺利润', name: '店铺利润', icon: '🏪' },
  { key: 'order', id: 'order', label: '订单利润', name: '订单利润', icon: '📋' },
  { key: 'sku', id: 'sku', label: 'SKU利润', name: 'SKU利润', icon: '📦' },
  { key: 'company', id: 'company', label: '公司总览', name: '公司总览', icon: '🏢' },
];
export const TABS = tabs;
export const BI_TABS = tabs;

// 店铺列表 (多种导出名兼容)
export const shops = [
  { id: 'all', name: '全部店铺' },
  { id: 'B03', name: 'B03店铺' },
  { id: '15004', name: '15004店铺' },
  { id: '15007', name: '15007店铺' },
  { id: '15010', name: '15010店铺' },
];
export const SHOPS = shops;

// 日期范围选项
export const DATE_RANGES = [
  { id: 'today', label: '今日' },
  { id: 'yesterday', label: '昨日' },
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
];

// 公司总览子Tab
export const COMPANY_SUB_TABS = [
  { id: 'overview', name: '总览', icon: '📊' },
  { id: 'expense', name: '费用录入', icon: '💵' },
  { id: 'trends', name: '趋势分析', icon: '📈' },
  { id: 'warning', name: '预警中心', icon: '🚨' },
  { id: 'relation', name: '关联分析', icon: '🔗' },
  { id: 'growth', name: '增长分析', icon: '📊' },
];

// 仓库费用标准
export const WAREHOUSE_FEES = [
  { name: 'momo', fee: 1.5 },
  { name: 'BBT', fee: 2.8 },
  { name: '默认', fee: 3.2 },
];

// ROI 阈值
export const ROI_THRESHOLD = {
  good: 4,
  warning: 2,
};

// 利润率阈值
export const PROFIT_RATE_THRESHOLD = {
  good: 30,
  warning: 15,
};
