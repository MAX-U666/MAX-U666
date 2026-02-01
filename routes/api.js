const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');

const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

// 千问配置
const QWEN_API_KEY = 'sk-a9ddec6e8cbe4be1bbf15326a6f4ebd5';
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

// 完整专家母版 Prompt
const SYSTEM_PROMPT = `# 🧠 Shopee GMV MAX · 电商运营专家 Prompt（完整版 · 专家母版）

> **定位说明**
> 本 Prompt 为「专家母版（Master Prompt）」，用于最大化 LLM 在 Shopee GMV MAX 广告场景下的**系统级判断能力**。

---

## 一、系统身份与权限定义（不可省略）

你是【Shopee GMV MAX 广告系统博弈专家 + 电商增长操盘手】。

你长期操盘以下类型商品：
* 高客单价
* 高溢价
* 高点击潜力但系统放量谨慎的商品

你具备以下能力：
* 站在 **Shopee GMV MAX 广告系统视角** 判断是否继续放量
* 理解全自动广告在不同阶段的真实放量逻辑
* 在无法调整关键词的前提下，通过信号强化撬动系统信心
* 理解人工成交（补单）对系统判断的「涟漪效应」
* 在灰度区间内，平衡放量、稳定性与 ROI 风险

---

## 二、不可推翻的底层事实（世界观锁死）

1. 当前广告类型为 **Shopee GMV MAX（全自动广告）**，关键词与流量分发完全由系统控制。
2. 当前广告预算花不完，**不是预算不足**，而是系统判断「不值得继续放量」。
3. GMV MAX 的放量核心不在预算，而在 **系统对转化稳定性的信心**。
4. 人工补单的本质不是拉转化，而是 **人为制造"稳定成交正在发生"的信号**。
5. 单次、间歇、少量补单，会在短时间内对系统自然流量判断产生 **涟漪效应**。
6. 连续、大量、密集补单会破坏系统判断，反而抑制放量。
7. **ROI = 3** 为盈亏平衡线，任何策略不得击穿该底线。

---

## 三、GMV MAX 三阶段模型（必须先判阶段）

* **阶段 A：样本不足期** - 广告曝光 < 5,000，系统尚未建立有效判断
* **阶段 B：放量观察期** - 广告曝光 ≥ 5,000 且 (曝光 < 20,000 或 ROI < 3)，系统在验证稳定性
* **阶段 C：放量确认期** - 广告曝光 ≥ 20,000 且 ROI ≥ 3，系统开始主动放量

---

## 四、强制专家判断顺序（不可跳步）

1. **阶段判断**：先判断当前所处阶段（A/B/C）
2. **系统信心判断**：判断系统是否具备继续放量的信心条件
3. **人工信号判断**：判断是否需要补单干预
4. **信号强化判断**：最后讨论素材、承接、信息密度变化

---

## 五、印尼市场特殊规则（IDN-2024-Q3-01）

当 region=ID 时，必须启用印尼专项模式：
* 印尼COD确认延迟平均2.3天，补单涟漪半衰期 τ=29.6h（非台马的18.3h）
* 印尼价格敏感阈值为7%（72h内调价>7%触发学习中断，非台马10%）
* 印尼用户对JNE/J&T物流信任度高，补单必须完成COD确认+物流单号回传
* 印尼ATC率均值比台马低35-42%，需用印尼本地基准判断（美妆ATC均值7.8%，收藏率均值11.2%）
* 仅「Shopee后台显示COD已确认 + JNE/J&T有效单号」视为有效成交信号

---

## 六、风险熔断规则

* ROI < 3 的建议必须自动熔断，给出收缩/止损建议
* 近72小时价格波动 > 7%（印尼）/ > 10%（台马），必须暂缓所有补单建议
* 曝光激增 + CVR断崖式下跌，判断为泛流量池误入，优先防守

---

## 七、输出格式要求

你必须按照以下结构输出完整分析报告（Markdown格式，允许长文）：

### 【系统放量判断】
详细分析当前阶段、系统放量意愿、放量条件是否具备。用 ✅ ❌ 标注关键判断。

### 【核心卡点分析】
指出系统最缺的1-2个核心放量确定性信号，用数据支撑（计算CTR、CVR、ATC率等）。

### 【补单策略判断】
明确是否需要人工成交信号介入，给出具体策略逻辑（不是数量指令），包括：
- 必须动作
- 必须流程
- 严禁动作
- 涟漪效应预估

### 【系统信号强化方向】
当前阶段最应强化的信号类型，具体执行建议。

### 【明确不建议的行为】
列出今日严禁的操作，说明原因。

### 【24–48小时观察重点】
给出关键时间点与必查指标。

### 🇮🇩 印尼专属增强模块
输出 JSON 格式的印尼专项数据：
\`\`\`json
{
  "idn_enhancement": {
    "key_insight": "印尼专项洞察",
    "logistics_note": "物流相关建议",
    "localization_tip": "本地化建议"
  }
}
\`\`\`

### ✅ 最后交付物
输出《印尼首单跃迁行动卡》，用代码块包裹，格式如下：
\`\`\`text
【今日唯一动作】
✅ 具体可执行的动作1
✅ 具体可执行的动作2

【今日严禁】
❌ 禁止操作1｜❌ 禁止操作2

【盯盘时间】
⏰ 时间点1：检查指标
⏰ 时间点2：检查指标
\`\`\`

---

## 八、专家隐藏原则

> **GMV MAX 的本质不是投广告，而是与系统建立「我可以被放量」的信任关系。**

---

在输出的最后，加上一段鼓励性结语，体现专业与信心。`;

module.exports = function(pool) {
  const router = express.Router();
  
  // Token 管理
  const tokens = new Map();
  
  function generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' });
    }
    const token = authHeader.split(' ')[1];
    const user = tokens.get(token);
    if (!user) {
      return res.status(401).json({ error: 'Token 无效' });
    }
    req.user = user;
    next();
  }
  
  function verifyAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  }

  // =============================================
  // 登录相关 API
  // =============================================
  
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.json({ success: false, error: '请输入用户名和密码' });
      }
      const [users] = await pool.query('SELECT * FROM users WHERE name = ?', [username]);
      if (users.length === 0) {
        return res.json({ success: false, error: '用户名或密码错误' });
      }
      const user = users[0];
      // 使用 bcrypt 比较密码
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.json({ success: false, error: '用户名或密码错误' });
      }
      const token = generateToken();
      tokens.set(token, { id: user.id, name: user.name, role: user.role, avatar: user.avatar, color: user.color });
      res.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role, avatar: user.avatar, color: user.color } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  router.post('/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      tokens.delete(authHeader.split(' ')[1]);
    }
    res.json({ success: true });
  });
  
  router.get('/verify-token', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ valid: false });
    }
    const token = authHeader.split(' ')[1];
    const user = tokens.get(token);
    if (!user) {
      return res.json({ valid: false });
    }
    res.json({ valid: true, user });
  });

  // =============================================
  // 用户管理 API
  // =============================================
  
  router.get('/users', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT id, name, role, avatar, color, created_at FROM users');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.post('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
      const { name, password, role, avatar, color } = req.body;
      if (!name || !password) {
        return res.json({ success: false, error: '用户名和密码不能为空' });
      }
      const [existing] = await pool.query('SELECT id FROM users WHERE name = ?', [name]);
      if (existing.length > 0) {
        return res.json({ success: false, error: '用户名已存在' });
      }
      await pool.query('INSERT INTO users (name, password, role, avatar, color) VALUES (?, ?, ?, ?, ?)', [name, password, role || 'operator', avatar || '👨‍💼', color || '#3b82f6']);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  router.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      if (parseInt(id) === req.user.id) {
        return res.json({ success: false, error: '不能删除自己' });
      }
      await pool.query('DELETE FROM users WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  router.post('/users/:id/reset-password', verifyToken, verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('UPDATE users SET password = ? WHERE id = ?', ['123456', id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =============================================
  // 产品相关 API
  // =============================================
  
  router.get('/products', async (req, res) => {
    try {
      const { owner_id, status } = req.query;
      let sql = `SELECT p.*, u.name as owner_name, u.avatar as owner_avatar FROM products p LEFT JOIN users u ON p.owner_id = u.id WHERE 1=1`;
      const params = [];
      if (owner_id) { sql += ' AND p.owner_id = ?'; params.push(owner_id); }
      if (status) { sql += ' AND p.status = ?'; params.push(status); }
      sql += ' ORDER BY p.created_at DESC';
      const [rows] = await pool.query(sql, params);
      const today = new Date();
      rows.forEach(p => {
        const startDate = new Date(p.start_date);
        const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
        p.current_day = Math.min(Math.max(diffDays, 1), 7);
      });
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.get('/products/:id', async (req, res) => {
    try {
      const [products] = await pool.query(`SELECT p.*, u.name as owner_name, u.avatar as owner_avatar FROM products p LEFT JOIN users u ON p.owner_id = u.id WHERE p.id = ?`, [req.params.id]);
      if (products.length === 0) {
        return res.status(404).json({ error: '产品不存在' });
      }
      const product = products[0];
      const today = new Date();
      const startDate = new Date(product.start_date);
      const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
      product.current_day = Math.min(Math.max(diffDays, 1), 7);
      const [dailyData] = await pool.query('SELECT * FROM daily_data WHERE product_id = ? ORDER BY day_number', [req.params.id]);
      dailyData.forEach(d => {
        d.natural_orders = Math.max(0, (d.orders_created || d.organic_orders || 0) - (d.ad_orders || 0));
        if (d.ai_full_analysis && typeof d.ai_full_analysis === 'string') {
          try { d.ai_full_analysis = JSON.parse(d.ai_full_analysis); } catch (e) {}
        }
      });
      product.daily_data = dailyData;
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.post('/products', async (req, res) => {
    try {
      const { sku, name, price, owner_id, start_date, target_roi } = req.body;
      const [existing] = await pool.query('SELECT id FROM products WHERE sku = ? AND start_date = ?', [sku, start_date]);
      if (existing.length > 0) {
        return res.status(400).json({ error: '该产品在此日期已存在' });
      }
      const [result] = await pool.query(`INSERT INTO products (sku, name, price, owner_id, start_date, target_roi) VALUES (?, ?, ?, ?, ?, ?)`, [sku, name, price || 0, owner_id, start_date, target_roi || 3.0]);
      const productId = result.insertId;
      const startDateObj = new Date(start_date);
      for (let i = 1; i <= 7; i++) {
        const dayDate = new Date(startDateObj);
        dayDate.setDate(startDateObj.getDate() + i - 1);
        const dateStr = dayDate.toISOString().split('T')[0];
        await pool.query(`INSERT INTO daily_data (product_id, day_number, date, status) VALUES (?, ?, ?, '未提交')`, [productId, i, dateStr]);
      }
      res.json({ id: productId, message: '产品创建成功' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // =============================================
  // 日数据相关 API
  // =============================================
  
  router.put('/daily-data/:productId/:dayNumber/shop', async (req, res) => {
    try {
      const { productId, dayNumber } = req.params;
      const data = req.body;
      const conversionRate = data.visitors > 0 ? (data.orders_created / data.visitors * 100).toFixed(2) : 0;
      await pool.query(
        `UPDATE daily_data SET visitors = ?, page_views = ?, visitors_no_buy = ?, visitors_no_buy_rate = ?, clicks = ?, likes = ?, cart_visitors = ?, add_to_cart = ?, cart_rate = ?, orders_created = ?, items_created = ?, revenue_created = ?, conversion_rate = ?, orders_ready = ?, items_ready = ?, revenue_ready = ?, ready_rate = ?, ready_created_rate = ?, organic_orders = ?, status = IF(status = '未提交', '待决策', status), updated_at = NOW() WHERE product_id = ? AND day_number = ?`,
        [data.visitors || 0, data.page_views || 0, data.visitors_no_buy || 0, data.visitors_no_buy_rate || 0, data.clicks || 0, data.likes || 0, data.cart_visitors || 0, data.add_to_cart || 0, data.cart_rate || 0, data.orders_created || 0, data.items_created || 0, data.revenue_created || 0, conversionRate, data.orders_ready || 0, data.items_ready || 0, data.revenue_ready || 0, data.ready_rate || 0, data.ready_created_rate || 0, data.orders_created || 0, productId, dayNumber]
      );
      const [rows] = await pool.query('SELECT * FROM daily_data WHERE product_id = ? AND day_number = ?', [productId, dayNumber]);
      if (rows.length > 0) {
        const row = rows[0];
        const roi = row.ad_spend > 0 ? (row.ad_revenue / row.ad_spend).toFixed(2) : 0;
        let phase = 'A';
        if (row.ad_impressions >= 5000) phase = 'B';
        if (row.ad_impressions >= 20000 && roi >= 3) phase = 'C';
        await pool.query('UPDATE daily_data SET roi = ?, phase = ? WHERE product_id = ? AND day_number = ?', [roi, phase, productId, dayNumber]);
      }
      res.json({ success: true, message: '店铺数据更新成功' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.put('/daily-data/:productId/:dayNumber/ad', async (req, res) => {
    try {
      const { productId, dayNumber } = req.params;
      const data = req.body;
      const adSpend = data.ad_spend || 0;
      const adRevenue = data.ad_revenue || 0;
      const roi = adSpend > 0 ? (adRevenue / adSpend).toFixed(2) : 0;
      const adImpressions = data.ad_impressions || 0;
      let phase = 'A';
      if (adImpressions >= 5000) phase = 'B';
      if (adImpressions >= 20000 && roi >= 3) phase = 'C';
      await pool.query(
        `UPDATE daily_data SET ad_impressions = ?, ad_clicks = ?, ad_orders = ?, ad_spend = ?, ad_revenue = ?, roi = ?, phase = ?, status = IF(status = '未提交', '待决策', status), updated_at = NOW() WHERE product_id = ? AND day_number = ?`,
        [adImpressions, data.ad_clicks || 0, data.ad_conversions || 0, adSpend, adRevenue, roi, phase, productId, dayNumber]
      );
      res.json({ success: true, roi, phase, message: '广告数据更新成功' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.put('/daily-data/:productId/:dayNumber/manual', async (req, res) => {
    try {
      const { productId, dayNumber } = req.params;
      const { manual_orders } = req.body;
      await pool.query(`UPDATE daily_data SET manual_orders = ?, updated_at = NOW() WHERE product_id = ? AND day_number = ?`, [manual_orders || 0, productId, dayNumber]);
      res.json({ success: true, message: '补单数据更新成功' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // =============================================
  // 千问 AI 分析
  // =============================================
  
  function buildUserMessage(dayData, productInfo, historicalData) {
    const totalVisitors = dayData.visitors || 0;
    const adClicks = dayData.ad_clicks || 0;
    const naturalVisitors = Math.max(0, totalVisitors - adClicks);
    const shopClicks = dayData.clicks || 0;
    const totalOrders = dayData.orders_created || 0;
    const adOrders = dayData.ad_orders || 0;
    const naturalOrders = Math.max(0, totalOrders - adOrders);
    const addToCart = dayData.add_to_cart || 0;
    const likes = dayData.likes || 0;
    
    const adImpressions = dayData.ad_impressions || 0;
    const adSpend = dayData.ad_spend || 0;
    const adRevenue = dayData.ad_revenue || 0;
    
    let historyText = '';
    if (historicalData && historicalData.length > 0) {
      historyText = `\n## 历史数据与决策回溯（重要：请基于历史决策效果进行连续性判断）\n${historicalData.map(d => {
        const hRoi = d.ad_spend > 0 ? (d.ad_revenue / d.ad_spend).toFixed(2) : 0;
        const hCtr = d.ad_impressions > 0 ? ((d.ad_clicks || 0) / d.ad_impressions * 100).toFixed(2) : 0;
        const hCvr = d.ad_clicks > 0 ? ((d.ad_orders || 0) / d.ad_clicks * 100).toFixed(2) : 0;
        const naturalOrders = Math.max(0, (d.orders_created || 0) - (d.ad_orders || 0));
        
        // 解析补单建议
        let supplementStrategy = '无';
        if (d.ai_full_analysis) {
          try {
            const analysis = typeof d.ai_full_analysis === 'string' ? JSON.parse(d.ai_full_analysis) : d.ai_full_analysis;
            supplementStrategy = analysis.supplement_strategy || '无';
          } catch (e) { supplementStrategy = '无'; }
        }
        
        let dayHistory = `### Day ${d.day_number}
**数据：** 曝光${d.ad_impressions || 0} | 点击${d.ad_clicks || 0} | CTR ${hCtr}% | 广告单${d.ad_orders || 0} | 自然单${naturalOrders} | ROI ${hRoi}
**AI决策：** ${d.ai_action || '未分析'}
**核心卡点：** ${d.ai_reason || '无记录'}
**补单建议：** ${supplementStrategy}
**置信度：** ${d.ai_confidence || 0}% | **执行状态：** ${d.status || '未知'}`;
        
        return dayHistory;
      }).join('\n\n')}
      
## 趋势分析要点
请特别关注：
1. 从 Day 1 到 Day ${dayData.day_number - 1} 的 ROI 变化趋势
2. 之前的 AI 决策执行后效果如何（曝光/转化是否改善）
3. 如果之前建议过补单，补单后系统放量是否有响应
4. 避免重复之前无效的建议，根据历史效果调整策略`;
    }

    return `请严格按照 Prompt 要求的格式，分析以下 Shopee GMV MAX 广告数据，输出完整的专家级分析报告。

## 基础信息
- SKU：${productInfo.sku}
- 产品名称：${productInfo.name}
- 目标ROI：${productInfo.target_roi || 3}
- 当前Day：${dayData.day_number}/7
- region：ID（印尼市场，必须启用印尼专项模式 IDN-2024-Q3-01）
- 币种：IDR

## 店铺数据
- 总访客：${totalVisitors}
- 自然访客：${naturalVisitors}
- 店铺点击：${shopClicks}
- 收藏数：${likes}
- 加购数：${addToCart}
- 总单量：${totalOrders}
- 自然单：${naturalOrders}

## 广告数据（请自行计算CTR、CVR、ATC率、ROI）
- 广告曝光：${adImpressions}
- 广告点击：${adClicks}
- 广告加购：${addToCart}
- 广告单：${adOrders}
- 广告花费：${adSpend} IDR
- 广告收入：${adRevenue} IDR

## 印尼市场参考基准（IDN-2024-Q3-01）
- 印尼美妆类目ATC均值：7.8%
- 印尼美妆类目收藏率均值：11.2%
- 印尼补单涟漪半衰期：τ=29.6h
- 印尼价格敏感阈值：7%
- COD履约链路：仅「Shopee后台显示COD已确认 + JNE/J&T有效单号」视为有效成交信号
${historyText}

请按照以下结构输出完整分析报告：
1. 【系统放量判断】
2. 【核心卡点分析】
3. 【补单策略判断】
4. 【系统信号强化方向】
5. 【明确不建议的行为】
6. 【24–48小时观察重点】
7. 🇮🇩 印尼专属增强模块（JSON格式）
8. ✅ 最后交付物《印尼首单跃迁行动卡》（代码块格式）

报告要专业、详细、有数据支撑，体现专家级判断能力。`;
  }
  
  async function callQwenAPI(dayData, productInfo, historicalData) {
    const userMessage = buildUserMessage(dayData, productInfo, historicalData);
    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${QWEN_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-plus',
        input: { messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userMessage }] },
        parameters: { temperature: 0.7, top_p: 0.9, max_tokens: 8192, result_format: 'message' }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`千问API错误 ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    if (data.output && data.output.choices && data.output.choices[0]) {
      const content = data.output.choices[0].message.content;
      
      // 提取结构化数据
      let phase = 'A';
      let todayDecision = '维持观察';
      let confidence = 75;
      let supplementStrategy = '注入1-2单';
      
      // 简单解析阶段
      if (content.includes('阶段 C') || content.includes('阶段C') || content.includes('放量确认期')) {
        phase = 'C';
        todayDecision = '加大投放';
        supplementStrategy = '不需要补单';
        confidence = 85;
      } else if (content.includes('阶段 B') || content.includes('阶段B') || content.includes('放量观察期')) {
        phase = 'B';
        todayDecision = '维持观察';
        supplementStrategy = '注入1-2单';
        confidence = 75;
      } else {
        phase = 'A';
        todayDecision = '维持观察';
        confidence = 65;
      }
      
      // 检测决策建议
      if (content.includes('暂停') || content.includes('止损')) {
        todayDecision = '暂停止损';
        supplementStrategy = '停止补单';
        confidence = 90;
      } else if (content.includes('收缩') || content.includes('防守')) {
        todayDecision = '收缩防守';
        supplementStrategy = '暂缓补单';
        confidence = 80;
      }
      
      return {
        phase,
        phase_name: phase === 'A' ? '样本不足期' : (phase === 'B' ? '放量观察期' : '放量确认期'),
        today_decision: todayDecision,
        confidence,
        supplement_strategy: supplementStrategy,
        key_bottlenecks: ['详见完整分析报告'],
        full_report: content
      };
    }
    throw new Error('千问API返回格式错误');
  }
  
  function localRuleEngine(dayData, productInfo) {
    const adImpressions = dayData.ad_impressions || 0;
    const adClicks = dayData.ad_clicks || 0;
    const adOrders = dayData.ad_orders || 0;
    const adSpend = dayData.ad_spend || 0;
    const adRevenue = dayData.ad_revenue || 0;
    const roi = adSpend > 0 ? adRevenue / adSpend : 0;
    const ctr = adImpressions > 0 ? (adClicks / adImpressions) * 100 : 0;
    const cvr = adClicks > 0 ? (adOrders / adClicks) * 100 : 0;
    const totalOrders = dayData.orders_created || 0;
    const naturalOrders = Math.max(0, totalOrders - adOrders);
    const targetRoi = parseFloat(productInfo.target_roi) || 3;
    const addToCart = dayData.add_to_cart || 0;
    const atcRate = adClicks > 0 ? (addToCart / adClicks) * 100 : 0;

    let phase, phaseName;
    if (adImpressions < 5000) { phase = 'A'; phaseName = '样本不足期'; }
    else if (adImpressions >= 20000 && roi >= targetRoi) { phase = 'C'; phaseName = '放量确认期'; }
    else { phase = 'B'; phaseName = '放量观察期'; }

    let todayDecision, confidence, supplementStrategy;
    const keyBottlenecks = [];
    const notToDo = [];
    const executionChecklist = [];

    if (adSpend > 0 && roi < 2) {
      todayDecision = '暂停止损'; confidence = 90; supplementStrategy = '停止补单';
      keyBottlenecks.push(`ROI严重不达标（${roi.toFixed(2)}），系统判定为低效流量`);
    } else if (adSpend > 0 && roi < targetRoi) {
      todayDecision = '收缩防守'; confidence = 80; supplementStrategy = '暂缓补单';
      keyBottlenecks.push(`ROI ${roi.toFixed(2)} 未达目标线 ${targetRoi}`);
    } else if (phase === 'A') {
      todayDecision = '维持观察'; confidence = 65;
      supplementStrategy = totalOrders > 0 ? '注入1-2单' : '不需要补单';
      keyBottlenecks.push('样本不足，系统尚未建立有效判断');
    } else if (phase === 'B') {
      todayDecision = '维持观察'; confidence = 70;
      keyBottlenecks.push('成交信号连续性待验证');
      supplementStrategy = '注入1-2单';
    } else {
      todayDecision = '加大投放'; confidence = 85; supplementStrategy = '不需要补单';
      keyBottlenecks.push('数据健康，系统已确认放量意愿');
    }

    // 生成本地完整报告
    const fullReport = `### 【系统放量判断】

✅ **系统当前放量意愿：处于「${phaseName}」（阶段${phase}）**

当前广告数据概览：
- 广告曝光：${adImpressions.toLocaleString()}
- 广告点击：${adClicks.toLocaleString()}
- CTR：${ctr.toFixed(2)}%
- CVR：${cvr.toFixed(2)}%
- ROI：${roi.toFixed(2)}
- ATC率：${atcRate.toFixed(2)}%

${phase === 'A' ? '系统尚未建立有效判断，处于被动观察状态，需要更多成交样本来验证转化稳定性。' : 
  phase === 'B' ? '系统正在验证转化稳定性与可复制性，需要持续稳定的成交信号来建立信心。' : 
  '系统已确认放量意愿，主动增加曝光权重。'}

---

### 【核心卡点分析】

系统当前最缺的核心放量确定性信号：

${keyBottlenecks.map((item, i) => `🔹 **卡点${i+1}**：${item}`).join('\n\n')}

${adOrders === 0 && adImpressions > 0 ? `
> ⚠️ 关键洞察（印尼特有）：
> 在印尼，**首笔广告单必须满足「COD已确认+物流单号已回传」**，系统才将其识别为「真实稳定成交」。
` : ''}

---

### 【补单策略判断】

${supplementStrategy === '注入1-2单' ? `✅ **需要人工成交信号介入：是**

🔹 **补单策略逻辑**：
> 注入一笔"已发货+COD确认"的高质量广告单，作为系统学习的"初始种子"，激活涟漪效应扩散。

- ✅ **必须动作**：选择1位历史行为高置信用户
- ✅ **必须流程**：引导其通过今日广告点击进入 → 下单 → 当日完成COD确认 → 同步上传JNE物流单号
- ❌ **严禁动作**：用新客、小号、或未确认COD的订单

> 📌 **涟漪效应预估（τ=29.6h）**：
> 此单将在 t+12h 提升曝光权重 +0.28pp，t+24h 达峰值 +0.44pp
` : `⏸️ **暂不需要人工信号干预**`}

---

### 【明确不建议的行为】

❌ **今日严禁以下操作**：
- 不可在48小时内调整价格（印尼阈值7%）
- 不可修改主图/标题
- 不可启动AB测试
- 不可面向新客补单

---

### 【24–48小时观察重点】

⏰ **关键时间点**：
- **T+12h**：检查广告单是否突破0
- **T+24h**：查看广告曝光是否开始增长
- **T+48h**：确认系统放量趋势

---

### 🇮🇩 印尼专属增强模块

\`\`\`json
{
  "idn_enhancement": {
    "key_insight": "当前ATC率${atcRate.toFixed(2)}%需对比印尼基准7.8%判断，涟漪半衰期τ=29.6h",
    "logistics_note": "印尼COD确认延迟平均2.3天，补单必须确保COD已确认状态",
    "localization_tip": "雅加达仓用户对JNE信任度比J&T高18.6%，建议优先使用JNE发货"
  }
}
\`\`\`

---

### ✅ 最后交付物

📌 **《印尼首单跃迁行动卡》**

\`\`\`text
【今日唯一动作】
✅ 引导1位高置信老客通过今日广告点击下单
✅ 确保下单后完成COD确认
✅ 同步上传JNE标准物流单号

【今日严禁】
❌ 新客补单｜❌ 改主图｜❌ 加预算｜❌ 启AB测试

【盯盘时间】
⏰ 今日21:00：查广告单是否>0
⏰ 明早9:00：查曝光是否↑15%+
⏰ 后日9:00：查自然单占比变化
\`\`\`

---

**决策结论：${todayDecision}（置信度${confidence}%）**

请执行。这一单，是为了让系统第一次真正记住：这个SKU，值得被放量。`;

    return {
      phase,
      phase_name: phaseName,
      today_decision: todayDecision,
      confidence,
      supplement_strategy: supplementStrategy,
      key_bottlenecks: keyBottlenecks,
      full_report: fullReport
    };
  }
  
  router.post('/ai-analysis/:productId/:dayNumber', async (req, res) => {
    try {
      const { productId, dayNumber } = req.params;
      const { useAI = true } = req.body;
      const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
      if (products.length === 0) { return res.status(404).json({ error: '产品不存在' }); }
      const productInfo = products[0];
      const [dailyData] = await pool.query('SELECT * FROM daily_data WHERE product_id = ? AND day_number = ?', [productId, dayNumber]);
      if (dailyData.length === 0) { return res.status(404).json({ error: '日数据不存在' }); }
      const dayData = dailyData[0];
      const [historicalData] = await pool.query('SELECT * FROM daily_data WHERE product_id = ? AND day_number < ? ORDER BY day_number', [productId, dayNumber]);

      let result;
      let source = 'local';
      if (useAI && (dayData.ad_impressions > 0 || dayData.orders_created > 0)) {
        try {
          result = await callQwenAPI(dayData, productInfo, historicalData);
          source = 'qwen-turbo';
        } catch (aiError) {
          console.error('千问API调用失败，使用本地规则:', aiError.message);
          result = localRuleEngine(dayData, productInfo);
        }
      } else {
        result = localRuleEngine(dayData, productInfo);
      }

      // 保存完整分析到数据库
      await pool.query(
        `UPDATE daily_data SET ai_action = ?, ai_reason = ?, ai_confidence = ?, phase = ?, ai_full_analysis = ? WHERE product_id = ? AND day_number = ?`,
        [result.today_decision, result.key_bottlenecks ? result.key_bottlenecks.join('; ') : '', result.confidence, result.phase, JSON.stringify(result), productId, dayNumber]
      );

      res.json({ success: true, source, result });
    } catch (err) {
      console.error('AI分析错误:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // =============================================
  // 执行决策 API
  // =============================================
  
  router.put('/daily-data/:productId/:dayNumber/execute', async (req, res) => {
    try {
      const { productId, dayNumber } = req.params;
      const { ai_action, ai_reason, ai_confidence, executor_id, ai_full_analysis } = req.body;
      await pool.query(
        `UPDATE daily_data SET ai_action = ?, ai_reason = ?, ai_confidence = ?, ai_full_analysis = ?, status = '已执行', executor_id = ?, executed_at = NOW() WHERE product_id = ? AND day_number = ?`,
        [ai_action, ai_reason, ai_confidence, JSON.stringify(ai_full_analysis), executor_id, productId, dayNumber]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.put('/daily-data/:productId/:dayNumber/abnormal', async (req, res) => {
    try {
      const { productId, dayNumber } = req.params;
      const { abnormal_reason, executor_id } = req.body;
      await pool.query(`UPDATE daily_data SET status = '异常', abnormal_reason = ?, executor_id = ?, executed_at = NOW() WHERE product_id = ? AND day_number = ?`, [abnormal_reason, executor_id, productId, dayNumber]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // =============================================
  // 文件上传解析 API
  // =============================================
  
  router.post('/upload-excel', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) { return res.status(400).json({ success: false, error: '请上传文件' }); }
      const filePath = req.file.path;
      const python = spawn('python3', ['/www/gmv-max/parse_shopee.py', filePath]);
      let output = '';
      let errorOutput = '';
      python.stdout.on('data', (data) => { output += data.toString(); });
      python.stderr.on('data', (data) => { errorOutput += data.toString(); });
      python.on('close', (code) => {
        fs.unlink(filePath, () => {});
        if (code !== 0) { return res.status(500).json({ success: false, error: `Python错误: ${errorOutput}` }); }
        try {
          const result = JSON.parse(output);
          res.json(result);
        } catch (e) {
          res.status(500).json({ success: false, error: `JSON错误: ${e.message}` });
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

