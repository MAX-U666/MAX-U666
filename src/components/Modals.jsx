import React, { useRef } from 'react';
import { MiniLogo } from './Logo';
import { styles, getDayStatus } from '../styles/theme';

// =============================================
// 新建产品弹窗
// =============================================
export const NewProductModal = ({ newProduct, setNewProduct, onClose, onCreate, currentUser }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)', borderRadius: '24px', width: '500px', overflow: 'hidden', border: '1px solid #E0E0E5' }}>
      <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>新建产品任务</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>创建7天GMV MAX跟踪周期</p>
        </div>
      </div>
      
      <div style={{ padding: '28px' }}>
        <InputField label="产品ID (SKU) *" value={newProduct.sku} onChange={(v) => setNewProduct({...newProduct, sku: v})} placeholder="从Shopee复制产品ID" />
        <InputField label="产品名称 *" value={newProduct.name} onChange={(v) => setNewProduct({...newProduct, name: v})} placeholder="输入产品名称" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <InputField label="开始日期 (Day 1)" type="date" value={newProduct.start_date} onChange={(v) => setNewProduct({...newProduct, start_date: v})} />
          <InputField label="目标ROI" type="number" step="0.1" value={newProduct.target_roi} onChange={(v) => setNewProduct({...newProduct, target_roi: v})} />
        </div>
        <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#60A5FA' }}>📅 系统将自动创建 Day 1 ~ Day 7 的数据表格</div>
          <div style={{ fontSize: '12px', color: '#60A5FA', marginTop: '4px' }}>👤 负责人: {currentUser.name}</div>
        </div>
      </div>
      
      <div style={{ padding: '20px 28px', borderTop: '1px solid #E8E8ED', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button onClick={onClose} style={styles.buttonSecondary}>取消</button>
        <button onClick={onCreate} style={{ ...styles.buttonPrimary, background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>创建产品</button>
      </div>
    </div>
  </div>
);

// =============================================
// 上传数据弹窗 - 支持26列完整数据
// =============================================
export const UploadModal = ({ 
  selectedProduct, selectedDayNumber, setSelectedDayNumber,
  shopData, setShopData, adData, setAdData,
  uploadMessage, setUploadMessage, uploadLoading,
  onClose, onShopUpload, onAdUpload, onImport
}) => {
  const shopFileRef = useRef(null);
  const adFileRef = useRef(null);
  
  const sku = selectedProduct?.sku;
  const matchedShop = shopData?.find(p => p.product_id === sku);
  const matchedAd = adData?.find(p => p.product_id === sku);
  const hasAnyData = matchedShop || matchedAd;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)', borderRadius: '24px', width: '800px', maxHeight: '90vh', overflow: 'hidden', border: '1px solid #E0E0E5' }}>
        <div style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <MiniLogo size={28} color="#fff" />
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>上传Shopee数据 (26列完整版)</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{selectedProduct?.name} · SKU: {selectedProduct?.sku}</p>
          </div>
        </div>
        
        <div style={{ padding: '28px', maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Day选择 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '12px' }}>选择录入的 Day</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[1,2,3,4,5,6,7].map(d => {
                const dayData = selectedProduct?.daily_data?.find(dd => dd.day_number === d);
                const dayStatus = getDayStatus(dayData);
                return (
                  <button key={d} onClick={() => setSelectedDayNumber(d)} style={{
                    width: '56px', height: '56px', borderRadius: '12px',
                    border: selectedDayNumber === d ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.1)',
                    background: selectedDayNumber === d ? 'rgba(255,107,53,0.15)' : 'rgba(100,116,139,0.1)',
                    color: selectedDayNumber === d ? '#FF6B35' : dayStatus.color,
                    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '700' }}>{d}</span>
                    <span style={{ fontSize: '9px', opacity: 0.8 }}>{dayStatus.label.slice(0,2)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 上传区域 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <UploadBox 
              title="店铺数据 (Excel 26列)" color="#10B981" icon="📊"
              fileRef={shopFileRef} accept=".xlsx,.xls" data={shopData}
              matched={matchedShop} 
              matchText={matchedShop ? `访客${matchedShop.visitors} 下单${matchedShop.orders_created} 收入Rp${(matchedShop.revenue_created/1000).toFixed(0)}k` : null}
              onUpload={onShopUpload}
            />
            <UploadBox 
              title="广告数据 (CSV)" color="#F97316" icon="📈"
              fileRef={adFileRef} accept=".csv" data={adData}
              matched={matchedAd} 
              matchText={matchedAd ? `曝光${matchedAd.ad_impressions?.toLocaleString()} 花费Rp${(matchedAd.ad_spend/1000).toFixed(0)}k` : null}
              onUpload={onAdUpload}
            />
          </div>

          {/* 消息 */}
          {uploadMessage && (
            <div style={{ marginBottom: '16px', padding: '14px 18px', borderRadius: '12px', background: uploadMessage.includes('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: uploadMessage.includes('✓') ? '#10B981' : '#F87171', fontSize: '13px' }}>
              {uploadMessage}
            </div>
          )}

          {/* 数据预览 - 26列完整版 */}
          {hasAnyData && <DataPreviewFull sku={sku} matchedShop={matchedShop} matchedAd={matchedAd} />}
        </div>
        
        <div style={{ padding: '20px 28px', borderTop: '1px solid #E8E8ED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#999' }}>数据将导入到 Day {selectedDayNumber}</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={styles.buttonSecondary}>取消</button>
            <button onClick={onImport} disabled={!hasAnyData || uploadLoading} style={{ ...styles.buttonPrimary, opacity: hasAnyData ? 1 : 0.5, cursor: hasAnyData ? 'pointer' : 'not-allowed' }}>
              {uploadLoading ? '导入中...' : '导入数据'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// 异常上报弹窗
// =============================================
export const AbnormalModal = ({ abnormalReason, setAbnormalReason, onClose, onSubmit }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)', borderRadius: '20px', padding: '28px', width: '420px', border: '1px solid #E0E0E5' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333', fontWeight: '700' }}>上报异常</h3>
      <textarea value={abnormalReason} onChange={(e) => setAbnormalReason(e.target.value)} placeholder="请说明异常原因..." style={{ width: '100%', height: '120px', background: '#F5F5F7', border: '1px solid #E0E0E5', borderRadius: '12px', padding: '14px', fontSize: '14px', color: '#333', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
        <button onClick={onClose} style={styles.buttonSecondary}>取消</button>
        <button onClick={onSubmit} style={{ ...styles.buttonPrimary, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>提交</button>
      </div>
    </div>
  </div>
);

// =============================================
// 辅助组件
// =============================================
const InputField = ({ label, type = 'text', value, onChange, placeholder, step }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '8px' }}>{label}</label>
    <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '14px', background: '#E8E8ED', border: '1px solid #E0E0E5', borderRadius: '10px', fontSize: '14px', color: '#333', outline: 'none', boxSizing: 'border-box' }} />
  </div>
);

const UploadBox = ({ title, color, icon, fileRef, accept, data, matched, matchText, onUpload }) => (
  <div>
    <div style={{ fontSize: '13px', fontWeight: '600', color, marginBottom: '10px' }}>{icon} {title}</div>
    <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${color}40`, borderRadius: '14px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: data ? `${color}10` : 'rgba(255,255,255,0.02)', minHeight: '100px' }}>
      <input ref={fileRef} type="file" accept={accept} onChange={onUpload} style={{ display: 'none' }} />
      {data ? (
        <div>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '12px', color, fontWeight: '600' }}>{data.length} 个产品</div>
          {matched && <div style={{ fontSize: '11px', color, marginTop: '6px', opacity: 0.8 }}>匹配: {matchText}</div>}
          {!matched && data.length > 0 && <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '6px' }}>⚠ SKU未匹配</div>}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.5 }}>{icon}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>点击上传</div>
        </div>
      )}
    </div>
  </div>
);

// 26列完整数据预览
const DataPreviewFull = ({ sku, matchedShop, matchedAd }) => {
  // 店铺数据分组
  const shopGroups = [
    {
      title: '📊 流量数据',
      color: '#3B82F6',
      items: [
        { label: '访客', value: matchedShop?.visitors || 0 },
        { label: '浏览', value: matchedShop?.page_views || 0 },
        { label: '未购', value: matchedShop?.visitors_no_buy || 0 },
        { label: '点击', value: matchedShop?.clicks || 0 },
        { label: '收藏', value: matchedShop?.likes || 0 },
      ]
    },
    {
      title: '🛒 加购数据',
      color: '#F59E0B',
      items: [
        { label: '加购人', value: matchedShop?.cart_visitors || 0 },
        { label: '加购数', value: matchedShop?.add_to_cart || 0 },
        { label: '加购率', value: `${matchedShop?.cart_rate || 0}%` },
      ]
    },
    {
      title: '📦 下单数据',
      color: '#10B981',
      items: [
        { label: '下单人', value: matchedShop?.orders_created || 0 },
        { label: '下单件', value: matchedShop?.items_created || 0 },
        { label: '下单额', value: `Rp${((matchedShop?.revenue_created || 0)/1000).toFixed(0)}k` },
        { label: '转化率', value: `${matchedShop?.conversion_rate || 0}%` },
      ]
    },
    {
      title: '🚚 发货数据',
      color: '#8B5CF6',
      items: [
        { label: '发货人', value: matchedShop?.orders_ready || 0 },
        { label: '发货件', value: matchedShop?.items_ready || 0 },
        { label: '发货额', value: `Rp${((matchedShop?.revenue_ready || 0)/1000).toFixed(0)}k` },
        { label: '发货比', value: `${matchedShop?.ready_created_rate || 0}%` },
      ]
    }
  ];

  // 广告数据
  const adItems = [
    { label: '广告曝光', value: (matchedAd?.ad_impressions || 0).toLocaleString(), color: '#F97316' },
    { label: '广告点击', value: matchedAd?.ad_clicks || 0, color: '#F97316' },
    { label: 'CTR', value: `${matchedAd?.ad_ctr || 0}%`, color: '#F97316' },
    { label: '广告单', value: matchedAd?.ad_conversions || 0, color: '#F97316' },
    { label: '广告花费', value: `Rp${((matchedAd?.ad_spend || 0)/1000).toFixed(0)}k`, color: '#EF4444' },
    { label: '广告收入', value: `Rp${((matchedAd?.ad_revenue || 0)/1000).toFixed(0)}k`, color: '#10B981' },
    { label: 'ROI', value: matchedAd?.ad_roi?.toFixed(2) || '-', color: (matchedAd?.ad_roi || 0) >= 3 ? '#10B981' : '#F59E0B' },
  ];
  
  return (
    <div style={{ background: '#F5F5F7', borderRadius: '14px', padding: '18px', border: '1px solid #E8E8ED' }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
        📋 数据预览 (SKU: {sku})
      </div>
      
      {/* 店铺数据 */}
      {matchedShop && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#999', marginBottom: '10px', fontWeight: '600' }}>店铺数据 (26列)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {shopGroups.map((group, gi) => (
              <div key={gi} style={{ background: `${group.color}10`, borderRadius: '10px', padding: '12px', border: `1px solid ${group.color}30` }}>
                <div style={{ fontSize: '10px', color: group.color, fontWeight: '600', marginBottom: '8px' }}>{group.title}</div>
                {group.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#666' }}>{item.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#333' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 广告数据 */}
      {matchedAd && (
        <div>
          <div style={{ fontSize: '11px', color: '#999', marginBottom: '10px', fontWeight: '600' }}>📢 广告数据</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {adItems.map((item, i) => (
              <div key={i} style={{ background: '#F5F5F7', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: '#999', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



