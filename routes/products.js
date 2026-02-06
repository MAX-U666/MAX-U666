/**
 * 产品管理路由
 * 单品SKU成本 + 组合SKU关系 的 CRUD
 */

const express = require('express');

module.exports = function(pool) {
  const router = express.Router();

  // =============================================
  // 单品SKU管理
  // =============================================

  /**
   * 获取单品列表（支持搜索、分页）
   */
  router.get('/sku/list', async (req, res) => {
    try {
      const { keyword = '', page = 1, pageSize = 50, status } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      
      let where = 'WHERE 1=1';
      const params = [];
      
      if (keyword) {
        where += ' AND (sku LIKE ? OR name LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      if (status !== undefined && status !== '') {
        where += ' AND status = ?';
        params.push(parseInt(status));
      }

      const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) as total FROM eb_sku_costs ${where}`, params
      );

      const [rows] = await pool.query(
        `SELECT * FROM eb_sku_costs ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );

      res.json({ success: true, data: rows, total, page: parseInt(page), pageSize: parseInt(pageSize) });
    } catch (err) {
      console.error('[产品管理] 获取单品列表失败:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 新增/编辑单品
   */
  router.post('/sku/save', async (req, res) => {
    try {
      const { id, sku, name, purchase_price, packaging_cost, warehouse_fee, status } = req.body;
      
      if (!sku) return res.status(400).json({ success: false, error: 'SKU不能为空' });

      if (id) {
        await pool.query(
          `UPDATE eb_sku_costs SET sku=?, name=?, purchase_price=?, packaging_cost=?, warehouse_fee=?, status=? WHERE id=?`,
          [sku, name || '', purchase_price || 0, packaging_cost ?? 3.2, warehouse_fee || 0, status ?? 1, id]
        );
      } else {
        await pool.query(
          `INSERT INTO eb_sku_costs (sku, name, purchase_price, packaging_cost, warehouse_fee, status)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), purchase_price=VALUES(purchase_price), 
             packaging_cost=VALUES(packaging_cost), warehouse_fee=VALUES(warehouse_fee), status=VALUES(status)`,
          [sku, name || '', purchase_price || 0, packaging_cost ?? 3.2, warehouse_fee || 0, status ?? 1]
        );
      }

      res.json({ success: true });
    } catch (err) {
      console.error('[产品管理] 保存单品失败:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 删除单品
   */
  router.delete('/sku/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM eb_sku_costs WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 批量导入单品（从EasyBoss导出格式）
   */
  router.post('/sku/import', async (req, res) => {
    try {
      const { items } = req.body; // [{sku, name, purchase_price}]
      if (!items || !items.length) {
        return res.status(400).json({ success: false, error: '无数据' });
      }

      let imported = 0, updated = 0;
      for (const item of items) {
        if (!item.sku) continue;
        const [result] = await pool.query(
          `INSERT INTO eb_sku_costs (sku, name, purchase_price)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), purchase_price=VALUES(purchase_price)`,
          [item.sku, item.name || '', item.purchase_price || 0]
        );
        if (result.affectedRows === 1) imported++;
        else if (result.affectedRows === 2) updated++;
      }

      res.json({ success: true, imported, updated, total: items.length });
    } catch (err) {
      console.error('[产品管理] 批量导入单品失败:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 单品统计
   */
  router.get('/sku/stats', async (req, res) => {
    try {
      const [[stats]] = await pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN purchase_price > 0 THEN 1 ELSE 0 END) as has_price,
          AVG(CASE WHEN purchase_price > 0 THEN purchase_price END) as avg_price
        FROM eb_sku_costs
      `);
      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =============================================
  // 组合SKU管理
  // =============================================

  /**
   * 获取组合列表（聚合显示）
   */
  router.get('/combo/list', async (req, res) => {
    try {
      const { keyword = '', page = 1, pageSize = 50 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(pageSize);

      let where = 'WHERE 1=1';
      const params = [];
      if (keyword) {
        where += ' AND (c.combo_sku LIKE ? OR c.combo_name LIKE ? OR c.item_sku LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }

      // 先获取不重复的组合SKU总数
      const [[{ total }]] = await pool.query(
        `SELECT COUNT(DISTINCT c.combo_sku) as total FROM eb_sku_combos c ${where}`, params
      );

      // 获取分页的组合SKU列表
      const [comboSkus] = await pool.query(
        `SELECT DISTINCT c.combo_sku, c.combo_name, MIN(c.created_at) as created_at
         FROM eb_sku_combos c ${where}
         GROUP BY c.combo_sku, c.combo_name
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );

      if (comboSkus.length === 0) {
        return res.json({ success: true, data: [], total, page: parseInt(page), pageSize: parseInt(pageSize) });
      }

      // 获取这些组合的子项 + 单品成本
      const skuList = comboSkus.map(c => c.combo_sku);
      const placeholders = skuList.map(() => '?').join(',');
      const [items] = await pool.query(
        `SELECT c.combo_sku, c.item_sku, c.quantity,
                s.name as item_name, s.purchase_price
         FROM eb_sku_combos c
         LEFT JOIN eb_sku_costs s ON c.item_sku = s.sku
         WHERE c.combo_sku IN (${placeholders})`,
        skuList
      );

      // 组装数据
      const data = comboSkus.map(combo => {
        const children = items.filter(i => i.combo_sku === combo.combo_sku);
        const totalCost = children.reduce((sum, child) => {
          return sum + (parseFloat(child.purchase_price) || 0) * (child.quantity || 1);
        }, 0);

        return {
          combo_sku: combo.combo_sku,
          combo_name: combo.combo_name,
          created_at: combo.created_at,
          items: children,
          total_cost: totalCost,
          item_count: children.length,
        };
      });

      res.json({ success: true, data, total, page: parseInt(page), pageSize: parseInt(pageSize) });
    } catch (err) {
      console.error('[产品管理] 获取组合列表失败:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 新增/编辑组合SKU
   */
  router.post('/combo/save', async (req, res) => {
    try {
      const { combo_sku, combo_name, items } = req.body;
      // items: [{item_sku, quantity}]
      
      if (!combo_sku || !items?.length) {
        return res.status(400).json({ success: false, error: '组合SKU和子项不能为空' });
      }

      // 先删旧的再插入
      await pool.query('DELETE FROM eb_sku_combos WHERE combo_sku = ?', [combo_sku]);

      for (const item of items) {
        await pool.query(
          `INSERT INTO eb_sku_combos (combo_sku, combo_name, item_sku, quantity) VALUES (?, ?, ?, ?)`,
          [combo_sku, combo_name || '', item.item_sku, item.quantity || 1]
        );
      }

      res.json({ success: true });
    } catch (err) {
      console.error('[产品管理] 保存组合失败:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 删除组合
   */
  router.delete('/combo/:comboSku', async (req, res) => {
    try {
      await pool.query('DELETE FROM eb_sku_combos WHERE combo_sku = ?', [req.params.comboSku]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 批量导入组合（从EasyBoss导出格式）
   */
  router.post('/combo/import', async (req, res) => {
    try {
      const { combos } = req.body;
      // combos: [{combo_sku, combo_name, items: [{item_sku, quantity}]}]
      if (!combos || !combos.length) {
        return res.status(400).json({ success: false, error: '无数据' });
      }

      let imported = 0;
      for (const combo of combos) {
        if (!combo.combo_sku || !combo.items?.length) continue;
        
        // 删旧插新
        await pool.query('DELETE FROM eb_sku_combos WHERE combo_sku = ?', [combo.combo_sku]);
        
        for (const item of combo.items) {
          await pool.query(
            `INSERT INTO eb_sku_combos (combo_sku, combo_name, item_sku, quantity) VALUES (?, ?, ?, ?)`,
            [combo.combo_sku, combo.combo_name || '', item.item_sku, item.quantity || 1]
          );
        }
        imported++;
      }

      res.json({ success: true, imported, total: combos.length });
    } catch (err) {
      console.error('[产品管理] 批量导入组合失败:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 组合统计
   */
  router.get('/combo/stats', async (req, res) => {
    try {
      const [[stats]] = await pool.query(`
        SELECT 
          COUNT(DISTINCT combo_sku) as total_combos,
          COUNT(*) as total_items,
          ROUND(COUNT(*) / COUNT(DISTINCT combo_sku), 1) as avg_items_per_combo
        FROM eb_sku_combos
      `);
      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =============================================
  // 成本计算辅助接口
  // =============================================

  /**
   * 查询SKU成本（自动识别单品/组合）
   * 供利润计算模块调用
   */
  router.get('/cost/lookup', async (req, res) => {
    try {
      const { sku } = req.query;
      if (!sku) return res.status(400).json({ success: false, error: 'SKU不能为空' });

      // 先查组合表
      const [comboItems] = await pool.query(
        `SELECT c.item_sku, c.quantity, s.purchase_price, s.name
         FROM eb_sku_combos c
         LEFT JOIN eb_sku_costs s ON c.item_sku = s.sku
         WHERE c.combo_sku = ?`,
        [sku]
      );

      if (comboItems.length > 0) {
        // 是组合SKU
        const totalCost = comboItems.reduce((sum, item) => {
          return sum + (parseFloat(item.purchase_price) || 0) * (item.quantity || 1);
        }, 0);

        return res.json({
          success: true,
          type: 'combo',
          sku,
          total_cost: totalCost,
          items: comboItems
        });
      }

      // 查单品表
      const [singles] = await pool.query(
        'SELECT * FROM eb_sku_costs WHERE sku = ? AND status = 1', [sku]
      );

      if (singles.length > 0) {
        return res.json({
          success: true,
          type: 'single',
          sku,
          total_cost: parseFloat(singles[0].purchase_price) || 0,
          data: singles[0]
        });
      }

      // 找不到
      res.json({ success: true, type: 'unknown', sku, total_cost: 0 });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 批量查询SKU成本
   */
  router.post('/cost/batch-lookup', async (req, res) => {
    try {
      const { skus } = req.body; // ['sku1', 'sku2', ...]
      if (!skus?.length) return res.json({ success: true, data: {} });

      const result = {};

      // 批量查组合
      const placeholders = skus.map(() => '?').join(',');
      const [comboRows] = await pool.query(
        `SELECT c.combo_sku, c.item_sku, c.quantity, s.purchase_price
         FROM eb_sku_combos c
         LEFT JOIN eb_sku_costs s ON c.item_sku = s.sku
         WHERE c.combo_sku IN (${placeholders})`,
        skus
      );

      // 按combo_sku分组
      const comboMap = {};
      for (const row of comboRows) {
        if (!comboMap[row.combo_sku]) comboMap[row.combo_sku] = [];
        comboMap[row.combo_sku].push(row);
      }

      for (const [sku, items] of Object.entries(comboMap)) {
        result[sku] = {
          type: 'combo',
          total_cost: items.reduce((s, i) => s + (parseFloat(i.purchase_price) || 0) * (i.quantity || 1), 0)
        };
      }

      // 未匹配的查单品
      const remaining = skus.filter(s => !result[s]);
      if (remaining.length > 0) {
        const ph2 = remaining.map(() => '?').join(',');
        const [singleRows] = await pool.query(
          `SELECT sku, purchase_price FROM eb_sku_costs WHERE sku IN (${ph2}) AND status = 1`,
          remaining
        );
        for (const row of singleRows) {
          result[row.sku] = { type: 'single', total_cost: parseFloat(row.purchase_price) || 0 };
        }
      }

      // 仍然没匹配的
      for (const sku of skus) {
        if (!result[sku]) result[sku] = { type: 'unknown', total_cost: 0 };
      }

      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
