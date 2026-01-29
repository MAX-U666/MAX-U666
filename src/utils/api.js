const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');

const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

// 千问配置
const QWEN_API_KEY = 'sk-a9ddec6e8cbe4be1bbf15326a6f4ebd5';
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

const SYSTEM_PROMPT = `【你必须严格遵守的规则】

你是【Shopee GMV MAX 广告系统博弈专家】，长期操盘高客单价、高溢价商品。

## 一、不可推翻的底层事实
1. GMV MAX 是全自动广告，关键词与流量分发完全由系统控制
2. 预算花不完不是预算不足，而是系统判断"不值得继续放量"
3. 放量核心在于系统对转化稳定性的信心
4. ROI = 3 为盈亏平衡线，任何策略不得击穿该底线
5. 补单本质是人为制造"稳定成交正在发生"的信号
6. 单次、间歇、少量补单会产生涟漪效应；连续、大量、密集补单会破坏系统判断

## 二、GMV MAX 三阶段模型（必须先判阶段）
- **阶段 A：样本不足期** - 广告曝光 < 5,000，系统尚未建立有效判断
- **阶段 B：放量观察期** - 广告曝光 ≥ 5,000 且 (曝光 < 20,000 或 ROI < 3)，系统在验证稳定性
- **阶段 C：放量确认期** - 广告曝光 ≥ 20,000 且 ROI ≥ 3，系统开始主动放量

## 三、强制四步判断顺序（不可跳步）
1. **阶段判断**：先判断当前所处阶段（A/B/C）
2. **系统信心判断**：判断系统是否具备继续放量的信心条件
3. **人工信号判断**：判断是否需要补单干预
4. **信号强化判断**：最后讨论素材、承接、信息密度变化

## 四、风险熔断规则
- ROI < 3 的建议必须自动熔断，给出收缩/止损建议
- 近72小时价格波动 > 10%（印尼市场>7%），必须暂缓所有补单建议
- 曝光激增 + CVR断崖式下跌，判断为泛流量池误入，优先防守

## 五、印尼市场特殊规则（当region=ID时启用）
- 印尼COD确认延迟平均2.3天，补单涟漪半衰期τ=29.6h（非台马的18.3h）
- 印尼价格敏感阈值为7%（非10%）
- 印尼用户对JNE/J&T物流信任度高，补单必须完成COD确认+物流单号回传
- 印尼ATC率均值比台马低35-42%，需用印尼本地基准判断

## 六、输出格式（必须严格JSON）
{
  "phase": "A/B/C",
  "phase_name": "样本不足期/放量观察期/放量确认期",
  "today_decision": "维持观察/加大投放/收缩防守/暂停止损（四选一）",
  "confidence": 70-100的数字,
  "supplement_strategy": "不需要补单/注入1-2单/暂缓补单/停止补单",
  "system_judgment": "【系统放量判断】详细分析当前阶段、系统意愿、放量条件",
  "key_bottlenecks": ["核心卡点1（含具体数据）", "核心卡点2"],
  "manual_signal_judgment": "【补单策略】详细说明是否需要补单、具体执行方法、注意事项",
  "signal_enhancement": "【信号强化】应强化的方向和具体建议",
  "not_to_do": ["禁止操作1（含原因）", "禁止操作2", "禁止操作3"],
  "observation_focus": ["24-48小时观察重点1", "观察重点2"],
  "execution_checklist": ["今日必做动作1", "今日必做动作2"],
  "idn_enhancement": {
    "key_insight": "印尼专项洞察（仅印尼市场）",
    "logistics_note": "物流相关建议",
    "localization_tip": "本地化建议"
  }
}

注意：每个字段都要详细填写，不要省略。system_judgment、manual_signal_judgment、signal_enhancement 要写详细分析，不是一句话概括。`;

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
      const [users] = await pool.query('SELECT * FROM users WHERE name = ? AND password = ?', [username, password]);
      if (users.length === 0) {
        return res.json({ success: false, error: '用户名或密码错误' });
      }
      const user = users[0];
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
    const naturalClicks = Math.max(0, shopClicks - adClicks);
    const totalOrders = dayData.orders_created || 0;
    const adOrders = dayData.ad_orders || 0;
    const naturalOrders = Math.max(0, totalOrders - adOrders);
    const addToCart = dayData.add_to_cart || 0;
    const likes = dayData.likes || 0;
    
    // 计算关键指标
    const adImpressions = dayData.ad_impressions || 0;
    const ctr = adImpressions > 0 ? (adClicks / adImpressions * 100).toFixed(2) : 0;
    const cvr = adClicks > 0 ? (adOrders / adClicks * 100).toFixed(2) : 0;
    const adSpend = dayData.ad_spend || 0;
    const adRevenue = dayData.ad_revenue || 0;
    const roi = adSpend > 0 ? (adRevenue / adSpend).toFixed(2) : 0;
    const atcRate = adClicks > 0 ? (addToCart / adClicks * 100).toFixed(2) : 0;
    
    let historyText = '';
    if (historicalData && historicalData.length > 0) {
      historyText = `\n## 历史数据（供趋势判断）\n${historicalData.map(d => {
        const hRoi = d.ad_spend > 0 ? (d.ad_revenue / d.ad_spend).toFixed(2) : 0;
        return `Day ${d.day_number}: 曝光${d.ad_impressions || 0}, 点击${d.ad_clicks || 0}, 广告单${d.ad_orders || 0}, 自然单${Math.max(0, (d.orders_created || 0) - (d.ad_orders || 0))}, 花费${d.ad_spend || 0}, ROI=${hRoi}`;
      }).join('\n')}`;
    }

    return `请分析以下 Shopee GMV MAX 广告数据，严格按JSON格式输出完整判断。

## 基础信息
- SKU：${productInfo.sku}
- 产品名称：${productInfo.name}
- 目标ROI：${productInfo.target_roi || 3}
- 当前Day：${dayData.day_number}/7
- region：ID（印尼市场）
- 币种：IDR

## 店铺数据
- 总访客：${totalVisitors}
- 自然访客：${naturalVisitors}
- 店铺点击：${shopClicks}
- 收藏数：${likes}
- 加购数：${addToCart}
- 总单量：${totalOrders}
- 自然单：${naturalOrders}

## 广告数据
- 广告曝光：${adImpressions}
- 广告点击：${adClicks}
- 广告加购：${addToCart}
- 广告单：${adOrders}
- 广告花费：${adSpend} IDR
- 广告收入：${adRevenue} IDR

## 已计算指标（供参考，请自行验证）
- CTR：${ctr}%
- CVR：${cvr}%
- ROI：${roi}
- ATC率：${atcRate}%

## 印尼市场参考基准
- 印尼美妆类目ATC均值：7.8%
- 印尼美妆类目收藏率均值：11.2%
- 印尼补单涟漪半衰期：τ=29.6h
- 印尼价格敏感阈值：7%
${historyText}

请输出完整JSON，每个字段都要详细分析，特别是：
1. system_judgment 要详细分析系统放量意愿
2. manual_signal_judgment 要给出具体可执行的补单建议
3. execution_checklist 要列出今日必做的具体动作
4. idn_enhancement 要包含印尼专项洞察`;
  }
  
  async function callQwenAPI(dayData, productInfo, historicalData) {
    const userMessage = buildUserMessage(dayData, productInfo, historicalData);
    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${QWEN_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: { messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userMessage }] },
        parameters: { temperature: 0.01, top_p: 0.5, max_tokens: 4096, result_format: 'message' }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`千问API错误 ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    if (data.output && data.output.choices && data.output.choices[0]) {
      const content = data.output.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('AI返回内容不含有效JSON');
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
    const naturalOrdersRate = totalOrders > 0 ? (naturalOrders / totalOrders) * 100 : 0;
    const targetRoi = parseFloat(productInfo.target_roi) || 3;

    let phase, phaseName;
    if (adImpressions < 5000) { phase = 'A'; phaseName = '样本不足期'; }
    else if (adImpressions >= 20000 && roi >= targetRoi) { phase = 'C'; phaseName = '放量确认期'; }
    else { phase = 'B'; phaseName = '放量观察期'; }

    let todayDecision, confidence, supplementStrategy;
    const keyBottlenecks = [];
    const notToDo = ['不要在48小时内调整价格（印尼阈值7%）', '不要更换主图或标题', '不要启动AB测试'];
    const executionChecklist = [];

    if (adSpend > 0 && roi < 2) {
      todayDecision = '暂停止损'; confidence = 90; supplementStrategy = '停止补单';
      keyBottlenecks.push(`ROI严重不达标（${roi.toFixed(2)}），系统判定为低效流量`);
      executionChecklist.push('立即降低预算至最低', '检查产品定价是否有竞争力');
    } else if (adSpend > 0 && roi < targetRoi) {
      todayDecision = '收缩防守'; confidence = 80; supplementStrategy = '暂缓补单';
      keyBottlenecks.push(`ROI ${roi.toFixed(2)} 未达目标线 ${targetRoi}`);
      notToDo.push('不要加大预算');
      executionChecklist.push('维持当前预算不变', '观察ROI变化趋势');
    } else if (phase === 'A') {
      todayDecision = '维持观察'; confidence = 65;
      supplementStrategy = totalOrders > 0 ? '注入1-2单' : '不需要补单';
      keyBottlenecks.push('样本不足，系统尚未建立有效判断');
      keyBottlenecks.push(`当前曝光 ${adImpressions.toLocaleString()}，需突破 5,000 进入观察期`);
      if (supplementStrategy === '注入1-2单') {
        executionChecklist.push('选择1位高置信老客（加购≥2次）通过广告点击下单');
        executionChecklist.push('确保COD确认+JNE物流单号回传');
      }
    } else if (phase === 'B') {
      todayDecision = '维持观察'; confidence = 70;
      if (naturalOrdersRate < 20 && totalOrders > 0) {
        keyBottlenecks.push(`自然单占比过低（${naturalOrdersRate.toFixed(1)}%），系统对自然转化信心不足`);
      }
      keyBottlenecks.push('成交信号连续性待验证');
      supplementStrategy = '注入1-2单';
      notToDo.push('不要连续补单或集中时段补单');
      executionChecklist.push('在流量高峰期（10:00-12:00, 20:00-22:00）注入1单');
      executionChecklist.push('间隔4小时以上，避免密集补单');
    } else {
      todayDecision = '加大投放'; confidence = 85; supplementStrategy = '不需要补单';
      keyBottlenecks.push('数据健康，系统已确认放量意愿');
      executionChecklist.push('可适当提升预算10-20%', '持续监控ROI稳定性');
    }

    const systemJudgment = `【系统放量判断】当前处于${phaseName}（阶段${phase}）。广告曝光 ${adImpressions.toLocaleString()}，CTR ${ctr.toFixed(2)}%，CVR ${cvr.toFixed(2)}%，ROI ${roi.toFixed(2)}。系统${phase === 'A' ? '尚未建立有效判断，处于被动观察状态，需要更多成交样本来验证转化稳定性' : (phase === 'B' ? '正在验证转化稳定性与可复制性，需要持续稳定的成交信号来建立信心' : '已确认放量意愿，主动增加曝光权重，可以考虑逐步提升预算')}。`;

    const manualSignalJudgment = supplementStrategy === '注入1-2单' 
      ? `【补单策略】需要人工成交信号介入。建议在自然流量高峰期（印尼时间10:00-12:00, 20:00-22:00）注入1-2单。关键要求：①选择历史行为高置信用户（加购≥2次、有COD订单记录）；②必须通过今日广告点击进入下单；③确保COD确认+JNE/J&T物流单号回传至Shopee后台。印尼涟漪效应τ=29.6h，此单将在t+24h达到峰值影响力+0.44pp。` 
      : (supplementStrategy === '停止补单' 
        ? '【补单策略】不需要补单。当前ROI严重不达标，补单无法改善系统判断，应优先止损。建议检查产品定价、主图质量、竞品情况。' 
        : '【补单策略】暂不需要人工信号干预。当前数据健康，系统正在自主放量，人工干预反而可能打乱系统学习节奏。');

    return {
      phase,
      phase_name: phaseName,
      today_decision: todayDecision,
      confidence,
      supplement_strategy: supplementStrategy,
      system_judgment: systemJudgment,
      key_bottlenecks: keyBottlenecks,
      manual_signal_judgment: manualSignalJudgment,
      signal_enhancement: phase === 'A' ? '【信号强化】优先扩大样本量，让系统获取更多有效数据。可以检查广告素材吸引力，确保点击用户是高意向人群。' : (phase === 'B' ? '【信号强化】强化成交稳定性信号，避免引入新变量干扰系统学习。保持价格、主图、标题不变，专注于转化承接优化。' : '【信号强化】保持当前节奏，关注ROI稳定性。可以考虑逐步拓展相似人群，但要监控ROI变化。'),
      not_to_do: notToDo,
      observation_focus: [
        `关注明日曝光${phase === 'A' ? '是否突破5,000' : (phase === 'B' ? '是否持续增长' : '是否保持稳定')}`,
        adSpend > 0 && roi < targetRoi ? '监控ROI回升情况' : '观察自然单占比变化'
      ],
      execution_checklist: executionChecklist,
      idn_enhancement: {
        key_insight: `印尼市场专项：当前ATC率需对比印尼基准7.8%判断，而非台马标准。涟漪半衰期τ=29.6h，补单影响持续时间更长。`,
        logistics_note: '印尼COD确认延迟平均2.3天，补单必须确保"Shopee后台显示COD已确认"状态，且物流单号在JNE官网可查。',
        localization_tip: '雅加达仓用户对JNE信任度比J&T高18.6%，建议优先使用JNE发货并在详情页标注。'
      }
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

      // 更新数据库，保存完整分析
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
