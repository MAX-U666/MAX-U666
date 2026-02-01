# GMV MAX 执行中心 - 整合指南

## 📦 文件清单

```
gmv-execute/
├── database/
│   └── execute_tables.sql      # 数据库表结构
├── routes/
│   └── execute.js              # 执行中心 API 路由
├── services/
│   ├── ziniao.js               # 紫鸟浏览器连接服务
│   ├── browser.js              # Selenium 浏览器控制器
│   ├── executor.js             # 执行器核心服务
│   ├── locators.js             # Shopee 页面定位器
│   └── actions/
│       ├── adjustBudget.js     # 调整广告预算
│       ├── toggleAd.js         # 开/关广告
│       ├── updateTitle.js      # 修改商品标题
│       └── updatePrice.js      # 修改商品价格
├── src/pages/ExecuteCenter/
│   ├── index.jsx               # 执行中心主页面
│   ├── ShopManagement.jsx      # 店铺管理
│   ├── OperationPanel.jsx      # 操作台
│   ├── ExecutionHistory.jsx    # 执行记录
│   └── TaskDetail.jsx          # 任务详情
├── worker.js                   # 后台执行进程
└── README.md                   # 本文件
```

---

## 🚀 整合步骤

### 1. 复制文件到现有项目

```bash
# 假设你的项目在 /www/gmv-max
cd /www/gmv-max

# 复制服务层
cp -r gmv-execute/services ./

# 复制路由
cp gmv-execute/routes/execute.js ./routes/

# 复制前端页面
cp -r gmv-execute/src/pages/ExecuteCenter ./src/pages/

# 复制 worker
cp gmv-execute/worker.js ./
```

### 2. 执行数据库迁移

```bash
mysql -u root -p gmvmax < gmv-execute/database/execute_tables.sql
```

### 3. 修改 server.js

在 `server.js` 中添加执行中心路由：

```javascript
// 现有代码...
const apiRoutes = require('./routes/api')(pool);
app.use('/api', apiRoutes);

// ========== 新增：执行中心路由 ==========
// 需要共享 token 存储（从 api.js 中导出）
const tokens = new Map(); // 或者从 api.js 共享
const executeRoutes = require('./routes/execute')(pool, tokens);
app.use('/api/execute', executeRoutes);

// 静态文件：截图证据
app.use('/evidence', express.static('./evidence'));
```

### 4. 安装新依赖

```bash
npm install selenium-webdriver axios
```

### 5. 配置紫鸟环境变量

创建或编辑 `.env` 文件：

```bash
# 紫鸟配置
ZINIAO_PATH=/opt/ziniao/ziniao
ZINIAO_COMPANY=你的公司名
ZINIAO_USERNAME=你的用户名
ZINIAO_PASSWORD=你的密码
ZINIAO_PORT=19888

# 数据库配置（如果需要）
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gmvmax
```

### 6. 修改前端路由

在 `src/App.js` 中添加执行中心入口：

```jsx
import ExecuteCenter from './pages/ExecuteCenter';

// 在 App 组件中添加
const [currentModule, setCurrentModule] = useState('decision'); // decision | execute

// 在 Header 中添加模块切换
<div style={{ display: 'flex', gap: '8px' }}>
  <button onClick={() => setCurrentModule('decision')} 
    style={{ ... }}>
    📊 决策工作台
  </button>
  {currentUser?.role === 'admin' && (
    <button onClick={() => setCurrentModule('execute')}
      style={{ ... }}>
      🤖 执行中心
    </button>
  )}
</div>

// 在内容区根据模块显示不同页面
{currentModule === 'decision' ? (
  // 现有的决策系统
) : (
  <ExecuteCenter currentUser={currentUser} />
)}
```

### 7. 启动 Worker 进程

```bash
# 开发环境
node worker.js

# 生产环境（使用 PM2）
pm2 start worker.js --name "gmv-worker"
```

---

## 🔧 紫鸟 Linux 版部署

### 安装紫鸟

```bash
# 下载紫鸟 Linux 版
# 请从紫鸟官网下载最新版本

# 解压到 /opt
sudo mkdir -p /opt/ziniao
sudo tar -xzf ziniao-linux.tar.gz -C /opt/ziniao

# 设置权限
sudo chmod +x /opt/ziniao/ziniao
```

### 安装 ChromeDriver

```bash
# 查看紫鸟内核版本（启动紫鸟后从 API 返回）
# 假设是 131

# 下载对应版本的 ChromeDriver
wget https://chromedriver.storage.googleapis.com/131.0.6778.87/chromedriver_linux64.zip

# 解压并移动
unzip chromedriver_linux64.zip
sudo mv chromedriver /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver
```

### 安装依赖

```bash
# Chrome 运行依赖
sudo apt-get update
sudo apt-get install -y \
    libnss3 \
    libgconf-2-4 \
    libfontconfig1 \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2
```

---

## 📡 API 接口说明

### 核心接口（桥）

```
POST /api/execute/command
```

这是连接 AI 决策和执行的桥梁接口。

**请求参数：**
```json
{
  "shop_id": 1,
  "action": "adjust_budget",
  "payload": {
    "campaign_name": "GMV MAX 芦荟胶",
    "new_budget": 500000,
    "budget_type": "daily"
  },
  "source": "manual",      // manual | ai | api
  "source_ref": "day_123"  // 可选，关联来源
}
```

**响应：**
```json
{
  "success": true,
  "task_id": 1,
  "task_no": "TASK-20260201-123",
  "status": "queued"
}
```

### 其他接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/execute/shops` | GET | 获取店铺列表 |
| `/api/execute/shops` | POST | 添加店铺 |
| `/api/execute/shops/:id/test` | POST | 测试店铺连接 |
| `/api/execute/shops/sync-from-ziniao` | POST | 从紫鸟同步店铺 |
| `/api/execute/tasks` | GET | 获取任务列表 |
| `/api/execute/tasks/:id` | GET | 获取任务详情 |
| `/api/execute/tasks/:id/cancel` | POST | 取消任务 |
| `/api/execute/tasks/:id/retry` | POST | 重试任务 |
| `/api/execute/stats` | GET | 获取统计 |
| `/api/execute/worker/status` | GET | Worker 状态 |

---

## 🔗 与 AI 决策对接（第二阶段）

当执行中心调试完成后，可以在 AI 决策模块中调用执行接口：

```javascript
// 在 AIDecisionPanel.jsx 的 handleConfirmExecute 中

const handleConfirmExecute = async () => {
  // 1. 现有逻辑：记录决策
  await onExecute(action, reason, confidence, fullAnalysis);
  
  // 2. 新增：如果 AI 输出了可执行指令，创建执行任务
  if (analysisResult.executable_commands) {
    for (const cmd of analysisResult.executable_commands) {
      await fetch('/api/execute/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          shop_id: selectedProduct.shop_id, // 需要产品关联店铺
          action: cmd.action,
          payload: cmd.payload,
          source: 'ai',
          source_ref: `decision_${currentDayData.id}`
        })
      });
    }
  }
};
```

同时需要修改 AI Prompt，让它输出结构化的可执行指令：

```javascript
// 在 AI 分析结果中增加
{
  // ... 现有字段
  "executable_commands": [
    {
      "action": "adjust_budget",
      "payload": {
        "campaign_name": "芦荟胶GMV广告",
        "new_budget": 300000,
        "budget_type": "daily"
      },
      "reason": "ROI达标，建议增加预算"
    }
  ]
}
```

---

## ⚠️ 注意事项

1. **紫鸟 GUI 模式**：Worker 运行时，不能同时打开紫鸟 GUI 客户端
2. **ChromeDriver 版本**：必须与紫鸟内核版本匹配
3. **页面选择器**：`locators.js` 中的选择器需要根据实际 Shopee 页面调整
4. **执行频率**：建议控制在 5-10 次/小时，避免触发风控
5. **截图目录**：确保 `./evidence` 目录存在且有写权限

---

## 📝 开发调试

```bash
# 启动主服务
npm start

# 启动 Worker（新终端）
node worker.js

# 查看日志
tail -f ~/.pm2/logs/gmv-worker-out.log
```

---

版本：v1.0.0
日期：2026年2月
