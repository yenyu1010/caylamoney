import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart, Wallet, DollarSign, TrendingUp, Calendar, History, 
  TrendingDown, Plus, X, Save, ChevronDown, ChevronUp, 
  Trash2, Edit, User, Users, LogOut, ArrowRight, Activity, Percent, RefreshCw, Globe, Link as LinkIcon
} from 'lucide-react';

// --- 模擬資料與預設值 ---

const INITIAL_USERS = [
  { id: 'u1', name: '楠仔' },
  { id: 'u2', name: '家人A' }
];

// 假資料 - 資產 (預設加入 MoneyDJ 網址欄位)
const INITIAL_ASSETS = [
  {
    id: '1',
    userId: 'u1',
    ticker: 'QDTE',
    name: 'Roundhill S&P 500 0DTE',
    type: 'ETF',
    frequency: 'Weekly',
    currency: 'USD',
    avgCost: 33.13,
    shares: 50,
    currentPrice: 34.95,
    totalCost: 1647.30,
    totalCostTWD: 53537,
    transactions: [
      { id: 't1', date: '2024-12-01', price: 32.5, units: 20, rate: 32.5 },
      { id: 't2', date: '2025-01-15', price: 33.55, units: 30, rate: 32.6 }
    ]
  },
  {
    id: '2',
    userId: 'u1',
    ticker: 'GOOG',
    name: 'Alphabet Inc.',
    type: 'Stock',
    frequency: 'Individual', 
    currency: 'USD',
    avgCost: 172.52,
    shares: 5,
    currentPrice: 315.12,
    totalCost: 862.60,
    totalCostTWD: 28034,
    transactions: [
       { id: 't3', date: '2024-06-20', price: 172.52, units: 5, rate: 32.5 }
    ]
  },
  {
    id: '3',
    userId: 'u2',
    ticker: 'Allianz-Income',
    name: '安聯收益成長基金-AM穩定月收',
    type: 'Fund',
    frequency: 'Monthly',
    currency: 'USD',
    exchangeRate: 31.29,
    avgCost: 8.38,
    shares: 4775.944,
    currentPrice: 8.51,
    totalCost: 40022.41,
    totalCostTWD: 1200000,
    // 這裡預設一個 MoneyDJ 網址作為範例
    dataUrl: 'https://www.moneydj.com/funddj/ya/yp010001.djhtm?a=TLZ64', 
    transactions: [
       { id: 't4', date: '2023-01-10', price: 8.38, units: 4775.944, rate: 29.9 }
    ]
  }
];

// 假資料 - 配息
const INITIAL_DIVIDENDS = [
  {
    id: 'd1',
    userId: 'u1',
    assetId: '1',
    ticker: 'QDTE',
    exDate: '2025-05-08',
    payDate: '2025-05-12',
    amountPerShare: 0.31,
    shares: 30,
    grossAmount: 9.30,
    tax: 2.79,
    netAmount: 6.51,
    netAmountTWD: 211,
    frequency: 'Weekly'
  },
  {
    id: 'd2',
    userId: 'u2',
    assetId: '3',
    ticker: 'Allianz-Income',
    exDate: '2025-07-15',
    payDate: '2025-08-14',
    amountPerShare: 0.055,
    shares: 2858.672,
    grossAmount: 157.22,
    netAmount: 157.22,
    tax: 0,
    exchangeRate: 30.25,
    netAmountTWD: 4757,
    frequency: 'Monthly'
  }
];

// 假資料 - 已實現損益
const INITIAL_HISTORY = [
  {
    id: 'h1',
    userId: 'u1',
    ticker: 'UNCY',
    name: 'Unicycive Therapeutics',
    sellDate: '2025-06-20',
    sellPrice: 6.00,
    avgBuyPrice: 6.48,
    shares: 130,
    pnl: -62.64,
    pnlPercent: -7.43,
    currency: 'USD'
  }
];

// --- 共用組件 ---

const FrequencyBadge = ({ freq, type }) => {
  const map = {
    'Weekly': { text: '週', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    'Monthly': { text: '月', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'Individual': { text: '個', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    'Stock': { text: '股', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    'ETF': { text: 'E', color: 'bg-green-100 text-green-700 border-green-200' },
    'Fund': { text: '基', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  };
  const config = map[freq] || map[type] || { text: type, color: 'bg-gray-100' };
  return (
    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border ${config.color}`}>
      {config.text}
    </span>
  );
};

// 儀表板卡片樣式
const StatsGrid = ({ items, colorClass = "from-slate-700 to-slate-900" }) => (
  <div className={`bg-gradient-to-br ${colorClass} text-white rounded-2xl p-4 shadow-lg mb-4`}>
     <div className="grid grid-cols-2 gap-y-4 gap-x-4">
        {items.map((item, idx) => (
           <div key={idx} className={idx % 2 !== 0 ? "text-right" : ""}>
              <p className="text-xs text-slate-300 mb-1 opacity-80">{item.label}</p>
              <p className={`font-bold text-lg ${item.valueColor || "text-white"}`}>{item.value}</p>
              {item.subValue && <p className="text-[10px] text-slate-400 mt-0.5">{item.subValue}</p>}
           </div>
        ))}
     </div>
  </div>
);

// --- 子頁面組件 ---

const AssetRow = ({ asset, onSell, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const marketValue = asset.currentPrice * asset.shares;
  const unrealizedPL = marketValue - asset.totalCost;
  const plPercent = (unrealizedPL / asset.totalCost) * 100;
  const isProfit = unrealizedPL >= 0;
  const freq = asset.frequency || 'Individual';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden transition-all hover:shadow-md">
      <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
               <FrequencyBadge freq={freq} />
               {freq === 'Individual' && <FrequencyBadge type={asset.type} />}
            </div>
            <div className="overflow-hidden">
               <h3 className="font-bold text-lg text-slate-800 leading-tight truncate w-32 sm:w-auto">{asset.ticker}</h3>
               <p className="text-xs text-slate-400 truncate w-40">{asset.name}</p>
            </div>
          </div>
          <div className="text-right">
             <p className="font-mono font-bold text-slate-800">${asset.currentPrice.toFixed(2)}</p>
             <div className={`text-xs font-bold flex items-center justify-end gap-1 ${isProfit ? 'text-red-500' : 'text-green-600'}`}>
                {isProfit ? '+' : ''}{unrealizedPL.toFixed(1)} ({plPercent.toFixed(1)}%)
             </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm mt-3 text-slate-600 border-t border-slate-50 pt-2">
           <div>
             <span className="text-xs text-slate-400 block">持有</span>
             <span className="font-medium">{asset.shares.toLocaleString()}</span>
           </div>
           <div>
             <span className="text-xs text-slate-400 block">均價</span>
             <span className="font-medium">${asset.avgCost.toFixed(2)}</span>
           </div>
           <div className="text-right">
             <span className="text-xs text-slate-400 block">總值 (USD)</span>
             <span className="font-bold">${marketValue.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
           </div>
           <div className="text-slate-400">
             {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
           </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-100 p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex gap-2 mb-4">
             <button onClick={(e) => { e.stopPropagation(); onSell(asset); }} className="flex-1 bg-white text-red-600 border border-red-200 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-red-50 shadow-sm"><LogOut size={16}/> 賣出</button>
             <button onClick={(e) => { e.stopPropagation(); onEdit(asset); }} className="flex-1 bg-white text-slate-600 border border-slate-200 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-white shadow-sm"><Edit size={16}/> 修改</button>
             <button onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }} className="w-10 bg-white text-slate-400 border border-slate-200 rounded-lg flex items-center justify-center hover:text-red-500 hover:border-red-200 shadow-sm"><Trash2 size={16}/></button>
          </div>
          {/* 顯示資料來源 (如果有) */}
          {asset.dataUrl && (
             <div className="mb-3 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700 flex items-center gap-2 truncate">
                <LinkIcon size={12}/> 資料來源: {asset.dataUrl}
             </div>
          )}
          <div>
            <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">購入紀錄</p>
            {asset.transactions && asset.transactions.length > 0 ? (
              <div className="space-y-2">
                {asset.transactions.map((tx, idx) => (
                  <div key={tx.id || idx} className="flex justify-between items-center text-sm bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-500 text-xs font-medium">{tx.date}</span>
                    <span className="font-mono text-slate-700 font-bold">{tx.units} 單位 @ ${tx.price}</span>
                    <span className="text-slate-400 text-xs bg-slate-100 px-1.5 rounded">匯 {tx.rate}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-xs text-slate-400 py-2 italic">無詳細紀錄</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const DividendGroup = ({ ticker, dividends, onDelete, onEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const totalNet = dividends.reduce((acc, curr) => acc + (curr.netAmount || 0), 0);
  const totalNetTWD = dividends.reduce((acc, curr) => acc + (curr.netAmountTWD || 0), 0);
  const freq = dividends[0]?.frequency || 'Individual';
  const lastDate = dividends.length > 0 ? dividends[0].payDate : '';

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 bg-white flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
           <FrequencyBadge freq={freq} />
           <div>
             <div className="flex items-center gap-2">
               <span className="font-bold text-slate-800">{ticker}</span>
               <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{dividends.length} 筆</span>
             </div>
             <p className="text-xs text-slate-400 mt-0.5">最近: {lastDate}</p>
           </div>
        </div>
        <div className="text-right">
           <p className="font-bold text-blue-600">${totalNet.toFixed(2)}</p>
           {totalNetTWD > 0 && <p className="text-xs text-slate-400">NT$ {totalNetTWD.toLocaleString()}</p>}
        </div>
      </div>
      {isOpen && (
        <div className="bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-1">
          {dividends.map(div => (
            <div key={div.id} className="p-3 border-b border-slate-100 last:border-0 flex justify-between items-center group hover:bg-slate-100 transition-colors">
               <div>
                  <p className="text-xs font-bold text-slate-600">{div.exDate} (除息)</p>
                  <p className="text-xs text-slate-400 mt-0.5">{div.shares} × ${div.amountPerShare} {div.tax > 0 && <span className="text-red-400 ml-1"> (稅 ${div.tax.toFixed(2)})</span>}</p>
               </div>
               <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-slate-700 font-medium">${div.netAmount.toFixed(2)}</span>
                  <div className="flex gap-1"> 
                    <button onClick={() => onEdit(div)} className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-blue-600 shadow-sm"><Edit size={12}/></button>
                    <button onClick={() => onDelete(div.id)} className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-red-600 shadow-sm"><Trash2 size={12}/></button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- MODAL 組件 ---

const UserManageModal = ({ isOpen, onClose, users, setUsers, currentUserId }) => {
  const [newUserName, setNewUserName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const handleAdd = () => { if(!newUserName.trim()) return; setUsers([...users, { id: Date.now().toString(), name: newUserName }]); setNewUserName(''); };
  const startEdit = (user) => { setEditingId(user.id); setEditName(user.name); };
  const saveEdit = () => { setUsers(users.map(u => u.id === editingId ? { ...u, name: editName } : u)); setEditingId(null); };
  if(!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
        <div className="p-3 bg-slate-900 text-white flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Users size={16}/> 成員管理</h3><button onClick={onClose}><X size={18}/></button></div>
        <div className="p-4 space-y-3">
           <div className="flex gap-2"><input value={newUserName} onChange={e => setNewUserName(e.target.value)} className="flex-1 border border-slate-200 rounded px-2 py-1 text-sm" placeholder="新成員名稱"/><button onClick={handleAdd} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">新增</button></div>
           <div className="space-y-2 max-h-60 overflow-y-auto">
             {users.map(u => (
               <div key={u.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                 {editingId === u.id ? (<div className="flex gap-2 w-full"><input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 border border-blue-300 rounded px-1 text-sm"/><button onClick={saveEdit} className="text-green-600"><Save size={16}/></button></div>) : (<><span className="font-medium text-slate-700">{u.name}</span><button onClick={() => startEdit(u)} className="text-slate-400 hover:text-blue-600"><Edit size={14}/></button></>)}
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 真實數據更新 Logic ---
const fetchStockPrice = async (ticker) => {
  try {
    // 透過 Proxy 呼叫 Yahoo Finance
    const proxyUrl = `https://corsproxy.io/?`; 
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
    const data = await response.json();
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price || null;
  } catch (e) {
    console.error(`Failed to fetch ${ticker}`, e);
    return null;
  }
};

const fetchMoneyDJFund = async (url) => {
  try {
    // 透過 Proxy 抓取 MoneyDJ 網頁 HTML
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (data.contents) {
      // 解析 HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      
      // 模仿 IMPORTHTML("url", "table", 5) 的邏輯
      // MoneyDJ 的淨值通常在一個特定的 table 裡，這裡我們嘗試抓取 "淨值" 關鍵字附近的數字
      // 或者抓取頁面上最大的價格數字 (比較粗略但通用)
      
      // 針對 MoneyDJ 的 DOM 結構嘗試抓取 (通常 ID 為 "cp_0_ctl00_lblNav" 或類似結構)
      // 如果是用 table 5，我們嘗試抓取所有 table
      const tables = doc.querySelectorAll('table');
      // 嘗試找第 5 個 table (index 4)
      if(tables.length > 4) {
          const targetTable = tables[4];
          // 假設淨值在第一行第二列 (範例)
          const cells = targetTable.querySelectorAll('td');
          // 這裡需要根據 MoneyDJ 實際結構調整，這裡做一個簡單的 regex 搜尋整個頁面比較保險
      }

      // 更通用的抓法：直接在 body 文字中找 "淨值 :" 後面的數字
      const bodyText = doc.body.innerText;
      const match = bodyText.match(/淨值[\s\S]*?(\d+\.?\d*)/); // 簡單的正則表達式
      if (match && match[1]) {
        return parseFloat(match[1]);
      }
      
      // 備用方案：MoneyDJ 基金頁面通常有 ID="Ctl00_ContentPlaceHolder1_lblNav"
      const navElement = doc.getElementById('Ctl00_ContentPlaceHolder1_lblNav');
      if (navElement) return parseFloat(navElement.innerText);
    }
    return null;
  } catch (e) {
    console.error("Failed to scrape MoneyDJ", e);
    return null;
  }
};

const UpdatePriceModal = ({ isOpen, onClose, assets, onUpdatePrices }) => {
  const [localPrices, setLocalPrices] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if(isOpen && assets) {
      const initial = {};
      assets.forEach(a => initial[a.id] = a.currentPrice);
      setLocalPrices(initial);
      setLogs([]);
    }
  }, [isOpen, assets]);

  const handleInputChange = (id, val) => {
    setLocalPrices(prev => ({...prev, [id]: parseFloat(val) || 0}));
  };

  const saveChanges = () => { onUpdatePrices(localPrices); onClose(); };

  // --- 真實抓取功能 ---
  const startRealFetch = async () => {
    setIsUpdating(true);
    setLogs(prev => [...prev, "開始連線更新..."]);
    
    const newPrices = { ...localPrices };
    
    for (const asset of assets) {
      setLogs(prev => [...prev, `正在更新: ${asset.ticker}...`]);
      let price = null;

      // 1. 如果有 MoneyDJ 網址，優先爬蟲
      if (asset.dataUrl && asset.dataUrl.includes('moneydj')) {
         price = await fetchMoneyDJFund(asset.dataUrl);
      } 
      // 2. 如果是美股/ETF，嘗試 Yahoo Finance
      else if (asset.type === 'Stock' || asset.type === 'ETF') {
         price = await fetchStockPrice(asset.ticker);
      }

      if (price) {
        newPrices[asset.id] = price;
        setLogs(prev => [...prev, `✅ ${asset.ticker} 更新成功: ${price}`]);
      } else {
        setLogs(prev => [...prev, `❌ ${asset.ticker} 更新失敗 (請手動輸入)`]);
      }
      // 稍微延遲避免被鎖 IP
      await new Promise(r => setTimeout(r, 500));
    }

    setLocalPrices(newPrices);
    setIsUpdating(false);
    setLogs(prev => [...prev, "更新完成！"]);
  };

  if(!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
           <h3 className="font-bold flex items-center gap-2"><Globe size={18}/> 更新現有市價</h3>
           <button onClick={onClose}><X size={20}/></button>
        </div>
        
        <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
           <p className="text-xs text-slate-500">透過 Proxy 連網抓取</p>
           <button 
             onClick={startRealFetch} 
             disabled={isUpdating}
             className={`text-xs border px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-all ${isUpdating ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'}`}
           >
             <RefreshCw size={12} className={isUpdating ? "animate-spin" : ""}/> 
             {isUpdating ? "抓取中..." : "一鍵更新 (真實)"}
           </button>
        </div>

        {/* 顯示 Log */}
        {logs.length > 0 && (
          <div className="bg-gray-900 text-green-400 text-[10px] p-2 max-h-20 overflow-y-auto font-mono">
            {logs.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        )}

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
           {assets.map(asset => (
             <div key={asset.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                <div>
                   <p className="font-bold text-slate-700">{asset.ticker}</p>
                   <p className="text-xs text-slate-400 truncate w-24">{asset.name}</p>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-xs text-slate-400">現價 $</span>
                   <input 
                     type="number" 
                     className="w-24 border border-slate-200 rounded p-1 text-right font-mono font-bold text-slate-800 focus:border-blue-500 outline-none"
                     value={localPrices[asset.id] || ''}
                     onChange={(e) => handleInputChange(asset.id, e.target.value)}
                   />
                </div>
             </div>
           ))}
        </div>

        <div className="p-4 border-t border-slate-100">
           <button onClick={saveChanges} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-transform">
             確認儲存
           </button>
        </div>
      </div>
    </div>
  );
};

// ... (以下為與之前相同的 Modal: SellModal, AddAssetModal, AddDividendModal) ...
// 為了完整性，這裡需要重新包含這些 Modal，但 AddAssetModal 需要增加 dataUrl 欄位

const SellModal = ({ isOpen, onClose, asset, onConfirm }) => {
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  useEffect(() => { if(asset) { setQty(asset.shares); setPrice(asset.currentPrice); } }, [asset]);
  const handleConfirm = () => { if(!qty || !price) return; onConfirm(asset.id, parseFloat(qty), parseFloat(price), date); onClose(); };
  if (!isOpen || !asset) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-4 bg-red-600 text-white flex justify-between items-center"><h3 className="font-bold">賣出: {asset.ticker}</h3><button onClick={onClose}><X size={20}/></button></div>
        <div className="p-4 space-y-4">
          <div className="bg-red-50 p-3 rounded text-sm text-red-800">持有: {asset.shares} / 均價: ${asset.avgCost}</div>
          <div className="grid grid-cols-2 gap-3">
             <div><label className="text-xs text-slate-500 mb-1 block">數量</label><input type="number" value={qty} onChange={e => setQty(e.target.value)} className="w-full border p-2 rounded"/></div>
             <div><label className="text-xs text-slate-500 mb-1 block">單價 ($)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full border p-2 rounded"/></div>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">日期</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border p-2 rounded"/></div>
          <button onClick={handleConfirm} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold mt-2 shadow-lg hover:bg-red-700">確認賣出</button>
        </div>
      </div>
    </div>
  );
};

// 更新 AddAssetModal 以支援輸入 Data URL
const AddAssetModal = ({ isOpen, onClose, onSave, editingAsset }) => {
  const [formData, setFormData] = useState({ ticker: '', type: 'Stock', frequency: 'Individual', buyDate: new Date().toISOString().split('T')[0], units: '', unitPrice: '', exchangeRate: '32.5', dataUrl: '' });
  useEffect(() => {
    if(editingAsset) setFormData({ ticker: editingAsset.ticker, type: editingAsset.type, frequency: editingAsset.frequency || 'Individual', buyDate: new Date().toISOString().split('T')[0], units: editingAsset.shares, unitPrice: editingAsset.avgCost, exchangeRate: '32.5', dataUrl: editingAsset.dataUrl || '' });
    else setFormData({ ticker: '', type: 'Stock', frequency: 'Individual', buyDate: new Date().toISOString().split('T')[0], units: '', unitPrice: '', exchangeRate: '32.5', dataUrl: '' });
  }, [editingAsset, isOpen]);
  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
  const handleSave = (addNext) => { if(!formData.ticker || !formData.units) return; onSave(formData, editingAsset?.id); if(addNext) { setFormData(prev => ({...prev, ticker: '', units: '', unitPrice: '', dataUrl: ''})); alert("已儲存"); } else { onClose(); } };
  if(!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center"><h3 className="font-bold">{editingAsset ? '修改' : '新增'}資產</h3><button onClick={onClose}><X size={20}/></button></div>
        <div className="p-4 space-y-3 overflow-y-auto">
           <div className="grid grid-cols-2 gap-3">
             <div className="col-span-2"><label className="text-xs text-slate-500 mb-1 block">代碼</label><input name="ticker" value={formData.ticker} onChange={handleChange} className="w-full border p-2 rounded uppercase font-bold" disabled={!!editingAsset}/></div>
             <div><label className="text-xs text-slate-500 mb-1 block">類別</label><select name="type" value={formData.type} onChange={handleChange} className="w-full border p-2 rounded"><option value="Stock">個股</option><option value="ETF">ETF</option><option value="Fund">基金</option></select></div>
             <div><label className="text-xs text-slate-500 mb-1 block">頻率</label><select name="frequency" value={formData.frequency} onChange={handleChange} className="w-full border p-2 rounded"><option value="Individual">不固定</option><option value="Weekly">週配</option><option value="Monthly">月配</option><option value="Quarterly">季配</option></select></div>
             <div><label className="text-xs text-slate-500 mb-1 block">單位</label><input type="number" name="units" value={formData.units} onChange={handleChange} className="w-full border p-2 rounded" /></div>
             <div><label className="text-xs text-slate-500 mb-1 block">成本</label><input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleChange} className="w-full border p-2 rounded" /></div>
             <div className="col-span-2"><label className="text-xs text-slate-500 mb-1 block">日期</label><input type="date" name="buyDate" value={formData.buyDate} onChange={handleChange} className="w-full border p-2 rounded" /></div>
             <div className="col-span-2">
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><LinkIcon size={10}/> MoneyDJ 網址 (選填，用於抓取基金淨值)</label>
                <input name="dataUrl" value={formData.dataUrl} onChange={handleChange} className="w-full border p-2 rounded text-xs text-blue-600" placeholder="https://www.moneydj.com/..." />
             </div>
           </div>
        </div>
        <div className="p-4 border-t flex gap-2">{!editingAsset && <button onClick={() => handleSave(true)} className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg text-sm font-bold">儲存並新增下一筆</button>}<button onClick={() => handleSave(false)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold">儲存</button></div>
      </div>
    </div>
  );
};

const AddDividendModal = ({ isOpen, onClose, onSave, assets, editingDividend }) => {
  const [formData, setFormData] = useState({ ticker: '', exDate: '', dividendPerShare: '', units: '', isTaxable: true });
  useEffect(() => {
    if(editingDividend) setFormData({ ticker: editingDividend.ticker, exDate: editingDividend.exDate, dividendPerShare: editingDividend.amountPerShare, units: editingDividend.shares, isTaxable: editingDividend.tax > 0 });
    else setFormData({ ticker: '', exDate: new Date().toISOString().split('T')[0], dividendPerShare: '', units: '', isTaxable: true });
  }, [editingDividend, isOpen]);
  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };
  const handleTickerChange = (e) => { const val = e.target.value.toUpperCase(); const asset = assets.find(a => a.ticker === val); setFormData(prev => ({...prev, ticker: val, units: asset ? asset.shares : prev.units})); };
  const handleSave = (addNext) => { if(!formData.ticker || !formData.dividendPerShare) return; onSave(formData, editingDividend?.id); if(addNext) { setFormData(prev => ({...prev, dividendPerShare: '', ticker: ''})); alert("已儲存"); } else { onClose(); } };
  if(!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center rounded-t-2xl"><h3 className="font-bold">{editingDividend ? '修改' : '新增'}配息</h3><button onClick={onClose}><X size={20}/></button></div>
        <div className="p-4 space-y-3">
           <div><label className="text-xs text-slate-500 mb-1 block">代碼</label><input list="tickers" value={formData.ticker} onChange={handleTickerChange} className="w-full border p-2 rounded uppercase font-bold" placeholder="輸入代碼..."/><datalist id="tickers">{assets.map(a => <option key={a.id} value={a.ticker}/>)}</datalist></div>
           <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500 mb-1 block">除息日</label><input type="date" name="exDate" value={formData.exDate} onChange={handleChange} className="w-full border p-2 rounded"/></div>
              <div><label className="text-xs text-slate-500 mb-1 block">單位</label><input type="number" name="units" value={formData.units} onChange={handleChange} className="w-full border p-2 rounded"/></div>
              <div><label className="text-xs text-slate-500 mb-1 block">每股配息</label><input type="number" name="dividendPerShare" value={formData.dividendPerShare} onChange={handleChange} className="w-full border p-2 rounded"/></div>
           </div>
           <div className="flex items-center gap-2 mt-2"><input type="checkbox" name="isTaxable" checked={formData.isTaxable} onChange={handleChange} className="w-4 h-4"/><label className="text-sm">預扣 30% 稅</label></div>
           <div className="flex gap-2 mt-4 pt-4 border-t">{!editingDividend && <button onClick={() => handleSave(true)} className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg font-bold text-sm">儲存並新增下一筆</button>}<button onClick={() => handleSave(false)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm">儲存</button></div>
        </div>
      </div>
    </div>
  );
};

// --- 主程式 ---

export default function AssetManager() {
  const [activeTab, setActiveTab] = useState('assets');
  const [users, setUsers] = useState(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState(null); // null = 總覽模式
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Data State
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [dividends, setDividends] = useState(INITIAL_DIVIDENDS);
  const [history, setHistory] = useState(INITIAL_HISTORY);

  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showDividendModal, setShowDividendModal] = useState(false);
  const [editingDividend, setEditingDividend] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedAssetForSell, setSelectedAssetForSell] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);

  // Filter Data based on User
  const displayedAssets = useMemo(() => currentUser ? assets.filter(a => a.userId === currentUser.id) : assets, [assets, currentUser]);
  const displayedDividends = useMemo(() => currentUser ? dividends.filter(d => d.userId === currentUser.id) : dividends, [dividends, currentUser]);
  const displayedHistory = useMemo(() => currentUser ? history.filter(h => h.userId === currentUser.id) : history, [history, currentUser]);

  // Stats Logic
  const assetStats = useMemo(() => {
    const totalInvested = displayedAssets.reduce((sum, a) => sum + a.totalCost, 0);
    const currentMarketValue = displayedAssets.reduce((sum, a) => sum + (a.currentPrice * a.shares), 0);
    const totalDivs = displayedDividends.reduce((sum, d) => sum + d.netAmount, 0);
    const valuePlusDivs = currentMarketValue + totalDivs;
    const roiCurrent = totalInvested > 0 ? ((currentMarketValue - totalInvested) / totalInvested) * 100 : 0;
    const roiTotal = totalInvested > 0 ? ((valuePlusDivs - totalInvested) / totalInvested) * 100 : 0;
    return { totalInvested, currentMarketValue, totalDivs, valuePlusDivs, roiCurrent, roiTotal };
  }, [displayedAssets, displayedDividends]);

  const dividendStats = useMemo(() => {
    const totalReceived = displayedDividends.reduce((sum, d) => sum + d.netAmount, 0);
    const totalReceivedTWD = displayedDividends.reduce((sum, d) => sum + (d.netAmountTWD || 0), 0);
    const estMonthly = totalReceived / 6; 
    const totalCost = displayedAssets.reduce((sum, a) => sum + a.totalCost, 0);
    const yieldRate = totalCost > 0 ? (totalReceived / totalCost) * 100 : 0;
    return { totalReceived, totalReceivedTWD, estMonthly, yieldRate };
  }, [displayedDividends, displayedAssets]);

  const historyStats = useMemo(() => {
    const totalPnL = displayedHistory.reduce((sum, h) => sum + h.pnl, 0);
    const totalHistoryCost = displayedHistory.reduce((sum, h) => sum + (h.avgBuyPrice * h.shares), 0);
    const totalRoi = totalHistoryCost > 0 ? (totalPnL / totalHistoryCost) * 100 : 0;
    return { totalPnL, totalRoi };
  }, [displayedHistory]);

  // Actions
  const handleSaveAsset = (data, editId) => {
    const userId = currentUser ? currentUser.id : users[0].id;
    if(editId) {
       setAssets(prev => prev.map(a => a.id === editId ? { ...a, ...data, shares: parseFloat(data.units), avgCost: parseFloat(data.unitPrice), totalCost: parseFloat(data.units)*parseFloat(data.unitPrice) } : a));
    } else {
       const newAsset = {
         id: Date.now().toString(),
         userId,
         ...data,
         shares: parseFloat(data.units),
         avgCost: parseFloat(data.unitPrice),
         currentPrice: parseFloat(data.unitPrice),
         totalCost: parseFloat(data.units) * parseFloat(data.unitPrice),
         transactions: [ { id: Date.now().toString(), date: data.buyDate, price: data.unitPrice, units: data.units, rate: data.exchangeRate } ]
       };
       setAssets(prev => [...prev, newAsset]);
    }
  };

  const handleSellAsset = (id, qty, price, date) => {
    const asset = assets.find(a => a.id === id);
    if(!asset) return;
    const costBasis = asset.avgCost * qty;
    const sellValue = price * qty;
    const pnl = sellValue - costBasis;
    const pnlPercent = (pnl / costBasis) * 100;
    const newHistory = { id: Date.now().toString(), userId: asset.userId, ticker: asset.ticker, name: asset.name, sellDate: date, sellPrice: price, avgBuyPrice: asset.avgCost, shares: qty, pnl, pnlPercent, currency: asset.currency };
    setHistory(prev => [newHistory, ...prev]);
    if(qty >= asset.shares) { setAssets(prev => prev.filter(a => a.id !== id)); } 
    else { setAssets(prev => prev.map(a => { if(a.id === id) { const newShares = a.shares - qty; return { ...a, shares: newShares, totalCost: newShares * a.avgCost }; } return a; })); }
  };

  const handleSaveDividend = (data, editId) => {
    const userId = currentUser ? currentUser.id : users[0].id;
    const gross = parseFloat(data.dividendPerShare) * parseFloat(data.units);
    const tax = data.isTaxable ? gross * 0.3 : 0;
    const net = gross - tax;
    const payload = { userId, ticker: data.ticker, exDate: data.exDate, payDate: data.exDate, amountPerShare: parseFloat(data.dividendPerShare), shares: parseFloat(data.units), grossAmount: gross, tax, netAmount: net, netAmountTWD: net * 32.5, frequency: 'Unknown' };
    if(editId) { setDividends(prev => prev.map(d => d.id === editId ? { ...d, ...payload } : d)); } 
    else { setDividends(prev => [{ ...payload, id: Date.now().toString() }, ...prev]); }
  };

  const handleUpdatePrices = (newPriceMap) => {
    setAssets(prev => prev.map(a => {
      if(newPriceMap[a.id] !== undefined) return { ...a, currentPrice: newPriceMap[a.id] };
      return a;
    }));
  };

  const groupedDividends = useMemo(() => {
    const groups = {};
    displayedDividends.forEach(d => { if(!groups[d.ticker]) groups[d.ticker] = []; groups[d.ticker].push(d); });
    Object.keys(groups).forEach(key => { groups[key].sort((a,b) => new Date(b.exDate) - new Date(a.exDate)); });
    return groups;
  }, [displayedDividends]);

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen flex flex-col font-sans text-slate-900 pb-24 relative">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex justify-between items-center shadow-sm sticky top-0 z-20">
         <div className="flex items-center gap-2" onClick={() => setShowUserModal(true)}>
            <div className={`p-2 rounded-full ${currentUser ? 'bg-blue-100 text-blue-600' : 'bg-slate-800 text-white'}`}><User size={20}/></div>
            <div><p className="text-xs text-slate-400">目前檢視</p><div className="font-bold text-slate-800 flex items-center gap-1 cursor-pointer">{currentUser ? currentUser.name : '總覽 (所有人)'}<ChevronDown size={14}/></div></div>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setCurrentUser(null)} className={`px-3 py-1 rounded-md text-xs font-bold ${!currentUser ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>總覽</button>
            {users.map(u => (<button key={u.id} onClick={() => setCurrentUser(u)} className={`px-3 py-1 rounded-md text-xs font-bold ${currentUser?.id === u.id ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>{u.name}</button>))}
         </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'assets' && (
          <div className="space-y-4">
            <StatsGrid 
              colorClass="from-slate-800 to-slate-900"
              items={[
                { label: '總投入金額 (USD)', value: `$${assetStats.totalInvested.toLocaleString()}`, valueColor: 'text-white' },
                { label: '現值總額 (USD)', value: `$${assetStats.currentMarketValue.toLocaleString()}`, valueColor: 'text-blue-300' },
                { label: '現值投報率', value: `${assetStats.roiCurrent.toFixed(2)}%`, valueColor: assetStats.roiCurrent >= 0 ? 'text-red-400' : 'text-green-400' },
                { label: '含息總投報率', value: `${assetStats.roiTotal.toFixed(2)}%`, valueColor: assetStats.roiTotal >= 0 ? 'text-red-400' : 'text-green-400', subValue: `(含息 $${assetStats.valuePlusDivs.toLocaleString()})` },
              ]}
            />
            <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2"><h2 className="font-bold text-lg text-slate-800">持倉明細</h2><button onClick={() => setShowPriceModal(true)} className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"><RefreshCw size={12} /> 更新市價</button></div>
               <button onClick={() => { setEditingAsset(null); setShowAssetModal(true); }} className="bg-blue-600 text-white p-2 rounded-full shadow-lg"><Plus size={20}/></button>
            </div>
            {displayedAssets.length === 0 ? <div className="text-center text-slate-400 py-10">尚無資產</div> : displayedAssets.map(asset => (<AssetRow key={asset.id} asset={asset} onSell={() => { setSelectedAssetForSell(asset); setShowSellModal(true); }} onDelete={(id) => setAssets(prev => prev.filter(a => a.id !== id))} onEdit={(asset) => { setEditingAsset(asset); setShowAssetModal(true); }}/>))}
          </div>
        )}

        {/* ... (Dividends & History Tabs are same as previous, omitted for brevity but logic is preserved in state) ... */}
        {activeTab === 'dividends' && (
           <div className="space-y-4">
             <StatsGrid colorClass="from-blue-600 to-blue-800" items={[{ label: '已配息金額', value: `$${dividendStats.totalReceived.toLocaleString()}`, subValue: `≈ NT$ ${dividendStats.totalReceivedTWD.toLocaleString()}` }, { label: '預估月配', value: `$${dividendStats.estMonthly.toFixed(0)}` }, { label: '配息投報率', value: `${dividendStats.yieldRate.toFixed(2)}%` }, { label: '筆數', value: `${displayedDividends.length}` }]} />
             <div className="flex justify-between items-center mb-2"><h2 className="font-bold text-lg text-slate-800">配息明細</h2><button onClick={() => { setEditingDividend(null); setShowDividendModal(true); }} className="bg-blue-600 text-white p-2 rounded-full shadow-lg"><Plus size={20}/></button></div>
             {Object.keys(groupedDividends).length === 0 ? <div className="text-center text-slate-400 py-10">尚無配息</div> : Object.entries(groupedDividends).map(([ticker, divs]) => (<DividendGroup key={ticker} ticker={ticker} dividends={divs} onDelete={(id) => setDividends(prev => prev.filter(d => d.id !== id))} onEdit={(div) => { setEditingDividend(div); setShowDividendModal(true); }}/>))}
           </div>
        )}
        {activeTab === 'history' && (
           <div className="space-y-4">
              <div className="bg-gradient-to-br from-gray-700 to-gray-900 text-white rounded-2xl p-4 shadow-lg mb-4"><div className="flex justify-between items-center"><div><p className="text-slate-300 text-xs mb-1">已實現總損益</p><h2 className={`text-3xl font-bold ${historyStats.totalPnL >= 0 ? 'text-red-400' : 'text-green-400'}`}>{historyStats.totalPnL >= 0 ? '+' : ''}{historyStats.totalPnL.toFixed(2)}</h2></div><div className="text-right"><p className="text-slate-300 text-xs mb-1">總報酬率</p><p className={`text-xl font-bold ${historyStats.totalRoi >= 0 ? 'text-red-400' : 'text-green-400'}`}>{historyStats.totalRoi >= 0 ? '+' : ''}{historyStats.totalRoi.toFixed(2)}%</p></div></div></div>
              <h2 className="font-bold text-lg text-slate-800 mb-2">交易紀錄</h2>
              {displayedHistory.length === 0 ? <div className="text-center text-slate-400 py-10">尚無紀錄</div> : displayedHistory.map(item => (<div key={item.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm mb-2"><div><div className="flex items-center gap-2"><h4 className="font-bold text-slate-700">{item.ticker}</h4><span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-slate-500">{item.sellDate}</span></div><p className="text-xs text-slate-400 mt-1">成本 {item.avgBuyPrice} → 賣出 {item.sellPrice} × {item.shares}</p></div><div className="text-right"><p className={`font-bold ${item.pnl >= 0 ? 'text-red-500' : 'text-green-600'}`}>{item.pnl >= 0 ? '+' : ''}{item.pnl.toFixed(2)}</p><div className="flex items-center justify-end gap-2 mt-1"><span className={`text-xs ${item.pnl >= 0 ? 'text-red-400' : 'text-green-400'}`}>{item.pnlPercent.toFixed(2)}%</span><button onClick={() => setHistory(prev => prev.filter(h => h.id !== item.id))} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14}/></button></div></div></div>))}
           </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-around items-center z-20 max-w-md mx-auto">
        <button onClick={() => setActiveTab('assets')} className={`flex flex-col items-center p-2 rounded-lg w-16 transition-colors ${activeTab === 'assets' ? 'text-blue-600' : 'text-slate-400'}`}><Wallet size={24} /><span className="text-[10px] font-bold mt-1">資產庫</span></button>
        <button onClick={() => setActiveTab('dividends')} className={`flex flex-col items-center p-2 rounded-lg w-16 transition-colors ${activeTab === 'dividends' ? 'text-blue-600' : 'text-slate-400'}`}><DollarSign size={24} /><span className="text-[10px] font-bold mt-1">配息</span></button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center p-2 rounded-lg w-16 transition-colors ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-400'}`}><History size={24} /><span className="text-[10px] font-bold mt-1">已實現</span></button>
      </div>

      <UserManageModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} users={users} setUsers={setUsers} currentUserId={currentUser?.id} />
      <UpdatePriceModal isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} assets={assets} onUpdatePrices={handleUpdatePrices} />
      <AddAssetModal isOpen={showAssetModal} onClose={() => setShowAssetModal(false)} onSave={handleSaveAsset} editingAsset={editingAsset}/>
      <AddDividendModal isOpen={showDividendModal} onClose={() => setShowDividendModal(false)} onSave={handleSaveDividend} assets={assets} editingDividend={editingDividend}/>
      <SellModal isOpen={showSellModal} onClose={() => setShowSellModal(false)} asset={selectedAssetForSell} onConfirm={handleSellAsset}/>
    </div>
  );
}
