const express = require('express');

// =============================================
// 多模型 AI 配置
// =============================================
const AI_MODELS = {
  qwen: {
    name: '千问 qwen-plus',
    url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    key: process.env.QWEN_API_KEY || 'sk-a9ddec6e8cbe4be1bbf15326a6f4ebd5',
    model: 'qwen-plus',
    async call(systemPrompt, userMessage) {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          input: { messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }] },
          parameters: { temperature: 0.7, top_p: 0.9, max_tokens: 8192, result_format: 'message' }
        })
      });
      if (!res.ok) throw new Error(`千问API错误 ${res.status}`);
      const data = await res.json();
      return data.output?.choices?.[0]?.message?.content || '';
    }
  },
  gemini: {
    name: 'Gemini 2.5 Flash',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    key: process.env.GEMINI_API_KEY || '',
    async call(systemPrompt, userMessage) {
      if (!this.key) throw new Error('Gemini API Key 未配置');
      const res = await fetch(`${this.url}?key=${this.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
        })
      });
      if (!res.ok) throw new Error(`Gemini API错误 ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  },
  claude: {
    name: 'Claude Sonnet',
    url: 'https://api.anthropic.com/v1/messages',
    key: process.env.CLAUDE_API_KEY || '',
    async call(systemPrompt, userMessage) {
      if (!this.key) throw new Error('Claude API Key 未配置');
      const res = await fetch(this.url, {
        method: 'POST',
        headers: {
          'x-api-key': this.key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }]
        })
      });
      if (!res.ok) throw new Error(`Claude API错误 ${res.status}`);
      const data = await res.json();
      return data.content?.[0]?.text || '';
    }
  },
  gpt: {
    name: 'GPT-4o',
    url: 'https://api.openai.com/v1/chat/completions',
    key: process.env.OPENAI_API_KEY || '',
    async call(systemPrompt, userMessage) {
      if (!this.key) throw new Error('OpenAI API Key 未配置');
      const res = await fetch(this.url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
          temperature: 0.7,
          max_tokens: 8192
        })
      });
      if (!res.ok) throw new Error(`OpenAI API错误 ${res.status}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
  }
};

// =============================================
// SKU决策专家 Prompt
// =============================================
const SKU_DECISION_PROMPT = `# Shopee GMV MAX · SKU决策专家

你是Shopee电商SKU级别的决策分析专家，专精印尼市场。

## 你的任务
基于用户提供的SKU近7日完整数据（订单、广告、利润），给出专业的运营决策建议。

## 分析框架
1. **数据健康度诊断** - 判断当前SKU的经营状态（健康/亚健康/危险）
2. **广告效率分析** - ROI趋势、CTR、CVR，GMV MAX系统放量意愿判断
3. **利润结构分析** - 毛利率、广告占比、净利润趋势
4. **流量结构分析** - 自然流量vs广告流量占比，自然单占比变化
5. **竞争力判断** - 基于ATC率、收藏率判断产品竞争力

## 输出要求
用Markdown格式输出完整分析报告，结构如下：

### 📊 SKU健康度评分
给出1-100分的评分和评级（S/A/B/C/D）

### 🔍 核心数据诊断
列出关键指标的计算结果和判断

### ⚡ 关键发现（最多3条）
最重要的洞察，影响决策的核心信息

### 📋 行动建议
按优先级排列的具体可执行建议（每条建议需说明预期效果）

### ⚠️ 风险提醒
当前需要警惕的风险点

### 📅 未来7天关注重点
需要每天盯的关键指标和阈值

## 印尼市场特殊规则
- COD确认延迟平均2.3天
- 价格敏感阈值7%（72h内调价>7%触发学习中断）
- ATC率均值：美妆7.8%，收藏率均值11.2%
- ROI=3为盈亏平衡线

请基于数据给出专业、具体、可执行的建议。不要笼统的废话，要有数据支撑。`;

// 统一汇率和仓库成本
const FIXED_RATE = 0.000455;
const WAREHOUSE_COST_CNY = 4;

module.exports = function(pool) {
  const router = express.Router();

  // =============================================
  // GET /api/decision/models - 获取可用模型列表
  // =============================================
  router.get('/models', (req, res) => {
    const models = Object.entries(AI_MODELS).map(([key, m]) => ({
      key,
      name: m.name,
      available: key === 'qwen' || !!m.key  // 千问始终可用，其他看有没有key
    }));
    res.json({ success: true, models });
  });

  // =============================================
  // GET /api/decision/sku/search?q=xxx - 搜索SKU
  // =============================================
  router.get('/sku/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) return res.json({ success: true, data: [] });

      // 从eb_order_items搜索，按最近订单量排序
      const [rows] = await pool.query(`
        SELECT 
          oi.platform_item_id as item_id,
          oi.goods_name as name,
          oi.goods_sku_outer_id as sku_id,
          o.shop_name,
          COUNT(DISTINCT o.platform_order_sn) as recent_orders
        FROM eb_order_items oi
        JOIN eb_orders o ON oi.op_order_package_id = o.op_order_package_id
        WHERE oi.platform_item_id IS NOT NULL
          AND oi.platform_item_id != ''
          AND DATE(o.gmt_order_start) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          AND (oi.platform_item_id LIKE ? OR oi.goods_name LIKE ? OR oi.goods_sku_outer_id LIKE ?)
        GROUP BY oi.platform_item_id, oi.goods_name, o.shop_name
        ORDER BY recent_orders DESC
        LIMIT 20
      `, [`%${q}%`, `%${q}%`, `%${q}%`]);

      res.json({ success: true, data: rows });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  // =============================================
  // GET /api/decision/sku/:itemId/data - 获取SKU近7日数据
  // =============================================
  router.get('/sku/:itemId/data', async (req, res) => {
    try {
      const { itemId } = req.params;
      const days = parseInt(req.query.days) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const start = startDate.toISOString().split('T')[0];
      const end = new Date().toISOString().split('T')[0];

      // 1. 订单数据（按天聚合）
      const [orderData] = await pool.query(`
        SELECT 
          DATE(o.gmt_order_start) as date,
          o.shop_name,
          COUNT(DISTINCT o.platform_order_sn) as order_count,
          SUM(oi.quantity) as total_qty,
          SUM(oi.discounted_price) as total_revenue_idr,
          SUM(o.escrow_amount * oi.discounted_price / 
            NULLIF((SELECT SUM(oi2.discounted_price) FROM eb_order_items oi2 WHERE oi2.op_order_package_id = o.op_order_package_id), 0)
          ) as total_escrow_share
        FROM eb_order_items oi
        JOIN eb_orders o ON oi.op_order_package_id = o.op_order_package_id
        WHERE oi.platform_item_id = ?
          AND DATE(o.gmt_order_start) >= ? AND DATE(o.gmt_order_start) <= ?
          AND o.app_package_status NOT IN ('cancelled', 'returned', 'unpaid', 'refunding')
        GROUP BY DATE(o.gmt_order_start), o.shop_name
        ORDER BY date DESC
      `, [itemId, start, end]);

      // 2. 广告数据（按天）
      const [adData] = await pool.query(`
        SELECT 
          date,
          SUM(impression) as impressions,
          SUM(clicks) as clicks,
          SUM(direct_conversions + indirect_conversions) as ad_orders,
          SUM(expense) as ad_spend_idr,
          SUM(direct_gmv + indirect_gmv) as ad_revenue_idr,
          SUM(add_to_cart) as add_to_cart,
          SUM(favourite) as favourite
        FROM eb_ad_daily
        WHERE platform_item_id = ?
          AND date >= ? AND date <= ?
        GROUP BY date
        ORDER BY date DESC
      `, [itemId, start, end]);

      // 3. 产品基本信息
      const [productInfo] = await pool.query(`
        SELECT goods_name as name, goods_sku_outer_id as sku_id, goods_mode
        FROM eb_order_items
        WHERE platform_item_id = ?
        ORDER BY id DESC LIMIT 1
      `, [itemId]);

      // 4. SKU成本
      const skuIds = [...new Set(orderData.map(r => r.sku_id).filter(Boolean))];
      let costMap = {};
      if (productInfo.length > 0 && productInfo[0].sku_id) {
        const [costs] = await pool.query(
          `SELECT sku, purchase_price FROM eb_sku_costs WHERE sku = ?`,
          [productInfo[0].sku_id]
        );
        costs.forEach(c => { costMap[c.sku] = parseFloat(c.purchase_price) || 0; });
      }

      // 5. 汇总计算
      const adMap = {};
      adData.forEach(d => {
        adMap[d.date] = {
          impressions: parseInt(d.impressions) || 0,
          clicks: parseInt(d.clicks) || 0,
          ad_orders: parseInt(d.ad_orders) || 0,
          ad_spend_idr: parseFloat(d.ad_spend_idr) || 0,
          ad_spend_cny: (parseFloat(d.ad_spend_idr) || 0) * FIXED_RATE * 1.1,
          ad_revenue_idr: parseFloat(d.ad_revenue_idr) || 0,
          add_to_cart: parseInt(d.add_to_cart) || 0,
          favourite: parseInt(d.favourite) || 0,
        };
      });

      // 合并每日数据
      const dailyData = [];
      const dateSet = new Set([
        ...orderData.map(d => d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date),
        ...adData.map(d => d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date)
      ]);

      for (const date of [...dateSet].sort().reverse()) {
        const orders = orderData.filter(o => {
          const od = o.date instanceof Date ? o.date.toISOString().split('T')[0] : o.date;
          return od === date;
        });
        const ad = adMap[date] || {};
        
        const totalOrders = orders.reduce((s, o) => s + (parseInt(o.order_count) || 0), 0);
        const totalQty = orders.reduce((s, o) => s + (parseInt(o.total_qty) || 0), 0);
        const totalRevenueIDR = orders.reduce((s, o) => s + (parseFloat(o.total_revenue_idr) || 0), 0);
        const totalEscrow = orders.reduce((s, o) => s + (parseFloat(o.total_escrow_share) || 0), 0);
        const revenueCNY = totalEscrow * FIXED_RATE;
        const shops = [...new Set(orders.map(o => o.shop_name).filter(Boolean))];
        
        const unitCost = costMap[productInfo[0]?.sku_id] || 0;
        const totalCost = unitCost * totalQty;
        const warehouseCost = totalOrders * WAREHOUSE_COST_CNY;
        const adSpendCNY = ad.ad_spend_cny || 0;
        const profit = revenueCNY - totalCost - warehouseCost - adSpendCNY;

        const roi = adSpendCNY > 0 ? (revenueCNY / adSpendCNY) : 0;
        const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions * 100) : 0;
        const cvr = ad.clicks > 0 ? ((ad.ad_orders || 0) / ad.clicks * 100) : 0;

        dailyData.push({
          date,
          shops,
          orders: totalOrders,
          quantity: totalQty,
          revenue_idr: totalRevenueIDR,
          revenue_cny: Math.round(revenueCNY * 100) / 100,
          cost_cny: Math.round(totalCost * 100) / 100,
          warehouse_cny: warehouseCost,
          ad_spend_cny: Math.round(adSpendCNY * 100) / 100,
          profit_cny: Math.round(profit * 100) / 100,
          profit_rate: revenueCNY > 0 ? Math.round(profit / revenueCNY * 10000) / 100 : 0,
          // 广告指标
          impressions: ad.impressions || 0,
          clicks: ad.clicks || 0,
          ad_orders: ad.ad_orders || 0,
          natural_orders: Math.max(0, totalOrders - (ad.ad_orders || 0)),
          roi: Math.round(roi * 100) / 100,
          ctr: Math.round(ctr * 100) / 100,
          cvr: Math.round(cvr * 100) / 100,
          add_to_cart: ad.add_to_cart || 0,
          favourite: ad.favourite || 0,
        });
      }

      // 汇总
      const summary = {
        total_orders: dailyData.reduce((s, d) => s + d.orders, 0),
        total_revenue_cny: Math.round(dailyData.reduce((s, d) => s + d.revenue_cny, 0) * 100) / 100,
        total_profit_cny: Math.round(dailyData.reduce((s, d) => s + d.profit_cny, 0) * 100) / 100,
        total_ad_spend_cny: Math.round(dailyData.reduce((s, d) => s + d.ad_spend_cny, 0) * 100) / 100,
        avg_roi: (() => {
          const totalAd = dailyData.reduce((s, d) => s + d.ad_spend_cny, 0);
          const totalRev = dailyData.reduce((s, d) => s + d.revenue_cny, 0);
          return totalAd > 0 ? Math.round(totalRev / totalAd * 100) / 100 : 0;
        })(),
        avg_daily_orders: Math.round(dailyData.reduce((s, d) => s + d.orders, 0) / Math.max(dailyData.length, 1) * 10) / 10,
        total_impressions: dailyData.reduce((s, d) => s + d.impressions, 0),
        total_clicks: dailyData.reduce((s, d) => s + d.clicks, 0),
      };

      res.json({
        success: true,
        item_id: itemId,
        product: productInfo[0] || null,
        daily: dailyData,
        summary,
        unit_cost: costMap[productInfo[0]?.sku_id] || 0,
      });
    } catch (e) {
      console.error('SKU data error:', e);
      res.json({ success: false, error: e.message });
    }
  });

  // =============================================
  // POST /api/decision/sku/:itemId/analyze - AI分析SKU
  // =============================================
  router.post('/sku/:itemId/analyze', async (req, res) => {
    try {
      const { itemId } = req.params;
      const { model = 'qwen' } = req.body;

      // 1. 获取SKU数据
      const dataRes = await new Promise((resolve) => {
        const mockReq = { params: { itemId }, query: { days: 7 } };
        const mockRes = { json: (d) => resolve(d) };
        // 直接调用数据接口逻辑（内部复用）
        router.handle({ ...mockReq, method: 'GET', url: `/sku/${itemId}/data?days=7` }, mockRes, () => {});
      });

      // 备用方案：直接查数据库构建上下文
      const days = 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const start = startDate.toISOString().split('T')[0];
      const end = new Date().toISOString().split('T')[0];

      // 查订单
      const [orderData] = await pool.query(`
        SELECT 
          DATE(o.gmt_order_start) as date,
          o.shop_name,
          COUNT(DISTINCT o.platform_order_sn) as order_count,
          SUM(oi.quantity) as total_qty,
          SUM(oi.discounted_price) as total_revenue_idr
        FROM eb_order_items oi
        JOIN eb_orders o ON oi.op_order_package_id = o.op_order_package_id
        WHERE oi.platform_item_id = ?
          AND DATE(o.gmt_order_start) >= ? AND DATE(o.gmt_order_start) <= ?
          AND o.app_package_status NOT IN ('cancelled', 'returned', 'unpaid', 'refunding')
        GROUP BY DATE(o.gmt_order_start), o.shop_name
        ORDER BY date
      `, [itemId, start, end]);

      // 查广告
      const [adData] = await pool.query(`
        SELECT 
          date,
          SUM(impression) as impressions,
          SUM(clicks) as clicks,
          SUM(direct_conversions + indirect_conversions) as ad_orders,
          SUM(expense) as ad_spend_idr,
          SUM(direct_gmv + indirect_gmv) as ad_revenue_idr,
          SUM(add_to_cart) as atc,
          SUM(favourite) as fav
        FROM eb_ad_daily
        WHERE platform_item_id = ? AND date >= ? AND date <= ?
        GROUP BY date ORDER BY date
      `, [itemId, start, end]);

      // 产品信息
      const [pInfo] = await pool.query(
        `SELECT goods_name, goods_sku_outer_id FROM eb_order_items WHERE platform_item_id = ? ORDER BY id DESC LIMIT 1`,
        [itemId]
      );

      // 构建用户消息
      let userMsg = `## SKU分析请求\n\n`;
      userMsg += `- **链接ID**: ${itemId}\n`;
      userMsg += `- **商品名**: ${pInfo[0]?.goods_name || '未知'}\n`;
      userMsg += `- **SKU**: ${pInfo[0]?.goods_sku_outer_id || '未知'}\n`;
      userMsg += `- **分析周期**: ${start} 至 ${end}\n\n`;

      userMsg += `## 每日订单数据\n`;
      userMsg += `| 日期 | 店铺 | 订单数 | 数量 | 销售额IDR |\n`;
      userMsg += `|------|------|--------|------|----------|\n`;
      orderData.forEach(d => {
        const dateStr = d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date;
        userMsg += `| ${dateStr} | ${d.shop_name} | ${d.order_count} | ${d.total_qty} | ${Math.round(d.total_revenue_idr)} |\n`;
      });

      userMsg += `\n## 每日广告数据\n`;
      userMsg += `| 日期 | 曝光 | 点击 | CTR% | 广告单 | 花费IDR | 广告GMV IDR | ROI | ATC | 收藏 |\n`;
      userMsg += `|------|------|------|------|--------|---------|------------|-----|-----|------|\n`;
      adData.forEach(d => {
        const dateStr = d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date;
        const imp = parseInt(d.impressions) || 0;
        const clk = parseInt(d.clicks) || 0;
        const ctr = imp > 0 ? (clk / imp * 100).toFixed(2) : '0';
        const spend = parseFloat(d.ad_spend_idr) || 0;
        const rev = parseFloat(d.ad_revenue_idr) || 0;
        const roi = spend > 0 ? (rev / spend).toFixed(2) : '0';
        userMsg += `| ${dateStr} | ${imp} | ${clk} | ${ctr} | ${d.ad_orders || 0} | ${Math.round(spend)} | ${Math.round(rev)} | ${roi} | ${d.atc || 0} | ${d.fav || 0} |\n`;
      });

      userMsg += `\n## 关键汇总\n`;
      const totalOrders = orderData.reduce((s, d) => s + parseInt(d.order_count), 0);
      const totalAdSpend = adData.reduce((s, d) => s + (parseFloat(d.ad_spend_idr) || 0), 0);
      const totalAdRev = adData.reduce((s, d) => s + (parseFloat(d.ad_revenue_idr) || 0), 0);
      const totalImp = adData.reduce((s, d) => s + (parseInt(d.impressions) || 0), 0);
      const totalClk = adData.reduce((s, d) => s + (parseInt(d.clicks) || 0), 0);
      const totalAdOrders = adData.reduce((s, d) => s + (parseInt(d.ad_orders) || 0), 0);
      userMsg += `- 7日总订单: ${totalOrders}\n`;
      userMsg += `- 7日总广告花费: IDR ${Math.round(totalAdSpend)} (≈ ¥${(totalAdSpend * FIXED_RATE * 1.1).toFixed(0)})\n`;
      userMsg += `- 7日总广告GMV: IDR ${Math.round(totalAdRev)}\n`;
      userMsg += `- 7日平均ROI: ${totalAdSpend > 0 ? (totalAdRev / totalAdSpend).toFixed(2) : 'N/A'}\n`;
      userMsg += `- 7日总曝光: ${totalImp}, 总点击: ${totalClk}\n`;
      userMsg += `- 7日广告转化单: ${totalAdOrders}, 自然单: ${totalOrders - totalAdOrders}\n`;
      userMsg += `- 自然单占比: ${totalOrders > 0 ? ((totalOrders - totalAdOrders) / totalOrders * 100).toFixed(1) : 0}%\n`;
      userMsg += `\n请基于以上数据进行完整分析，给出具体可执行的决策建议。`;

      // 2. 调用AI模型
      const aiModel = AI_MODELS[model];
      if (!aiModel) {
        return res.json({ success: false, error: `未知模型: ${model}` });
      }

      console.log(`[Decision] SKU ${itemId} 使用模型: ${aiModel.name}`);
      const startTime = Date.now();
      const report = await aiModel.call(SKU_DECISION_PROMPT, userMsg);
      const elapsed = Date.now() - startTime;
      console.log(`[Decision] 分析完成, 耗时 ${elapsed}ms, 报告长度 ${report.length}`);

      res.json({
        success: true,
        item_id: itemId,
        model: model,
        model_name: aiModel.name,
        report,
        elapsed_ms: elapsed,
        data_context: {
          period: `${start} ~ ${end}`,
          total_orders: totalOrders,
          total_ad_spend_idr: Math.round(totalAdSpend),
        }
      });
    } catch (e) {
      console.error('SKU analysis error:', e);
      res.json({ success: false, error: e.message });
    }
  });

  // =============================================
  // POST /api/decision/models/config - 更新模型API Key
  // =============================================
  router.post('/models/config', (req, res) => {
    try {
      const { model, apiKey } = req.body;
      if (!AI_MODELS[model]) return res.json({ success: false, error: '未知模型' });
      AI_MODELS[model].key = apiKey;
      res.json({ success: true, message: `${AI_MODELS[model].name} API Key 已更新` });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  return router;
};
