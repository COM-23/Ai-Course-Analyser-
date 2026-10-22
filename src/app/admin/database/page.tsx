"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Database, Plus, Pencil, Trash2, Save, X, Search, Globe, DollarSign, 
  UploadCloud, Download, BookOpen, CheckCircle, AlertCircle, Award, 
  GraduationCap, Languages, Building2, Check, RefreshCw
} from "lucide-react";

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
  programs: {
    bachelors?: string;
    masters?: string;
  };
  minIelts?: string;
  minToefl?: string;
  minPte?: string;
  minDuolingo?: string;
  ieltsWaiver?: string;
  maxBacklogs?: number;
  ranking?: string;
  scholarships?: string;
  intakes?: string;
  lastUpdated?: string;
};

const DOMAIN_OPTIONS = [
  { value: "agricultural_sciences", label: "Agricultural Science" },
  { value: "science_technology", label: "Science & Technology" },
  { value: "commerce_management", label: "Commerce & Management" },
  { value: "medicine_allied_health", label: "Medicine & Allied Health" },
  { value: "law", label: "Law" },
  { value: "arts_humanities_social_sciences", label: "Arts & Humanities" },
  { value: "education", label: "Education" },
  { value: "hospitality_tourism_events", label: "Hospitality & Tourism" },
  { value: "performing_arts_media", label: "Performing Arts & Media" }
];

export default function AdminDatabase() {
  const [unis, setUnis] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState("all");
  
  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalForm, setModalForm] = useState<University>({
    id: "",
    name: "",
    location: "",
    domain: "agricultural_sciences",
    minCgpa: 7.0,
    tuition: 25000,
    currency: "GBP",
    acceptanceRate: "65%",
    campusSetting: "Urban",
    programs: { bachelors: "B.Sc Agricultural Science", masters: "M.Sc Sustainable Agriculture" },
    minIelts: "6.5 (min 6.0 each)",
    minToefl: "88",
    minPte: "62",
    minDuolingo: "115",
    ieltsWaiver: "Yes - 70%+ in CBSE/ICSE 12th English",
    maxBacklogs: 4,
    ranking: "Top Tier",
    scholarships: "Up to £4,000 Merit Award",
    intakes: "Fall (Sep), Spring (Jan)"
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/database');
      const json = await res.json();
      if (json.success) setUnis(json.data);
    } catch (e) {
      console.error("Error fetching universities:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setModalForm({
      id: `uni_${Date.now()}`,
      name: "",
      location: "",
      domain: "agricultural_sciences",
      minCgpa: 7.0,
      tuition: 25000,
      currency: "GBP",
      acceptanceRate: "65%",
      campusSetting: "Urban",
      programs: {
        bachelors: "B.Sc Agricultural Science",
        masters: "M.Sc Sustainable Agriculture"
      },
      minIelts: "6.5 (min 6.0 each)",
      minToefl: "88",
      minPte: "62",
      minDuolingo: "115",
      ieltsWaiver: "Yes - 70%+ in CBSE/ICSE 12th English",
      maxBacklogs: 4,
      ranking: "Top Tier",
      scholarships: "Up to £4,000 Merit Award",
      intakes: "Fall (September), Spring (January)"
    });
    setSaveError(null);
    setSaveMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: University) => {
    setModalMode("edit");
    let p = u.programs;
    if (typeof p === 'string') {
      try { p = JSON.parse(p); } catch { p = {}; }
    }
    setModalForm({
      ...u,
      programs: p || { bachelors: "Bachelors Degree", masters: "Masters Degree" },
      minIelts: u.minIelts || "6.5 (min 6.0 each)",
      minToefl: u.minToefl || "88",
      minPte: u.minPte || "62",
      minDuolingo: u.minDuolingo || "115",
      ieltsWaiver: u.ieltsWaiver || "Yes - 70%+ in CBSE/ICSE 12th English",
      maxBacklogs: u.maxBacklogs ?? 4,
      ranking: u.ranking || "Top Tier",
      scholarships: u.scholarships || "Available",
      intakes: u.intakes || "Fall, Spring"
    });
    setSaveError(null);
    setSaveMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!modalForm.name?.trim()) {
      setSaveError("Please enter a valid university name.");
      return;
    }
    if (!modalForm.location?.trim()) {
      setSaveError("Please enter university location (e.g. Bristol, UK).");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveMessage("Saving to database...");

    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', payload: modalForm })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveMessage("University saved successfully!");
        setGlobalBanner(`Saved "${modalForm.name}" successfully!`);
        setTimeout(() => {
          setIsModalOpen(false);
          setSaveMessage(null);
          setTimeout(() => setGlobalBanner(null), 3000);
        }, 800);
        fetchData();
      } else {
        setSaveError(data.error || "Failed to save to database.");
        setSaveMessage(null);
      }
    } catch (err: any) {
      setSaveError("Network error: " + err.message);
      setSaveMessage(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the database?`)) return;
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', payload: { id } })
      });
      if (res.ok) {
        setGlobalBanner(`Deleted "${name}".`);
        setTimeout(() => setGlobalBanner(null), 3000);
        fetchData();
      }
    } catch (e: any) {
      alert("Error deleting: " + e.message);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = "id,name,location,domain,minCgpa,tuition,currency,acceptanceRate,campusSetting,bachelorsProgram,mastersProgram,minIelts,minToefl,minPte,minDuolingo,ieltsWaiver,maxBacklogs,ranking,scholarships,intakes\n";
    const sample = 
      'bristol_uk,University of Bristol,Bristol UK,agricultural_sciences,7.5,27000,GBP,67%,Urban,B.Sc Agricultural Science,M.Sc Sustainable Agriculture,6.5 (min 6.0 each),88,62,115,Yes - 70%+ in CBSE/ICSE 12th English,4,Top 60 World,Up to £5000,Fall (Sep)\n' +
      'warwick_uk,University of Warwick,Coventry UK,agricultural_sciences,7.8,29000,GBP,50%,Campus,B.Sc Food Security & Agri,M.Sc Environmental Bioscience & Agriculture,6.5 (min 6.0 each),92,65,120,Yes - 75%+ in CBSE/ICSE 12th English,2,Top 70 World,Up to £4000,Fall (Sep)\n' +
      'oxford_uk,University of Oxford,Oxford UK,science_technology,9.2,38000,GBP,17%,Urban,B.A Computer Science,M.Sc Advanced Computer Science,7.5 (min 7.0 each),110,76,135,No - Exam Mandatory,0,Top 5 World,Clarendon Fund,Fall (Oct)\n';
    const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'universities_master_template.csv';
    a.click();
    URL.revokeObjectURL(url);
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
          const parseCsvLine = (str: string) => {
            const arr = [];
            let inQ = false;
            let cur = '';
            for (let i = 0; i < str.length; i++) {
              const c = str[i];
              if (c === '"') inQ = !inQ;
              else if (c === ',' && !inQ) { arr.push(cur.trim()); cur = ''; }
              else cur += c;
            }
            arr.push(cur.trim());
            return arr;
          };
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const headers = parseCsvLine(lines[0]);
          payload = lines.slice(1).map(line => {
            const values = parseCsvLine(line);
            const obj: any = {};
            headers.forEach((h, i) => obj[h] = values[i] || "");
            obj.minCgpa = parseFloat(obj.minCgpa || "7.0");
            obj.tuition = parseInt(obj.tuition || "0");
            obj.id = obj.id || `bulk_${Date.now()}_${Math.random()}`;
            if (!obj.programs || typeof obj.programs === 'string') {
              obj.programs = {
                bachelors: obj.bachelorsProgram || "Bachelors Degree",
                masters: obj.mastersProgram || "Masters Degree"
              };
            }
            return obj;
          });
        }
        
        if (!Array.isArray(payload) || payload.length === 0) {
          alert("Invalid file format. Must be an array of universities.");
          return;
        }

        const res = await fetch('/api/admin/database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'import', payload })
        });
        
        if (res.ok) {
          setGlobalBanner(`Successfully imported ${payload.length} universities!`);
          setTimeout(() => setGlobalBanner(null), 3500);
          fetchData();
        } else {
          alert("Import failed.");
        }
      } catch (err: any) {
        console.error("Import error:", err);
        alert("Error parsing file: " + err.message);
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const getDomainLabel = (key: string) => {
    return DOMAIN_OPTIONS.find(d => d.value === key)?.label || key.replace(/_/g, ' ');
  };

  const filteredUnis = unis.filter(u => {
    const s = searchTerm.toLowerCase();
    const domainName = (DOMAIN_OPTIONS.find(d => d.value === u.domain)?.label || u.domain).toLowerCase();
    const pBachelors = (u.programs?.bachelors || "").toLowerCase();
    const pMasters = (u.programs?.masters || "").toLowerCase();
    const matchesSearch = (
      u.name.toLowerCase().includes(s) || 
      u.location.toLowerCase().includes(s) ||
      domainName.includes(s) ||
      pBachelors.includes(s) ||
      pMasters.includes(s)
    );
    const matchesDomain = selectedDomainFilter === "all" || u.domain === selectedDomainFilter;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="w-full h-full p-6 md:p-8 font-sans selection:bg-[#FC7133]/30">
      <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
              <Database className="w-8 h-8 text-[#FC7133]" />
              Global University Database
            </h1>
            <p className="text-slate-400 mt-2 text-sm flex items-center gap-2">
              <span>Institution registry with academic domains, cutoffs, tuition & language exam criteria.</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FC7133]/10 text-[#FC7133] text-xs font-bold border border-[#FC7133]/20">
                {unis.length} Colleges Live
              </span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search name, location, course..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#111113] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 focus:ring-1 focus:ring-[#FC7133]/30 transition-all placeholder:text-slate-600"
              />
            </div>

            <select
              value={selectedDomainFilter}
              onChange={e => setSelectedDomainFilter(e.target.value)}
              className="bg-[#111113] border border-white/10 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#FC7133]"
            >
              <option value="all">All Domains ({unis.length})</option>
              {DOMAIN_OPTIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-xs transition-colors border border-white/10"
              title="Download pre-formatted CSV template with IELTS, PTE, and Cutoff columns"
            >
              <Download className="w-3.5 h-3.5 text-[#FC7133]" /> CSV Template
            </button>

            <input type="file" ref={fileInputRef} hidden accept=".json,.csv" onChange={handleImport} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-xs transition-colors border border-white/10"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" /> Import Bulk
            </button>

            <button 
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FC7133] to-[#e65d20] hover:brightness-110 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-[#FC7133]/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add College
            </button>
          </div>
        </div>

        {/* Global Success Banner */}
        {globalBanner && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{globalBanner}</span>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap relative">
              <thead className="bg-black/90 backdrop-blur-md text-slate-400 font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">University & Programs</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Domain</th>
                  <th className="px-6 py-4">Cutoff & Backlogs</th>
                  <th className="px-6 py-4">Language Exam / Waiver</th>
                  <th className="px-6 py-4">Annual Tuition</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-500 font-bold">Loading university database records...</td></tr>
                ) : filteredUnis.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-500">No universities found matching your criteria.</td></tr>
                ) : filteredUnis.map((u) => {
                  const pBachelors = u.programs?.bachelors;
                  const pMasters = u.programs?.masters;

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* University & Programs */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-white flex items-center gap-2 text-sm">
                            <Building2 className="w-3.5 h-3.5 text-[#FC7133]" />
                            {u.name}
                            {u.ranking && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-medium border border-white/10">
                                {u.ranking}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-col gap-0.5">
                            {pMasters && (
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <GraduationCap className="w-3 h-3 text-[#FC7133] shrink-0" />
                                <span className="font-medium text-[11px] text-slate-200">Masters: {pMasters}</span>
                              </span>
                            )}
                            {pBachelors && (
                              <span className="flex items-center gap-1.5 text-slate-400">
                                <BookOpen className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="text-[11px] text-slate-400">Bachelors: {pBachelors}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                          <Globe className="w-3.5 h-3.5 text-[#FC7133]" /> {u.location}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{u.campusSetting || "Urban"} Campus</div>
                      </td>

                      {/* Domain */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          u.domain === 'agricultural_sciences' || u.domain === 'agriculture_veterinary'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-white/5 text-slate-300 border border-white/10'
                        }`}>
                          {getDomainLabel(u.domain)}
                        </span>
                      </td>

                      {/* Cutoff / Backlogs */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-[#FC7133] text-xs">{u.minCgpa?.toFixed(1)}+ CGPA</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Max {u.maxBacklogs ?? 4} Backlogs • {u.acceptanceRate || "50%"} Acc.
                          </div>
                        </div>
                      </td>

                      {/* Language Criteria & Waiver */}
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px]">
                            <Languages className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>IELTS: {u.minIelts || "6.5"}</span>
                            <span className="text-slate-500 text-[10px]">• PTE: {u.minPte || "62"}</span>
                          </div>
                          <div className="text-[10px] text-emerald-400 mt-0.5 font-medium truncate max-w-[220px]" title={u.ieltsWaiver}>
                            Waiver: {u.ieltsWaiver || "CBSE/ICSE 70%+"}
                          </div>
                        </div>
                      </td>

                      {/* Tuition */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                          <DollarSign className="w-3.5 h-3.5" />
                          {u.tuition?.toLocaleString()} {u.currency || "USD"}
                        </div>
                        {u.scholarships && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]" title={u.scholarships}>
                            {u.scholarships}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEditModal(u)} 
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-[#FC7133]/20 text-[#FC7133] rounded-lg text-xs font-bold transition-colors border border-white/10 hover:border-[#FC7133]/40"
                            title="Edit College Information"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id, u.name)} 
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors border border-red-500/20"
                            title="Delete University"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* COMPREHENSIVE ADD / EDIT MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121215] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#FC7133]/20 border border-[#FC7133]/30 text-[#FC7133]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">
                    {modalMode === "add" ? "Add College to Global Database" : `Edit: ${modalForm.name || "University"}`}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter comprehensive admissions, academic domain, degree programs, cutoffs, and exam waiver requirements.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              
              {/* Alert Feedback inside Modal */}
              {saveError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}
              {saveMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{saveMessage}</span>
                </div>
              )}

              {/* 1. BASIC INFORMATION */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#FC7133] flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Building2 className="w-3.5 h-3.5" /> 1. Basic Institution Information
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">University Name *</label>
                    <input 
                      type="text"
                      placeholder="e.g. University of Bristol"
                      value={modalForm.name}
                      onChange={e => setModalForm({...modalForm, name: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133] focus:ring-1 focus:ring-[#FC7133]/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Location (City, Country) *</label>
                    <input 
                      type="text"
                      placeholder="e.g. Bristol, UK"
                      value={modalForm.location}
                      onChange={e => setModalForm({...modalForm, location: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133] focus:ring-1 focus:ring-[#FC7133]/30"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Domain *</label>
                    <select
                      value={modalForm.domain}
                      onChange={e => setModalForm({...modalForm, domain: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                    >
                      {DOMAIN_OPTIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Campus Setting</label>
                    <select
                      value={modalForm.campusSetting}
                      onChange={e => setModalForm({...modalForm, campusSetting: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                    >
                      <option value="Urban">Urban</option>
                      <option value="Suburban">Suburban</option>
                      <option value="Rural">Rural</option>
                      <option value="College Town">College Town</option>
                      <option value="Coastal">Coastal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Ranking / Tier</label>
                    <input 
                      type="text"
                      placeholder="e.g. Top 60 World"
                      value={modalForm.ranking || ""}
                      onChange={e => setModalForm({...modalForm, ranking: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. DEGREE PROGRAMS & ACADEMIC CUTOFFS */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <GraduationCap className="w-3.5 h-3.5" /> 2. Degree Programs & Academic Requirements
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bachelor Program Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. B.Sc Agricultural Science"
                      value={modalForm.programs?.bachelors || ""}
                      onChange={e => setModalForm({
                        ...modalForm, 
                        programs: { ...(modalForm.programs || {}), bachelors: e.target.value }
                      })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Master Program Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. M.Sc Sustainable Agriculture"
                      value={modalForm.programs?.masters || ""}
                      onChange={e => setModalForm({
                        ...modalForm, 
                        programs: { ...(modalForm.programs || {}), masters: e.target.value }
                      })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Min CGPA / Percentage *</label>
                    <input 
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={modalForm.minCgpa}
                      onChange={e => setModalForm({...modalForm, minCgpa: parseFloat(e.target.value) || 0})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Max Backlogs Allowed</label>
                    <input 
                      type="number"
                      min="0"
                      max="50"
                      value={modalForm.maxBacklogs ?? 4}
                      onChange={e => setModalForm({...modalForm, maxBacklogs: parseInt(e.target.value) || 0})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Acceptance Rate</label>
                    <input 
                      type="text"
                      placeholder="e.g. 65%"
                      value={modalForm.acceptanceRate}
                      onChange={e => setModalForm({...modalForm, acceptanceRate: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. TUITION, SCHOLARSHIPS & INTAKES */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <DollarSign className="w-3.5 h-3.5" /> 3. Tuition & Financials
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Annual Tuition Fee *</label>
                    <input 
                      type="number"
                      step="500"
                      value={modalForm.tuition}
                      onChange={e => setModalForm({...modalForm, tuition: parseInt(e.target.value) || 0})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Code</label>
                    <input 
                      type="text"
                      placeholder="e.g. GBP, USD, CAD, EUR"
                      value={modalForm.currency}
                      onChange={e => setModalForm({...modalForm, currency: e.target.value.toUpperCase()})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white uppercase outline-none focus:border-[#FC7133]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Available Intakes</label>
                    <input 
                      type="text"
                      placeholder="e.g. Fall (Sep), Spring (Jan)"
                      value={modalForm.intakes || ""}
                      onChange={e => setModalForm({...modalForm, intakes: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Scholarships & Financial Aid</label>
                  <input 
                    type="text"
                    placeholder="e.g. Up to £5,000 Dean's International Merit Scholarship"
                    value={modalForm.scholarships || ""}
                    onChange={e => setModalForm({...modalForm, scholarships: e.target.value})}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                  />
                </div>
              </div>

              {/* 4. LANGUAGE EXAM CUTOFFS & ENGLISH WAIVERS */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Languages className="w-3.5 h-3.5" /> 4. Language Fluency Requirements (IELTS / TOEFL / PTE / Waivers)
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Min IELTS</label>
                    <input 
                      type="text"
                      placeholder="6.5 (min 6.0 each)"
                      value={modalForm.minIelts || ""}
                      onChange={e => setModalForm({...modalForm, minIelts: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Min TOEFL</label>
                    <input 
                      type="text"
                      placeholder="88"
                      value={modalForm.minToefl || ""}
                      onChange={e => setModalForm({...modalForm, minToefl: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Min PTE</label>
                    <input 
                      type="text"
                      placeholder="62"
                      value={modalForm.minPte || ""}
                      onChange={e => setModalForm({...modalForm, minPte: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Min Duolingo</label>
                    <input 
                      type="text"
                      placeholder="115"
                      value={modalForm.minDuolingo || ""}
                      onChange={e => setModalForm({...modalForm, minDuolingo: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    English Language Waiver Eligibility
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Yes - 70%+ in CBSE/ICSE 12th English, OR Medium of Instruction letter"
                    value={modalForm.ieltsWaiver || ""}
                    onChange={e => setModalForm({...modalForm, ieltsWaiver: e.target.value})}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#FC7133]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Describe criteria where student can waive IELTS/TOEFL (e.g. 70%+ in CBSE/ICSE 12th English).
                  </p>
                </div>
              </div>

              {/* Modal Footer & SAVE BUTTON */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 sticky bottom-0 bg-[#121215] py-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save College to Database
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
