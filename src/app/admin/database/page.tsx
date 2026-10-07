"use client";

import { useEffect, useState, useRef } from "react";
import { Database, Plus, Pencil, Trash2, Save, X, Search, Globe, DollarSign, Target, UploadCloud } from "lucide-react";

type University = {
  id: string;
  name: string;
  location: string;
  domain: string;
  minCgpa: number;
  tuition: number;
  currency: string;
  acceptanceRate: string;
  campusSetting: string;
  programs: any;
  lastUpdated: string;
};

export default function AdminDatabase() {
  const [unis, setUnis] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<University>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/database');
    const json = await res.json();
    if (json.success) setUnis(json.data);
    setLoading(false);
  };

  const handleEdit = (u: University) => {
    setEditingId(u.id);
    setEditForm(u);
  };

  const handleSave = async () => {
    const res = await fetch('/api/admin/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'update', payload: editForm })
    });
    if (res.ok) {
      setEditingId(null);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this university?")) return;
    const res = await fetch('/api/admin/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', payload: { id } })
    });
    if (res.ok) fetchData();
  };

  const handleAdd = () => {
    const newUni: Partial<University> = {
      id: `manual_${Date.now()}`,
      name: "",
      location: "",
      domain: "science_technology",
      minCgpa: 7.0,
      tuition: 20000,
      currency: "USD",
      acceptanceRate: "50%",
      campusSetting: "Urban"
    };
    // Prepend to array
    setUnis([newUni as University, ...unis]);
    setEditingId(newUni.id as string);
    setEditForm(newUni);
  };

  const filteredUnis = unis.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let payload: any[] = [];
        
        if (file.name.endsWith('.json')) {
          payload = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          const headers = lines[0].split(',').map(h => h.trim());
          payload = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj: any = {};
            headers.forEach((h, i) => obj[h] = values[i]);
            obj.minCgpa = parseFloat(obj.minCgpa || "7.0");
            obj.tuition = parseInt(obj.tuition || "0");
            obj.id = obj.id || `bulk_${Date.now()}_${Math.random()}`;
            obj.programs = obj.programs ? obj.programs : { bachelors: "N/A", masters: "N/A" };
            return obj;
          });
        }
        
        if (!Array.isArray(payload) || payload.length === 0) {
          alert("Invalid file format. Must be an array of universities.");
          return;
        }

        const res = await fetch('/api/admin/database', {
          method: 'POST',
          body: JSON.stringify({ action: 'import', payload })
        });
        
        if (res.ok) {
          alert(`Successfully imported ${payload.length} universities!`);
          fetchData();
        } else {
          alert("Import failed.");
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("Error parsing file.");
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full h-full p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8 h-full flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-white/10 pb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
              <Database className="w-8 h-8 text-indigo-500" />
              University Database
            </h1>
            <p className="text-slate-400 mt-2 text-sm">Manage dynamically scraped and mock university data.</p>
          </div>
          <div className="flex gap-4">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search universities..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#111113] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>
            
            <input type="file" ref={fileInputRef} hidden accept=".json,.csv" onChange={handleImport} />
            <button 
              onClick={handleImportClick}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-bold text-sm transition-colors border border-white/10"
            >
              <UploadCloud className="w-4 h-4" /> Import Bulk
            </button>
            <button 
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" /> Add College
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap relative">
              <thead className="bg-black/80 backdrop-blur-md text-slate-400 font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">University</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Domain</th>
                  <th className="px-6 py-4">Criteria</th>
                  <th className="px-6 py-4">Tuition</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading database...</td></tr>
                ) : filteredUnis.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <input value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} className="bg-black border border-white/20 rounded px-2 py-1 w-full" />
                      ) : (
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {u.id.includes('_live_') || u.id.includes('_') ? <span className="w-2 h-2 rounded-full bg-emerald-500" title="Live Scraped" /> : null}
                            {u.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">ID: {u.id}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <input value={editForm.location || ""} onChange={e => setEditForm({...editForm, location: e.target.value})} className="bg-black border border-white/20 rounded px-2 py-1 w-full" />
                      ) : (
                        <div className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-slate-500" /> {u.location}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <input value={editForm.domain || ""} onChange={e => setEditForm({...editForm, domain: e.target.value})} className="bg-black border border-white/20 rounded px-2 py-1 w-full" />
                      ) : (
                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] uppercase font-bold text-slate-400">{u.domain.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <div className="flex gap-2">
                          <input type="number" step="0.1" value={editForm.minCgpa || 0} onChange={e => setEditForm({...editForm, minCgpa: parseFloat(e.target.value)})} className="bg-black border border-white/20 rounded px-2 py-1 w-16" title="Min CGPA" />
                          <input value={editForm.acceptanceRate || ""} onChange={e => setEditForm({...editForm, acceptanceRate: e.target.value})} className="bg-black border border-white/20 rounded px-2 py-1 w-16" title="Acceptance Rate" />
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-indigo-400">{u.minCgpa.toFixed(1)}+ CGPA</div>
                          <div className="text-[10px] text-slate-500">{u.acceptanceRate} acceptance</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <div className="flex gap-2">
                          <input type="number" value={editForm.tuition || 0} onChange={e => setEditForm({...editForm, tuition: parseInt(e.target.value)})} className="bg-black border border-white/20 rounded px-2 py-1 w-24" />
                          <input value={editForm.currency || ""} onChange={e => setEditForm({...editForm, currency: e.target.value})} className="bg-black border border-white/20 rounded px-2 py-1 w-16" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <DollarSign className="w-3 h-3" />
                          {u.tuition.toLocaleString()} {u.currency}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <div className="flex gap-2">
                          <button onClick={handleSave} className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20"><Save className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-500/10 text-slate-400 rounded hover:bg-slate-500/20"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(u)} className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded hover:bg-indigo-500/20"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(u.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}
