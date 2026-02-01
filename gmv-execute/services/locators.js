/**
 * Shopee Seller Center 页面定位器配置
 * 
 * 这是执行能力的核心配置文件
 * Shopee 改版时，只需要更新这里的选择器
 * 
 * 定位器格式：
 * - css: xxx     → By.css()
 * - xpath: xxx   → By.xpath()
 * - id: xxx      → By.id()
 * - name: xxx    → By.name()
 */

// ==================== 印尼站 (ID) ====================
const SHOPEE_ID = {
  baseUrl: 'https://seller.shopee.co.id',
  
  // 登录检测
  login: {
    checkUrl: 'https://seller.shopee.co.id/portal/sale',
    loggedInIndicator: 'css:.navbar-username, css:.shopee-avatar',
    loginForm: 'css:input[name="loginKey"]',
  },

  // ==================== 广告中心 ====================
  ads: {
    // GMV MAX 广告列表
    listUrl: 'https://seller.shopee.co.id/portal/marketing/pas/assembly',
    
    // 广告行
    adRow: 'css:tr[data-testid="ad-row"], css:.ads-table tbody tr',
    adName: 'css:.ad-name, css:td:nth-child(1)',
    adStatus: 'css:.ad-status, css:td:nth-child(2)',
    adBudget: 'css:.ad-budget, css:td:nth-child(5)',
    
    // 操作按钮
    editBtn: 'css:button:has-text("Ubah"), css:button:has-text("Edit")',
    toggleBtn: 'css:.toggle-switch, css:button[data-testid="toggle-ad"]',
    
    // 预算编辑弹窗
    budgetModal: {
      container: 'css:.budget-modal, css:[data-testid="budget-dialog"]',
      input: 'css:input[name="budget"], css:input[type="number"]',
      dailyBudgetOption: 'css:label:has-text("Harian"), css:label:has-text("Daily")',
      totalBudgetOption: 'css:label:has-text("Total")',
      saveBtn: 'css:button:has-text("Simpan"), css:button:has-text("Save")',
      cancelBtn: 'css:button:has-text("Batal"), css:button:has-text("Cancel")',
    },
    
    // 开关广告
    toggleConfirm: {
      modal: 'css:.confirm-modal, css:[role="dialog"]',
      confirmBtn: 'css:button:has-text("Ya"), css:button:has-text("Konfirmasi")',
      cancelBtn: 'css:button:has-text("Tidak"), css:button:has-text("Batal")',
    },
    
    // 成功/失败提示
    successToast: 'css:.toast-success, css:[role="alert"]:has-text("Berhasil")',
    errorToast: 'css:.toast-error, css:[role="alert"]:has-text("Gagal")',
  },

  // ==================== 商品管理 ====================
  products: {
    // 商品列表
    listUrl: 'https://seller.shopee.co.id/portal/product/list/all',
    
    // 搜索
    searchInput: 'css:input[placeholder*="Cari"], css:input[placeholder*="Search"]',
    searchBtn: 'css:button[type="submit"], css:.search-btn',
    
    // 商品行
    productRow: 'css:tr[data-product-id], css:.product-item',
    productName: 'css:.product-name, css:.product-title',
    productPrice: 'css:.product-price',
    productStock: 'css:.product-stock',
    
    // 操作按钮
    editBtn: 'css:button:has-text("Ubah"), css:button:has-text("Edit")',
    moreActionsBtn: 'css:.more-actions, css:.dropdown-toggle',
  },

  // ==================== 商品编辑 ====================
  productEdit: {
    // 基本信息
    titleInput: 'css:input[name="name"], css:textarea[name="name"]',
    descriptionInput: 'css:textarea[name="description"]',
    
    // 价格
    priceInput: 'css:input[name="price"], css:input[placeholder*="Harga"]',
    
    // 库存
    stockInput: 'css:input[name="stock"], css:input[placeholder*="Stok"]',
    
    // 保存
    saveBtn: 'css:button:has-text("Simpan"), css:button:has-text("Save")',
    savePublishBtn: 'css:button:has-text("Simpan & Tampilkan")',
    cancelBtn: 'css:button:has-text("Batal"), css:button:has-text("Cancel")',
    
    // 提示
    successToast: 'css:.toast-success, css:[role="alert"]:has-text("Berhasil")',
    errorToast: 'css:.toast-error, css:[role="alert"]:has-text("Gagal")',
  },

  // ==================== 通用 ====================
  common: {
    // 加载状态
    loadingSpinner: 'css:.loading, css:.spinner, css:[data-testid="loading"]',
    loadingOverlay: 'css:.loading-overlay',
    
    // 模态框
    modalBackdrop: 'css:.modal-backdrop, css:.overlay',
    modalCloseBtn: 'css:.modal-close, css:button[aria-label="Close"]',
    
    // 分页
    pagination: 'css:.pagination',
    nextPageBtn: 'css:button:has-text("Selanjutnya"), css:.next-page',
    
    // 提示
    toast: 'css:.toast, css:[role="alert"]',
  },
};

// ==================== 马来西亚站 (MY) ====================
const SHOPEE_MY = {
  baseUrl: 'https://seller.shopee.com.my',
  // ... 类似结构，根据需要扩展
};

// ==================== 泰国站 (TH) ====================
const SHOPEE_TH = {
  baseUrl: 'https://seller.shopee.co.th',
  // ... 类似结构
};

// ==================== 越南站 (VN) ====================
const SHOPEE_VN = {
  baseUrl: 'https://banhang.shopee.vn',
  // ... 类似结构
};

// ==================== 菲律宾站 (PH) ====================
const SHOPEE_PH = {
  baseUrl: 'https://seller.shopee.ph',
  // ... 类似结构
};

// ==================== 新加坡站 (SG) ====================
const SHOPEE_SG = {
  baseUrl: 'https://seller.shopee.sg',
  // ... 类似结构
};

// 站点映射
const SITES = {
  id: SHOPEE_ID,
  my: SHOPEE_MY,
  th: SHOPEE_TH,
  vn: SHOPEE_VN,
  ph: SHOPEE_PH,
  sg: SHOPEE_SG,
};

/**
 * 获取指定站点的定位器配置
 */
function getLocators(site = 'id') {
  return SITES[site] || SHOPEE_ID;
}

/**
 * 获取操作的详细定位器
 */
function getActionLocators(site, actionType) {
  const locators = getLocators(site);
  
  switch (actionType) {
    case 'adjust_budget':
    case 'toggle_ad':
      return locators.ads;
    case 'update_title':
    case 'update_price':
      return { 
        list: locators.products, 
        edit: locators.productEdit 
      };
    default:
      return locators;
  }
}

module.exports = {
  getLocators,
  getActionLocators,
  SHOPEE_ID,
  SITES,
};
