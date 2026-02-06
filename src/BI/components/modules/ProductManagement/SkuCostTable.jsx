import React, { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "/api/products";

export function SkuCostTable() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef(null);
  const pageSize = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ keyword, page, pageSize, status: "" });
      const res = await fetch(`${API_BASE}/sku/list?${params}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setTotal(json.total);
      }
    } catch (err) {
      console.error("获取单品列表失败:", err);
    }
    setLoading(false);
  }, [keyword, page]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/sku/stats`);
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch {}
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchStats(); }, []);

  const handleSave = async (row) => {
    try {
      const res = await fetch(`${API_BASE}/sku/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      const json = await res.json();
      if (json.success) {
        setEditRow(null);
        fetchData();
        fetchStats();
      } else {
        alert("保存失败: " + json.error);
      }
    } catch (err) {
      alert("保存失败: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("确定删除?")) return;
    try {
      await fetch(`${API_BASE}/sku/${id}`, { method: "DELETE" });
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
      const rows = XLSX.utils.sheet_to_json(sheet);

      const items = rows.map(row => ({
        sku: row["*商品SKU"] || row["商品SKU"] || row["sku"] || "",
        name: row["*中文名称"] || row["中文名称"] || row["name"] || "",
        purchase_price: parseFloat(row["*单价"] || row["单价"] || row["purchase_price"] || 0) || 0,
      })).filter(i => i.sku);

      if (items.length === 0) {
        alert("未识别到有效数据");
        return;
      }

      const res = await fetch(`${API_BASE}/sku/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`导入完成! 新增: ${json.imported}, 更新: ${json.updated}`);
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
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "单品总数", value: stats.total, icon: "📦" },
            { label: "已启用", value: stats.active, icon: "✅" },
            { label: "有采购价", value: stats.has_price, icon: "💰" },
            { label: "平均单价", value: `¥${Number(stats.avg_price || 0).toFixed(2)}`, icon: "📊" },
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
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="搜索 SKU / 名称..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-orange-300"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            📥 导入Excel
          </button>
          <button
            onClick={() => setEditRow({ sku: "", name: "", purchase_price: 0, packaging_cost: 3.2, warehouse_fee: 0, status: 1 })}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
          >
            + 新增单品
          </button>
        </div>
      </div>

      {/* 导入弹窗 */}
      {showImport && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium text-orange-800">📥 导入EasyBoss单品数据</div>
            <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="text-sm text-orange-700 mb-3">
            支持 EasyBoss 导出的单品Excel（.xls/.xlsx），自动识别 商品SKU、中文名称、单价 字段
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">名称</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">采购价(¥)</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">包材费(¥)</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">仓储费(¥)</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">状态</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" className="text-center py-8 text-gray-400">加载中...</td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr><td colSpan="7" className="text-center py-8 text-gray-400">暂无数据，请导入或新增</td></tr>
            )}
            {!loading && data.map(row => (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono text-xs text-gray-800">{row.sku}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{row.name}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">
                  {parseFloat(row.purchase_price).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {parseFloat(row.packaging_cost).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {parseFloat(row.warehouse_fee).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    row.status === 1 ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                  }`}>
                    {row.status === 1 ? "启用" : "停用"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setEditRow({ ...row })}
                      className="text-blue-500 hover:text-blue-700 text-xs"
                    >编辑</button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">共 {total} 条</div>
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

      {/* 编辑弹窗 */}
      {editRow && (
        <EditModal
          row={editRow}
          onSave={handleSave}
          onClose={() => setEditRow(null)}
        />
      )}
    </div>
  );
}

function EditModal({ row, onSave, onClose }) {
  const [form, setForm] = useState({ ...row });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[480px] p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold">{form.id ? "编辑单品" : "新增单品"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品SKU *</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => update("sku", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-300"
              placeholder="如: LOLA ROSE-SYN"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">中文名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-300"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">采购价(¥)</label>
              <input
                type="number"
                step="0.01"
                value={form.purchase_price}
                onChange={(e) => update("purchase_price", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">包材费(¥)</label>
              <input
                type="number"
                step="0.01"
                value={form.packaging_cost}
                onChange={(e) => update("packaging_cost", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">仓储费(¥)</label>
              <input
                type="number"
                step="0.01"
                value={form.warehouse_fee}
                onChange={(e) => update("warehouse_fee", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={form.status}
              onChange={(e) => update("status", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-300"
            >
              <option value={1}>启用</option>
              <option value={0}>停用</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >取消</button>
          <button
            onClick={() => onSave(form)}
            className="px-5 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600"
          >保存</button>
        </div>
      </div>
    </div>
  );
}
