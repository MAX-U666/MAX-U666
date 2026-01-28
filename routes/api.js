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
- 近72小时价格波动 > 10%，必须暂缓所有补单建议
- 曝光激增 + CVR断崖式下跌，判断为泛流量池误入，优先防守

## 五、输出格式（必须严格JSON，7个固定key）
{
  "system_judgment": "系统放量判断（含阶段、意愿、理由）",
  "key_bottlenecks": ["核心卡点1", "核心卡点2"],
  "manual_signal_judgment": "是否需要补单及策略",
  "signal_enhancement": "应强化的信号方向",
  "not_to_do": ["禁止操作1", "禁止操作2", "禁止操作3"],
  "observation_focus": ["24-48小时观察重点1", "观察重点2"],
  "today_decision": "维持观察/加大投放/收缩防守/暂停止损（四选一）",
  "confidence": 70-100的数字,
  "phase": "A/B/C",
  "phase_name": "样本不足期/放量观察期/放量确认期",
  "supplement_strategy": "不需要补单/注入1-2单/暂缓补单/停止补单"
}`;

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
    let historyText = '';
    if (historicalData && historicalData.length > 0) {
      historyText = `\n## 历史数据（供趋势判断）\n${historicalData.map(d => {
        const hNaturalOrders = Math.max(0, (d.orders_created || 0) - (d.ad_orders || 0));
        return `Day ${d.day_number}: 广告曝光${d.ad_impressions || 0}, 广告点击${d.ad_clicks || 0}, 广告单${d.ad_orders || 0}, 自然单${hNaturalOrders}, 花费${d.ad_spend || 0}, 收入${d.ad_revenue || 0}`;
      }).join('\n')}`;
    }
    return `请分析以下 GMV MAX 广告数据，按规定的JSON格式输出判断。

⚠️ 重要：CTR、CVR、ROI、转化率等比率指标请你自己计算，确保精度。

## 产品信息
- SKU：${productInfo.sku}
- 产品名称：${productInfo.name}
- 目标ROI：${productInfo.target_roi || 3}
- 当前Day：${dayData.day_number}/7

## 店铺原始数据
- 总访客：${totalVisitors}
- 自然访客：${naturalVisitors}（总访客 - 广告点击）
- 店铺点击：${shopClicks}
- 自然点击：${naturalClicks}（店铺点击 - 广告点击）
- 收藏数：${dayData.likes || 0}
- 加购数：${dayData.add_to_cart || 0}（总加购，含广告+自然）
- 总单量：${totalOrders}
- 自然单：${naturalOrders}（总单量 - 广告单）

## 广告原始数据（请自行计算CTR、CVR、ROI）
- 广告曝光：${dayData.ad_impressions || 0}
- 广告点击：${adClicks}
- 广告单：${adOrders}
- 广告花费：${dayData.ad_spend || 0}（单位：Rp）
- 广告收入：${dayData.ad_revenue || 0}（单位：Rp）
${historyText}

请严格按照JSON格式输出，包含所有固定key。`;
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
    const notToDo = ['不要在48小时内调整价格', '不要更换主图或标题'];

    if (adSpend > 0 && roi < 2) {
      todayDecision = '暂停止损'; confidence = 90; supplementStrategy = '停止补单';
      keyBottlenecks.push(`ROI严重不达标（${roi.toFixed(2)}），系统判定为低效流量`);
    } else if (adSpend > 0 && roi < targetRoi) {
      todayDecision = '收缩防守'; confidence = 80; supplementStrategy = '暂缓补单';
      keyBottlenecks.push(`ROI ${roi.toFixed(2)} 未达目标线 ${targetRoi}`);
      notToDo.push('不要加大预算');
    } else if (phase === 'A') {
      todayDecision = '维持观察'; confidence = 65;
      supplementStrategy = totalOrders > 0 ? '注入1-2单' : '不需要补单';
      keyBottlenecks.push('样本不足，系统尚未建立有效判断');
      keyBottlenecks.push(`当前曝光 ${adImpressions.toLocaleString()}，需突破 5,000 进入观察期`);
    } else if (phase === 'B') {
      todayDecision = '维持观察'; confidence = 70;
      if (naturalOrdersRate < 20 && totalOrders > 0) {
        keyBottlenecks.push(`自然单占比过低（${naturalOrdersRate.toFixed(1)}%），系统对自然转化信心不足`);
      }
      keyBottlenecks.push('成交信号连续性待验证');
      supplementStrategy = '注入1-2单';
      notToDo.push('不要连续补单或集中时段补单');
    } else {
      todayDecision = '加大投放'; confidence = 85; supplementStrategy = '不需要补单';
      keyBottlenecks.push('数据健康，系统已确认放量意愿');
    }

    const systemJudgment = `当前处于${phaseName}（阶段${phase}）。广告曝光 ${adImpressions.toLocaleString()}，CTR ${ctr.toFixed(2)}%，CVR ${cvr.toFixed(2)}%，ROI ${roi.toFixed(2)}。系统${phase === 'A' ? '尚未建立有效判断，处于被动观察状态' : (phase === 'B' ? '正在验证转化稳定性与可复制性' : '已确认放量意愿，主动增加曝光权重')}。`;

    return {
      system_judgment: systemJudgment,
      key_bottlenecks: keyBottlenecks,
      manual_signal_judgment: supplementStrategy === '注入1-2单' ? '需要人工成交信号介入：建议在自然流量高峰期（10:00-12:00, 20:00-22:00）注入1-2单，间隔4小时以上，制造"稳定成交正在发生"的信号。' : (supplementStrategy === '停止补单' ? '不需要补单：当前ROI不达标，补单无法改善系统判断，应优先止损。' : '暂不需要人工信号干预。'),
      signal_enhancement: phase === 'A' ? '优先扩大样本量，让系统获取更多有效数据' : (phase === 'B' ? '强化成交稳定性信号，避免引入新变量干扰系统学习' : '保持当前节奏，关注ROI稳定性'),
      not_to_do: notToDo,
      observation_focus: [`关注明日曝光${phase === 'A' ? '是否突破5,000' : (phase === 'B' ? '是否持续增长' : '是否保持稳定')}`, adSpend > 0 && roi < targetRoi ? '监控ROI回升情况' : '观察自然单占比变化'],
      today_decision: todayDecision,
      confidence: confidence,
      phase: phase,
      phase_name: phaseName,
      supplement_strategy: supplementStrategy
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

      await pool.query(`UPDATE daily_data SET ai_action = ?, ai_reason = ?, ai_confidence = ?, phase = ? WHERE product_id = ? AND day_number = ?`,
        [result.today_decision, result.key_bottlenecks ? result.key_bottlenecks.join('; ') : '', result.confidence, result.phase, productId, dayNumber]);

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
