/**
 * BI 模块 - Mock 数据
 */

// 店铺数据
export const shopData = [
  { id: 'B03', orders: 515, revenue: 295331.94, cost: 76228.16, warehouse: 8240.00, packing: 1648.00, ad: 52619.52, profit: 118265.05, roi: 5.61, rate: 40.0 },
  { id: '15004', orders: 289, revenue: 177176.00, cost: 74414.13, warehouse: 4624.00, packing: 867.00, ad: 73206.00, profit: 24064.87, roi: 2.42, rate: 13.6 },
  { id: '15010', orders: 199, revenue: 89550.88, cost: 50192.14, warehouse: 2985.00, packing: 597.00, ad: 7360.00, profit: 28416.74, roi: 12.17, rate: 31.7 },
  { id: '15007', orders: 156, revenue: 67880.00, cost: 31250.00, warehouse: 2340.00, packing: 468.00, ad: 12800.00, profit: 21022.00, roi: 5.30, rate: 31.0 },
  { id: '15009', orders: 89, revenue: 34560.00, cost: 15680.00, warehouse: 1335.00, packing: 267.00, ad: 8560.00, profit: 8718.00, roi: 4.04, rate: 25.2 },
];

// 订单数据
export const orderData = [
  { id: 'ORD-20240115-001', store: 'B03', date: '2024-01-15', sku: 'SKU-5C-001', skuName: '凡士林真润倍护霜40G', qty: 2, revenue: 155.42, cost: 40.00, warehouse: 6.40, packing: 4.00, ad: 27.68, profit: 77.34 },
  { id: 'ORD-20240115-002', store: 'B03', date: '2024-01-15', sku: 'SKU-VC-002', skuName: 'Aiposhiy白提味牙膏120g', qty: 1, revenue: 82.05, cost: 25.00, warehouse: 3.20, packing: 2.00, ad: 18.50, profit: 33.35 },
  { id: 'ORD-20240115-003', store: 'B03', date: '2024-01-15', sku: 'SKU-HA-003', skuName: '二氧化碳洗发水300G', qty: 3, revenue: 115.92, cost: 35.00, warehouse: 9.60, packing: 6.00, ad: 22.40, profit: 42.92 },
  { id: 'ORD-20240115-004', store: '15004', date: '2024-01-15', sku: 'SKU-RT-004', skuName: 'Aiposhiy生姜洗发水', qty: 1, revenue: 97.74, cost: 38.00, warehouse: 2.80, packing: 2.00, ad: 35.20, profit: 19.74 },
  { id: 'ORD-20240115-005', store: '15004', date: '2024-01-15', sku: 'SKU-NI-005', skuName: '紫色牙膏+牙刷', qty: 2, revenue: 67.73, cost: 22.00, warehouse: 5.60, packing: 4.00, ad: 28.80, profit: 7.33 },
  { id: 'ORD-20240114-006', store: '15010', date: '2024-01-14', sku: 'SKU-SA-006', skuName: '凡士林真润倍护霜40G(大)', qty: 1, revenue: 58.61, cost: 18.00, warehouse: 3.20, packing: 2.00, ad: 12.50, profit: 22.91 },
  { id: 'ORD-20240114-007', store: '15010', date: '2024-01-14', sku: 'SKU-TB-101', skuName: '红色牙线', qty: 1, revenue: 38.65, cost: 15.00, warehouse: 3.20, packing: 2.00, ad: 25.60, profit: -7.15 },
  { id: 'ORD-20240114-008', store: '15007', date: '2024-01-14', sku: 'SKU-CE-007', skuName: '黄色牙刷', qty: 2, revenue: 87.02, cost: 28.00, warehouse: 6.40, packing: 4.00, ad: 18.00, profit: 30.62 },
];

// B03店铺的SKU数据
export const b03SkuData = {
  top10: [
    { name: '凡士林真润倍护霜40G', orders: 269, profit: 1626.03, roi: 3.84, rate: 44.35 },
    { name: 'Aiposhiy白提味牙膏120g+黄色牙刷', orders: 14, profit: 111.93, roi: 2.83, rate: 38.61 },
    { name: '二氧化碳洗发水300G', orders: 21, profit: 163.03, roi: 2.88, rate: 25.55 },
    { name: 'Aiposhiy-ZSYG*3+Aiposhiy-HSYS', orders: 4, profit: 42.24, roi: 2.79, rate: 23.29 },
    { name: '紫色牙膏+牙刷', orders: 3, profit: 7.84, roi: 9.32, rate: 46.31 },
    { name: 'Aiposhiy-BTYG+Aiposhiy-HSYS', orders: 7, profit: 42.42, roi: 4.71, rate: 38.61 },
    { name: '黄色牙刷', orders: 1, profit: 26.24, roi: 43.28, rate: 60.63 },
    { name: 'Aiposhiy生姜洗发水', orders: 68, profit: 672.84, roi: 2.84, rate: 19.90 },
    { name: '凡士林真润倍护霜40G(大)', orders: 108, profit: 698.71, roi: 3.41, rate: 40.39 },
    { name: 'Aiposhiy-SJXFS', orders: 68, profit: 672.84, roi: 2.84, rate: 19.90 },
  ],
  bottom5: [
    { name: '二氧化碳洗发水300G(小)', orders: 3, profit: -24.05, roi: 1.45, rate: -4.33 },
    { name: '红色牙线', orders: 2, profit: -6.18, roi: 1.89, rate: -1.19 },
    { name: 'Aiposhiy-ZSYG*3+139-ID911YS', orders: 4, profit: -13.00, roi: 1.45, rate: -4.33 },
    { name: '紫色牙膏', orders: 2, profit: -4.72, roi: 2.36, rate: 30.93 },
    { name: 'AIPOSHIY-YX1', orders: 2, profit: 0, roi: 82.28, rate: 56.10 },
  ]
};

// SKU利润总表数据
export const skuData = [
  { sku: 'SKU-5C-001', name: '凡士林真润倍护霜40G', store: 'B03', orders: 269, revenue: 41767.98, cost: 10760.00, warehouse: 860.80, packing: 538.00, ad: 10873.44, profit: 18735.74, roi: 3.84, rate: 44.85 },
  { sku: 'SKU-VC-002', name: 'Aiposhiy白提味牙膏120g+黄色牙刷', store: 'B03', orders: 14, revenue: 1148.70, cost: 350.00, warehouse: 44.80, packing: 28.00, ad: 405.97, profit: 319.93, roi: 2.83, rate: 27.85 },
  { sku: 'SKU-HA-003', name: '二氧化碳洗发水300G', store: 'B03', orders: 21, revenue: 1626.48, cost: 525.00, warehouse: 67.20, packing: 42.00, ad: 565.22, profit: 427.06, roi: 2.88, rate: 26.26 },
  { sku: 'SKU-RT-004', name: 'Aiposhiy生姜洗发水', store: '15004', orders: 68, revenue: 6646.32, cost: 2584.00, warehouse: 190.40, packing: 136.00, ad: 2340.84, profit: 1395.08, roi: 2.84, rate: 20.99 },
  { sku: 'SKU-NI-005', name: '紫色牙膏+牙刷', store: '15004', orders: 3, revenue: 253.29, cost: 66.00, warehouse: 9.60, packing: 6.00, ad: 27.19, profit: 144.50, roi: 9.32, rate: 57.05 },
  { sku: 'SKU-SA-006', name: '凡士林真润倍护霜40G(大)', store: '15010', orders: 108, revenue: 6329.88, cost: 1944.00, warehouse: 345.60, packing: 216.00, ad: 1855.11, profit: 1969.17, roi: 3.41, rate: 31.11 },
  { sku: 'SKU-CE-007', name: '黄色牙刷', store: '15007', orders: 1, revenue: 43.51, cost: 14.00, warehouse: 3.20, packing: 2.00, ad: 1.01, profit: 23.30, roi: 43.28, rate: 53.55 },
  { sku: 'SKU-TB-101', name: '红色牙线', store: 'B03', orders: 2, revenue: 77.02, cost: 30.00, warehouse: 6.40, packing: 4.00, ad: 40.78, profit: -4.16, roi: 1.89, rate: -5.40 },
  { sku: 'SKU-SM-102', name: '二氧化碳洗发水300G(小)', store: 'B03', orders: 3, revenue: 115.53, cost: 45.00, warehouse: 9.60, packing: 6.00, ad: 79.70, profit: -24.77, roi: 1.45, rate: -21.44 },
  { sku: 'SKU-GF-103', name: 'Aiposhiy-ZSYG*3+139-ID911YS', store: '15004', orders: 4, revenue: 154.04, cost: 80.00, warehouse: 12.80, packing: 8.00, ad: 106.27, profit: -53.03, roi: 1.45, rate: -34.43 },
];

// 公司级费用数据
export const companyExpenses = [
  { id: 1, name: '联盟营销佣金', value: 12500 },
  { id: 2, name: '平台费用', value: 8900 },
  { id: 3, name: '盈信测评成本', value: 3500 },
  { id: 4, name: '红人测评成本', value: 15000 },
  { id: 5, name: '线下店铺退款', value: 2200 },
];

// 预警数据
export const warningData = [
  { level: 'critical', type: 'SKU亏损', target: '二氧化碳洗发水300G(小)', store: 'B03', detail: '净利润 -¥24.77，ROI=1.45', action: '下架' },
  { level: 'critical', type: 'SKU亏损', target: 'Aiposhiy-ZSYG*3+139-ID911YS', store: '15004', detail: '净利润 -¥53.03，ROI=1.45', action: '下架' },
  { level: 'critical', type: 'SKU亏损', target: '红色牙线', store: 'B03', detail: '净利润 -¥4.16，ROI=1.89', action: '优化' },
  { level: 'warning', type: 'ROI未达标', target: '15004店铺', store: '15004', detail: 'ROI=2.42 < 4（目标值）', action: '重点关注' },
  { level: 'warning', type: '广告占比高', target: 'Aiposhiy生姜洗发水', store: '15004', detail: '广告占比35.2%，超过阈值30%', action: '优化投放' },
  { level: 'info', type: '利润率偏低', target: '二氧化碳洗发水300G', store: 'B03', detail: '利润率26.26%，低于平均值35%', action: '关注' },
];

// 集团汇总数据
export const groupSummary = {
  totalRevenue: 805447,
  totalAd: 139296,
  totalCost: 230511,
  totalProfit: 416072,
  totalRoi: 5.78,
  totalOrders: 1854,
  warehouseFee: 19524,
  packingFee: 3847,
};
