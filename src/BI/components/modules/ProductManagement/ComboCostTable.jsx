import React, { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "/api/products";

export function ComboCostTable() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef(null);
  const pageSize = 30;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ keyword, page, pageSize });
      const res = await fetch(`${API_BASE}/combo/list?${params}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setTotal(json.total);
      }
    } catch (err) {
      console.error("获取组合列表失败:", err);
    }
    setLoading(false);
  }, [keyword, page]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/combo/stats`);
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch {}
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchStats(); }, []);

  const handleDelete = async (comboSku) => {
    if (!confirm(`确定删除组合 ${comboSku}?`)) return;
    try {
      await fetch(`${API_BASE}/combo/${encodeURIComponent(comboSku)}`, { method: "DELETE" });
      fetchData();
      fetchStats();
    } catch {}
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // EasyBoss组合品导出格式：
      // 商品序号 | *商品SKU | 平台SKU | 商品代码 | *中文名称 | 仓库 | ... | *包含的商品SKU | *商品数量
      // 组合的多个子项会占多行，序号列为空表示是上一行的续行
      
      const headers = rows[0];
      const skuCol = headers.findIndex(h => h && h.toString().includes("商品SKU") && !h.toString().includes("包含"));
      const nameCol = headers.findIndex(h => h && h.toString().includes("中文名称"));
      const itemSkuCol = headers.findIndex(h => h && h.toString().includes("包含的商品SKU"));
      const qtyCol = headers.findIndex(h => h && h.toString().includes("商品数量"));
      const seqCol = headers.findIndex(h => h && h.toString().includes("商品序号"));

      if (itemSkuCol === -1 || skuCol === -1) {
        alert("未识别到组合品格式，请确认包含：商品SKU、包含的商品SKU 列");
        setLoading(false);
        return;
      }

      // 解析组合关系
      const comboMap = {};
      let currentComboSku = null;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const seq = row[seqCol];
        const comboSku = row[skuCol];
        const itemSku = row[itemSkuCol];
        const qty = parseInt(row[qtyCol]) || 1;
        const name = row[nameCol] || "";

        if (seq && comboSku) {
          // 新的组合SKU
          currentComboSku = comboSku;
          if (!comboMap[currentComboSku]) {
            comboMap[currentComboSku] = { combo_name: name, items: [] };
          }
        }

        if (currentComboSku && itemSku) {
          comboMap[currentComboSku].items.push({ item_sku: itemSku.toString().trim(), quantity: qty });
        }
      }

      const combos = Object.entries(comboMap).map(([sku, info]) => ({
        combo_sku: sku,
        combo_name: info.combo_name,
        items: info.items,
      })).filter(c => c.items.length > 0);

      if (combos.length === 0) {
        alert("未解析到有效的组合数据");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/combo/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ combos }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`导入完成! 共导入 ${json.imported} 个组合`);
        fetchData();
        fetchStats();
        setShowImport(false);
      } else {
        alert("导入失败: " + json.error);
      }
    } catch (err) {
      alert("文件解析失败: " + err.message);
    }
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "组合总数", value: stats.total_combos, icon: "🔗" },
            { label: "关系记录", value: stats.total_items, icon: "📋" },
            { label: "平均子项数", value: stats.avg_items_per_combo, icon: "📊" },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">{card.label}</div>
                  <div className="text-xl font-bold text-gray-800 mt-1">{card.value}</div>
                </div>
                <span className="text-2xl">{card.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 工具栏 */}
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="搜索组合SKU / 子项SKU..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm w-72 focus:outline-none focus:border-orange-300"
        />
        <button
          onClick={() => setShowImport(true)}
          className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
        >
          📥 导入Excel
        </button>
      </div>

      {/* 导入弹窗 */}
      {showImport && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium text-orange-800">📥 导入EasyBoss组合品数据</div>
            <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="text-sm text-orange-700 mb-3">
            支持 EasyBoss 导出的组合品Excel（.xls/.xlsx），自动解析组合关系
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx"
            onChange={handleFileImport}
            className="text-sm"
          />
        </div>
      )}

      {/* 表格 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-8"></th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">组合SKU</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">名称</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">子项数</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">组合成本(¥)</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="6" className="text-center py-8 text-gray-400">加载中...</td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr><td colSpan="6" className="text-center py-8 text-gray-400">暂无数据，请导入组合品</td></tr>
            )}
            {!loading && data.map((combo) => (
              <React.Fragment key={combo.combo_sku}>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setExpandedRow(expandedRow === combo.combo_sku ? null : combo.combo_sku)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedRow === combo.combo_sku ? "▼" : "▶"}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-800 max-w-xs truncate">
                    {combo.combo_sku}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {combo.combo_name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                      {combo.item_count} 个
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {combo.total_cost > 0 ? (
                      <span className="text-gray-800">¥{combo.total_cost.toFixed(2)}</span>
                    ) : (
                      <span className="text-red-400">未设价</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(combo.combo_sku)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >删除</button>
                  </td>
                </tr>

                {/* 展开子项 */}
                {expandedRow === combo.combo_sku && (
                  <tr>
                    <td colSpan="6" className="px-8 py-3 bg-gray-50/80">
                      <div className="text-xs text-gray-500 mb-2 font-medium">包含的单品：</div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400">
                            <th className="text-left py-1">单品SKU</th>
                            <th className="text-left py-1">名称</th>
                            <th className="text-center py-1">数量</th>
                            <th className="text-right py-1">单价(¥)</th>
                            <th className="text-right py-1">小计(¥)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {combo.items.map((item, idx) => (
                            <tr key={idx} className="border-t border-gray-100">
                              <td className="py-1.5 font-mono text-gray-700">{item.item_sku}</td>
                              <td className="py-1.5 text-gray-500">{item.item_name || "-"}</td>
                              <td className="py-1.5 text-center">{item.quantity}</td>
                              <td className="py-1.5 text-right">
                                {item.purchase_price ? `¥${parseFloat(item.purchase_price).toFixed(2)}` : 
                                  <span className="text-red-400">未设价</span>
                                }
                              </td>
                              <td className="py-1.5 text-right font-medium">
                                ¥{((parseFloat(item.purchase_price) || 0) * item.quantity).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">共 {total} 个组合</div>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40"
            >上一页</button>
            <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40"
            >下一页</button>
          </div>
        </div>
      )}
    </div>
  );
}
