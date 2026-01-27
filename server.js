const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gmvmax',
  socketPath: '/var/run/mysqld/mysqld.sock'
});

// =============================================
// 千问 AI 配置
// =============================================
const QWEN_API_KEY = 'sk-a9ddec6e8cbe4be1bbf15326a6f4ebd5';
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

const SYSTEM_PROMPT = `你是【Shopee GMV MAX 广告系统博弈专家 + 电商增长操盘手】。

## 核心判断逻辑

### GMV MAX 三阶段模型
- **阶段 A：样本不足期** - 广告曝光 < 5,000
- **阶段 B：放量观察期** - 广告曝光 ≥ 5,000 且 (曝光 < 20,000 或 ROI < 3)
- **阶段 C：放量确认期** - 广告曝光 ≥ 20,000 且 ROI ≥ 3

### 不可推翻的底层事实
1. ROI = 3 为盈亏平衡线，任何策略不得击穿该底线
2. GMV MAX 的放量核心在于系统对转化稳定性的信心
3. 单次、间歇、少量补单会产生「涟漪效应」
4. 连续、大量、密集补单会破坏系统判断

## 输出格式要求

你必须严格按照以下 JSON 格式输出，不要输出任何其他内容：

{
  "phase": "A/B/C",
  "phase_name": "样本不足期/放量观察期/放量确认期",
  "decision": "维持观察/加大投放/收缩防守/暂停止损",
  "confidence": 70-100的数字,
  "supplement_strategy": "不需要补单/注入1-2单/暂缓补单/停止补单",
  "forbidden_actions": ["不要调价", "不要换素材"],
  "core_issue": "核心卡点的一句话描述",
  "analysis": {
    "system_judgment": "系统放量判断的详细分析",
    "bottleneck_analysis": "核心卡点的详细分析",
    "supplement_analysis": "补单策略的详细分析",
    "signal_direction": "系统信号强化方向",
    "observation_focus": "24-48小时观察重点"
  }
}`;

// =============================================
// 用户相关 API
// =============================================

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 产品相关 API
// =============================================

app.get('/api/products', async (req, res) => {
  try {
    const { owner_id, status } = req.query;
    let sql = `SELECT p.*, u.name as owner_name, u.avatar as owner_avatar 
               FROM products p 
               LEFT JOIN users u ON p.owner_id = u.id 
               WHERE 1=1`;
    const params = [];
    
    if (owner_id) {
      sql += ' AND p.owner_id = ?';
      params.push(owner_id);
    }
    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
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

app.get('/api/products/:id', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.*, u.name as owner_name, u.avatar as owner_avatar 
       FROM products p 
       LEFT JOIN users u ON p.owner_id = u.id 
       WHERE p.id = ?`, 
      [req.params.id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }
    
    const product = products[0];
    
    const today = new Date();
    const startDate = new Date(product.start_date);
    const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    product.current_day = Math.min(Math.max(diffDays, 1), 7);
    
    const [dailyData] = await pool.query(
      'SELECT * FROM daily_data WHERE product_id = ? ORDER BY day_number',
      [req.params.id]
    );
    
    dailyData.forEach(d => {
      d.natural_orders = Math.max(0, (d.orders_created || d.organic_orders || 0) - (d.ad_orders || 0));
    });
    
    product.daily_data = dailyData;
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { sku, name, price, owner_id, start_date, target_roi } = req.body;
    
    const [existing] = await pool.query(
      'SELECT id FROM products WHERE sku = ? AND start_date = ?',
      [sku, start_date]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: '该产品在此日期已存在' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO products (sku, name, price, owner_id, start_date, target_roi) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sku, name, price || 0, owner_id, start_date, target_roi || 3.0]
    );
    
    const productId = result.insertId;
    
    const startDateObj = new Date(start_date);
    for (let i = 1; i <= 7; i++) {
      const dayDate = new Date(startDateObj);
      dayDate.setDate(startDateObj.getDate() + i - 1);
      const dateStr = dayDate.toISOString().split('T')[0];
      
      await pool.query(
        `INSERT INTO daily_data (product_id, day_number, date, status) VALUES (?, ?, ?, '未提交')`,
        [productId, i, dateStr]
      );
    }
    
    res.json({ id: productId, message: '产品创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 日数据相关 API
// =============================================

app.put('/api/daily-data/:productId/:dayNumber/shop', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const data = req.body;
    
    const conversionRate = data.visitors > 0 
      ? (data.orders_created / data.visitors * 100).toFixed(2) 
      : 0;
    
    await pool.query(
      `UPDATE daily_data SET 
        visitors = ?,
        page_views = ?,
        visitors_no_buy = ?,
        visitors_no_buy_rate = ?,
        clicks = ?,
        likes = ?,
        cart_visitors = ?,
        add_to_cart = ?,
        cart_rate = ?,
        orders_created = ?,
        items_created = ?,
        revenue_created = ?,
        conversion_rate = ?,
        orders_ready = ?,
        items_ready = ?,
        revenue_ready = ?,
        ready_rate = ?,
        ready_created_rate = ?,
        organic_orders = ?,
        status = IF(status = '未提交', '待决策', status),
        updated_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [
        data.visitors || 0,
        data.page_views || 0,
        data.visitors_no_buy || 0,
        data.visitors_no_buy_rate || 0,
        data.clicks || 0,
        data.likes || 0,
        data.cart_visitors || 0,
        data.add_to_cart || 0,
        data.cart_rate || 0,
        data.orders_created || 0,
        data.items_created || 0,
        data.revenue_created || 0,
        conversionRate,
        data.orders_ready || 0,
        data.items_ready || 0,
        data.revenue_ready || 0,
        data.ready_rate || 0,
        data.ready_created_rate || 0,
        data.orders_created || 0,
        productId, 
        dayNumber
      ]
    );
    
    const [rows] = await pool.query(
      'SELECT * FROM daily_data WHERE product_id = ? AND day_number = ?',
      [productId, dayNumber]
    );
    
    if (rows.length > 0) {
      const row = rows[0];
      const roi = row.ad_spend > 0 ? (row.ad_revenue / row.ad_spend).toFixed(2) : 0;
      let phase = 'A';
      if (row.ad_impressions >= 5000) phase = 'B';
      if (row.ad_impressions >= 20000 && roi >= 3) phase = 'C';
      
      await pool.query(
        'UPDATE daily_data SET roi = ?, phase = ? WHERE product_id = ? AND day_number = ?',
        [roi, phase, productId, dayNumber]
      );
    }
    
    res.json({ success: true, message: '店铺数据更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/daily-data/:productId/:dayNumber/ad', async (req, res) => {
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
      `UPDATE daily_data SET 
        ad_impressions = ?, 
        ad_clicks = ?, 
        ad_orders = ?,
        ad_spend = ?, 
        ad_revenue = ?, 
        roi = ?, 
        phase = ?,
        status = IF(status = '未提交', '待决策', status),
        updated_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [
        adImpressions,
        data.ad_clicks || 0, 
        data.ad_conversions || 0,
        adSpend, 
        adRevenue, 
        roi, 
        phase,
        productId, 
        dayNumber
      ]
    );
    
    res.json({ success: true, roi, phase, message: '广告数据更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/daily-data/:productId/:dayNumber/manual', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const { manual_orders } = req.body;
    
    await pool.query(
      `UPDATE daily_data SET manual_orders = ?, updated_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [manual_orders || 0, productId, dayNumber]
    );
    
    res.json({ success: true, message: '补单数据更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/daily-data/:productId/:dayNumber', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const data = req.body;
    
    const roi = data.ad_spend > 0 ? (data.ad_revenue / data.ad_spend).toFixed(2) : 0;
    
    let phase = 'A';
    if (data.ad_impressions >= 5000) phase = 'B';
    if (data.ad_impressions >= 20000 && roi >= 3) phase = 'C';
    
    await pool.query(
      `UPDATE daily_data SET 
        visitors = ?, page_views = ?, clicks = ?, add_to_cart = ?,
        organic_orders = ?, orders_created = ?, manual_orders = ?,
        ad_impressions = ?, ad_clicks = ?, ad_orders = ?,
        ad_spend = ?, ad_revenue = ?, roi = ?, phase = ?,
        status = '待决策', updated_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [
        data.visitors || 0, data.page_views || 0, data.clicks || 0, data.add_to_cart || 0,
        data.organic_orders || 0, data.orders_created || data.organic_orders || 0, data.manual_orders || 0,
        data.ad_impressions || 0, data.ad_clicks || 0, data.ad_orders || 0,
        data.ad_spend || 0, data.ad_revenue || 0, roi, phase,
        productId, dayNumber
      ]
    );
    
    res.json({ success: true, roi, phase });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// AI 决策相关 API
// =============================================

// 本地规则引擎
function localRuleEngine(dayData, productInfo) {
  const adImpressions = dayData.ad_impressions || 0;
  const roi = parseFloat(dayData.roi) || 0;
  const ordersCreated = dayData.orders_created || 0;
  const adOrders = dayData.ad_orders || 0;
  const naturalOrders = Math.max(0, ordersCreated - adOrders);
  const targetRoi = parseFloat(productInfo.target_roi) || 3;

  let phase, phaseName;
  if (adImpressions < 5000) {
    phase = 'A';
    phaseName = '样本不足期';
  } else if (adImpressions >= 20000 && roi >= targetRoi) {
    phase = 'C';
    phaseName = '放量确认期';
  } else {
    phase = 'B';
    phaseName = '放量观察期';
  }

  let decision, confidence, coreIssue, supplementStrategy;
  
  if (roi > 0 && roi < 2) {
    decision = '收缩防守';
    confidence = 85;
    coreIssue = 'ROI 严重不达标，需收缩止损';
    supplementStrategy = '停止补单';
  } else if (roi > 0 && roi < targetRoi && phase === 'C') {
    decision = '收缩防守';
    confidence = 75;
    coreIssue = 'ROI 跌破目标线，放量过载';
    supplementStrategy = '暂缓补单';
  } else if (phase === 'A') {
    decision = '维持观察';
    confidence = 65;
    coreIssue = '样本不足，系统尚未建立有效判断';
    supplementStrategy = ordersCreated > 0 ? '注入1-2单' : '不需要补单';
  } else if (phase === 'B') {
    decision = '维持观察';
    confidence = 70;
    coreIssue = naturalOrders < ordersCreated * 0.2 ? '自然单占比偏低' : '成交信号连续性待验证';
    supplementStrategy = '注入1-2单';
  } else {
    decision = '加大投放';
    confidence = 80;
    coreIssue = '数据健康，可继续放量';
    supplementStrategy = '不需要补单';
  }

  const forbiddenActions = ['不要在48小时内调价'];
  if (phase !== 'C') {
    forbiddenActions.push('不要更换主图或标题');
  }
  if (roi > 0 && roi < targetRoi) {
    forbiddenActions.push('不要加大预算');
  }

  return {
    phase,
    phase_name: phaseName,
    decision,
    confidence,
    supplement_strategy: supplementStrategy,
    forbidden_actions: forbiddenActions,
    core_issue: coreIssue,
    analysis: {
      system_judgment: `当前处于${phaseName}，广告曝光 ${adImpressions.toLocaleString()}，ROI ${roi}。系统${phase === 'A' ? '尚未建立有效判断' : (phase === 'B' ? '正在验证转化稳定性' : '已确认放量意愿')}。`,
      bottleneck_analysis: coreIssue + (naturalOrders < ordersCreated * 0.2 && ordersCreated > 0 ? `\n自然单仅 ${naturalOrders} 单，占比 ${((naturalOrders/ordersCreated)*100).toFixed(1)}%，系统对自然转化信心不足。` : ''),
      supplement_analysis: supplementStrategy === '注入1-2单' 
        ? '建议在自然流量高峰期（10:00-12:00, 20:00-22:00）注入1-2单，间隔4小时以上，制造"稳定成交正在发生"的信号。' 
        : (supplementStrategy === '停止补单' ? '当前 ROI 不达标，补单无法改善系统判断，应优先止损。' : '当前阶段暂不需要人工干预。'),
      signal_direction: phase === 'A' ? '优先扩大样本量，让系统获取更多数据' : (phase === 'B' ? '强化成交稳定性信号，避免引入新变量' : '保持当前节奏，关注ROI稳定性'),
      observation_focus: `关注明日曝光${phase === 'A' ? '是否突破5000' : (phase === 'B' ? '是否持续增长' : '是否保持稳定')}${roi < targetRoi && roi > 0 ? '，以及 ROI 回升情况' : ''}`
    }
  };
}

// 调用千问 API
async function callQwenAPI(dayData, productInfo, historicalData) {
  const naturalOrders = Math.max(0, (dayData.orders_created || 0) - (dayData.ad_orders || 0));
  
  const userMessage = `请分析以下 GMV MAX 广告数据，并给出决策建议：

## 产品信息
- 产品名称：${productInfo.name}
- SKU：${productInfo.sku}
- 目标 ROI：${productInfo.target_roi || 3}
- 当前 Day：${dayData.day_number}/7

## 今日数据

### 店铺数据
- 访客：${dayData.visitors || 0}
- 页面浏览：${dayData.page_views || 0}
- 点击：${dayData.clicks || 0}
- 收藏：${dayData.likes || 0}
- 加购人数：${dayData.cart_visitors || 0}
- 加购数：${dayData.add_to_cart || 0}
- 加购率：${dayData.cart_rate || 0}%
- 下单人数：${dayData.orders_created || 0}
- 下单件数：${dayData.items_created || 0}
- 下单金额：Rp ${(dayData.revenue_created || 0).toLocaleString()}
- 转化率：${dayData.conversion_rate || 0}%

### 广告数据
- 广告曝光：${(dayData.ad_impressions || 0).toLocaleString()}
- 广告点击：${dayData.ad_clicks || 0}
- CTR：${dayData.ad_impressions > 0 ? ((dayData.ad_clicks / dayData.ad_impressions) * 100).toFixed(2) : 0}%
- 广告订单：${dayData.ad_orders || 0}
- 广告花费：Rp ${(dayData.ad_spend || 0).toLocaleString()}
- 广告收入：Rp ${(dayData.ad_revenue || 0).toLocaleString()}
- ROI：${dayData.roi || 0}

### 计算指标
- 自然单：${naturalOrders}
- 自然单占比：${dayData.orders_created > 0 ? ((naturalOrders / dayData.orders_created) * 100).toFixed(1) : 0}%

${historicalData && historicalData.length > 0 ? `
## 历史数据趋势
${historicalData.map(d => `Day ${d.day_number}: 曝光${d.ad_impressions || 0}, 订单${d.orders_created || 0}, ROI ${d.roi || 0}`).join('\n')}
` : ''}

请严格按照 JSON 格式输出分析结果。`;

  const response = await fetch(QWEN_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QWEN_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen-max',
      input: {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ]
      },
      parameters: {
        result_format: 'message',
        temperature: 0.3,
        max_tokens: 2000
      }
    })
  });

  if (!response.ok) {
    throw new Error(`千问 API 错误: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.output && data.output.choices && data.output.choices[0]) {
    const content = data.output.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  }
  
  throw new Error('千问 API 返回格式错误');
}

// AI 分析接口
app.post('/api/ai-analysis/:productId/:dayNumber', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const { useAI = true } = req.body;
    
    // 获取产品信息
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }
    const productInfo = products[0];
    
    // 获取当天数据
    const [dailyData] = await pool.query(
      'SELECT * FROM daily_data WHERE product_id = ? AND day_number = ?',
      [productId, dayNumber]
    );
    if (dailyData.length === 0) {
      return res.status(404).json({ error: '日数据不存在' });
    }
    const dayData = dailyData[0];
    
    // 获取历史数据
    const [historicalData] = await pool.query(
      'SELECT * FROM daily_data WHERE product_id = ? AND day_number < ? ORDER BY day_number',
      [productId, dayNumber]
    );
    
    let result;
    let source = 'local';
    
    if (useAI && dayData.ad_impressions > 0) {
      try {
        result = await callQwenAPI(dayData, productInfo, historicalData);
        source = 'qwen';
      } catch (aiError) {
        console.error('千问 API 失败，使用本地规则:', aiError.message);
        result = localRuleEngine(dayData, productInfo);
      }
    } else {
      result = localRuleEngine(dayData, productInfo);
    }
    
    // 保存 AI 分析结果
    await pool.query(
      `UPDATE daily_data SET 
        ai_action = ?, 
        ai_reason = ?, 
        ai_confidence = ?,
        phase = ?
       WHERE product_id = ? AND day_number = ?`,
      [
        result.decision,
        result.core_issue,
        result.confidence,
        result.phase,
        productId,
        dayNumber
      ]
    );
    
    res.json({
      success: true,
      source,
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 执行决策 API
// =============================================

app.put('/api/daily-data/:productId/:dayNumber/execute', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const { ai_action, ai_reason, ai_confidence, executor_id } = req.body;
    
    await pool.query(
      `UPDATE daily_data SET 
        ai_action = ?, ai_reason = ?, ai_confidence = ?,
        status = '已执行', executor_id = ?, executed_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [ai_action, ai_reason, ai_confidence, executor_id, productId, dayNumber]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/daily-data/:productId/:dayNumber/abnormal', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const { abnormal_reason, executor_id } = req.body;
    
    await pool.query(
      `UPDATE daily_data SET 
        status = '异常', abnormal_reason = ?, executor_id = ?, executed_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [abnormal_reason, executor_id, productId, dayNumber]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 文件上传解析 API
// =============================================

app.post('/api/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传文件' });
    }
    
    const filePath = req.file.path;
    const python = spawn('python3', ['/www/gmv-max/parse_shopee.py', filePath]);
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => { output += data.toString(); });
    python.stderr.on('data', (data) => { errorOutput += data.toString(); });
    
    python.on('close', (code) => {
      fs.unlink(filePath, () => {});
      
      if (code !== 0) {
        return res.status(500).json({ success: false, error: `Python错误: ${errorOutput}` });
      }
      
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

// =============================================
// 启动服务器
// =============================================

app.listen(3001, () => {
  console.log('GMV MAX API v2.1 running on http://localhost:3001');
  console.log('支持千问 AI 分析');
});
