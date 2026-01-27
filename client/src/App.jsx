import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UploadCloud, FileText, CheckCircle, AlertTriangle, 
  Download, Loader2, Code, FileJson, ShieldCheck, Zap, Receipt, Plus, History, Trash2
} from 'lucide-react';
import { Card } from './components/ui/Card';

export default function App() {
  // --- 1. INITIALIZE STATE FROM LOCAL STORAGE ---
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem("invoice_history");
      return saved ? JSON.parse(saved) : [];
    } catch  {
      return [];
    }
  });

  const [activeIndex, setActiveIndex] = useState(() => {
    try {
      const saved = localStorage.getItem("active_index");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- 2. SAVE TO LOCAL STORAGE WHENEVER DATA CHANGES ---
  useEffect(() => {
    localStorage.setItem("invoice_history", JSON.stringify(invoices));
    localStorage.setItem("active_index", JSON.stringify(activeIndex));
  }, [invoices, activeIndex]);

  // --- 3. HANDLERS ---
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append('invoice', file);

    try {
      // Ensure this URL matches your backend port (default 5000)
      const res = await axios.post('http://localhost:5000/api/process', formData);
      
      const newInvoice = {
        id: Date.now(),
        fileName: file.name,
        timestamp: new Date().toLocaleTimeString(),
        data: res.data,
      };

      setInvoices(prev => [newInvoice, ...prev]);
      setActiveIndex(0); // Auto-select the new file
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to process invoice");
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = (e, idToDelete) => {
    e.stopPropagation(); // Prevent the row click event from firing
    
    if (window.confirm("Delete this invoice from history?")) {
      const newInvoices = invoices.filter(inv => inv.id !== idToDelete);
      setInvoices(newInvoices);

      // Smart Index Handling:
      // If we deleted the one we were looking at, switch to the first available
      if (activeInvoice && activeInvoice.id === idToDelete) {
        setActiveIndex(newInvoices.length > 0 ? 0 : null);
      } else {
        // If we deleted one above the current view, shift index up by 1 to maintain view
        const indexDeleted = invoices.findIndex(inv => inv.id === idToDelete);
        if (indexDeleted < activeIndex) {
          setActiveIndex(prev => prev - 1);
        }
      }
    }
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all invoice history?")) {
      setInvoices([]);
      setActiveIndex(null);
      localStorage.removeItem("invoice_history");
      localStorage.removeItem("active_index");
    }
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const activeInvoice = invoices[activeIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 flex flex-col">
      
      {/* NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">AutoTally AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              v1.3 Pro Dashboard
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        
        {/* SIDEBAR */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/30 p-6 flex flex-col gap-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          
          {/* New Invoice Button */}
          <div>
            <label className="flex items-center justify-center gap-2 w-full p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer transition-all shadow-lg shadow-blue-900/20 font-medium hover:scale-[1.02]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {loading ? "Processing..." : "New Invoice"}
              <input 
                type="file" 
                onChange={handleUpload}
                disabled={loading}
                className="hidden"
                accept=".pdf, .png, .jpg, .jpeg"
              />
            </label>
            {error && <p className="mt-3 text-sm text-red-400 bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}
          </div>

          {/* History List */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4" /> History
              </h3>
              {invoices.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {invoices.length === 0 ? (
              <div className="text-center py-10 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                No invoices yet
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv, idx) => (
                  <div
                    key={inv.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`group w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 cursor-pointer relative ${
                      activeIndex === idx 
                        ? 'bg-slate-800 border-blue-500/50 shadow-md shadow-blue-900/10' 
                        : 'bg-transparent border-transparent hover:bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${activeIndex === idx ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    
                    <div className="overflow-hidden flex-1">
                      <p className={`text-sm font-medium truncate ${activeIndex === idx ? 'text-white' : 'text-slate-300'}`}>
                        {inv.fileName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {inv.data.data.invoice_number || "Draft"} • {inv.timestamp}
                      </p>
                    </div>

                    {/* DELETE BUTTON (Visible on Group Hover) */}
                    <button
                      onClick={(e) => deleteInvoice(e, inv.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all absolute right-2 bg-slate-800/80 backdrop-blur shadow-sm"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 bg-slate-950">
          {activeInvoice ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" key={activeInvoice.id}>
              
              {/* Toolbar */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {activeInvoice.data.data.invoice_number || "Invoice Details"}
                    <span className="text-sm font-normal bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">Saved</span>
                  </h2>
                  <p className="text-slate-400 mt-1">Parsed from {activeInvoice.fileName}</p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => downloadFile(activeInvoice.data.tally_xml, `tally_${activeInvoice.data.data.invoice_number}.xml`, 'text/xml')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" /> Tally XML
                  </button>
                  <button 
                    onClick={() => downloadFile(JSON.stringify(activeInvoice.data.data, null, 2), `data_${activeInvoice.data.data.invoice_number}.json`, 'application/json')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors text-sm font-medium"
                  >
                    <Code className="w-4 h-4" /> JSON
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <Card className="bg-slate-900 border-slate-800 p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Supplier</p>
                    <p className="font-medium text-white truncate" title={activeInvoice.data.data.supplier?.name}>{activeInvoice.data.data.supplier?.name || "N/A"}</p>
                 </Card>
                 <Card className="bg-slate-900 border-slate-800 p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Date</p>
                    <p className="font-medium text-white">{activeInvoice.data.data.invoice_date || "N/A"}</p>
                 </Card>
                 <Card className="bg-slate-900 border-slate-800 p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Total Tax</p>
                    <p className="font-medium text-white">₹{activeInvoice.data.data.tax_details?.total_tax?.toFixed(2) || "0.00"}</p>
                 </Card>
                 <Card className="bg-slate-900 border-slate-800 p-4 border-l-4 border-l-green-500">
                    <p className="text-xs text-slate-500 uppercase font-bold">Grand Total</p>
                    <p className="text-xl font-bold text-white">₹{activeInvoice.data.data.total_amount?.toFixed(2)}</p>
                 </Card>
              </div>

              {/* Line Items Table */}
              <Card className="overflow-hidden bg-slate-900 border-slate-800">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                  <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wide">Line Items</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="bg-slate-950/30 text-slate-500 uppercase text-xs">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Description</th>
                        <th className="px-6 py-3 font-semibold text-right">Qty</th>
                        <th className="px-6 py-3 font-semibold text-right">Rate</th>
                        <th className="px-6 py-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {activeInvoice.data.data.line_items?.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-3 font-medium text-white">{item.description}</td>
                          <td className="px-6 py-3 text-right font-mono">{item.quantity}</td>
                          <td className="px-6 py-3 text-right font-mono text-slate-400">₹{item.rate}</td>
                          <td className="px-6 py-3 text-right font-mono text-white font-bold">₹{item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
              <div className="bg-slate-900 p-8 rounded-full border border-slate-800">
                <UploadCloud className="w-12 h-12 text-slate-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Ready to Process</h2>
                <p className="text-slate-400 max-w-sm mx-auto">
                  Upload an invoice to extract Tally data. <br/> Your history is saved automatically.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}