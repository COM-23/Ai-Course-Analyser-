"use client";
import { useState, useRef, useEffect } from "react";
import AdminDatabase from "./admin/database/page";
import { 
  Upload, 
  FileText, 
  BrainCircuit, 
  BarChart, 
  Target,
  ChevronRight,
  Sparkles,
  MapPin,
  CircleDollarSign,
  Briefcase,
  AlertCircle,
  History,
  Clock,
  LayoutDashboard,
  Users,
  Settings,
  TrendingUp,
  Globe,
  Search,
  Filter,
  CheckCircle2,
  Database,
  Lock,
  Bell,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Moon,
  Sun,
  Plus,
  Key,
  Download
} from "lucide-react";
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type CollegeMatch = {
  name: string;
  location: string;
  matchPercentage: number;
  category: "Reach" | "Target" | "Safety";
  rationale: string;
  recommendedCourse: string;
  courseDetails: string;
  notablePrograms: string[];
  minCgpa: number;
  tuition: number;
  acceptanceRate: string;
  campusSetting: string;
  currency: string;
  applicationDeadline: string;
  tuitionConverted?: string;
};

type AnalysisResult = {
  id?: number;
  createdAt?: string;
  studentDetails?: {
    name?: string;
    cgpa: string;
    degreeObjective: string;
    primaryDomain: string;
    testScores: string;
    destinationCountry: string;
    targetIntake: string;
    visaStatus?: string;
    workExperience?: string;
    backlogs?: string;
    originalContext?: string;
  };
  studentSummary: string;
  strengths: string[];
  areasForImprovement: string[];
  careerOpportunities: string[];
  recommendedColleges: CollegeMatch[];
  visaDifficulty: string;
  keySkillsIdentified: string[];
  estimatedBudgetRange: string;
  counselorName?: string;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "analyzer" | "roster" | "settings">("analyzer");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [settingsTab, setSettingsTab] = useState<"users" | "security" | "preferences" | "database">("users");
  
  const [inputType, setInputType] = useState<"pdf" | "text">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [manualText, setManualText] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  
  // Generate dynamic intake terms
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  
  // If we are past August, prioritize next year
  const startYear = currentMonth >= 8 ? currentYear + 1 : currentYear;
  const intakeOptions = [
    `Spring ${startYear}`,
    `Fall ${startYear}`,
    `Spring ${startYear + 1}`,
    `Fall ${startYear + 1}`,
    "Not Decided"
  ];

  // Target Configs
  const [destinationCountry, setDestinationCountry] = useState("Not Decided");
  const [intake, setIntake] = useState("Not Decided");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedCollegeIdx, setExpandedCollegeIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDomain, setFilterDomain] = useState("All");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [filterIntakeTerm, setFilterIntakeTerm] = useState("All");
  const [filterIntakeYear, setFilterIntakeYear] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // System Settings State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [enforceStrongPass, setEnforceStrongPass] = useState(true);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState("5");
  
  const [agencyName, setAgencyName] = useState("Learn Overseas");
  const [aiStrictness, setAiStrictness] = useState("standard");

  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    if (!reportRef.current || !result) return;
    setIsExporting(true);
    
    try {
      const imgData = await htmlToImage.toPng(reportRef.current, {
        backgroundColor: '#111113',
        pixelRatio: 2
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const nodeWidth = reportRef.current.offsetWidth || 1200;
      const nodeHeight = reportRef.current.offsetHeight || 800;
      const pdfHeight = (nodeHeight * pdfWidth) / nodeWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      let heightLeft = pdfHeight - pdf.internal.pageSize.getHeight();
      let position = -pdf.internal.pageSize.getHeight();
      
      while (heightLeft >= 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
        position -= pdf.internal.pageSize.getHeight();
      }
      
      pdf.save(`${result.studentDetails?.name?.replace(/\s+/g, '_') || 'Student'}_Intelligence_Report.pdf`);
    } catch (err: any) {
      console.error("PDF Export failed:", err);
      alert("Failed to export PDF: " + (err.message || err.toString()));
    } finally {
      setIsExporting(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(err => console.error('Auth error:', err))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'super_admin') return;
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAppUsers(data);
      })
      .catch(err => console.error('Error fetching users:', err));

    // Fetch settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.mfaEnabled !== undefined) setMfaEnabled(data.mfaEnabled);
          if (data.sessionTimeout) setSessionTimeout(data.sessionTimeout);
          if (data.enforceStrongPass !== undefined) setEnforceStrongPass(data.enforceStrongPass);
          if (data.maxFailedAttempts) setMaxFailedAttempts(data.maxFailedAttempts);
          
          if (data.agencyName) setAgencyName(data.agencyName);
          if (data.aiStrictness) setAiStrictness(data.aiStrictness);
        }
      })
      .catch(err => console.error('Error fetching settings:', err));
  }, [currentUser]);

  const saveSettings = async (payload: any) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) alert('Settings saved successfully!');
      else alert('Failed to save settings.');
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    
    fetch(`/api/students?counselorId=${currentUser.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
      })
      .catch(err => console.error('Error fetching history:', err));
  }, [currentUser]);

  const standardDomains = [
    "science_technology", "commerce_management", "medicine_allied_health", 
    "arts_humanities_social_sciences", "law", "education", 
    "hospitality_tourism_events", "performing_arts_media", "agriculture_veterinary"
  ];
  
  const historyDomains = history.map(h => h.studentDetails?.primaryDomain || "General");
  const uniqueDomains = Array.from(new Set([...standardDomains, ...historyDomains]));

  // Calculate global stats
  const totalStudents = history.length;
  const countries = history.map(h => h.studentDetails?.destinationCountry || "Global");
  const countryCounts = countries.reduce((acc, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {} as Record<string, number>);
  const topCountry = Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a])[0] || "-";

  let totalMatches = 0;
  let matchSum = 0;
  history.forEach(h => {
    h.recommendedColleges?.forEach((c: any) => {
      matchSum += c.matchPercentage;
      totalMatches++;
    });
  });
  const avgMatch = totalMatches > 0 ? (matchSum / totalMatches).toFixed(1) + "%" : "-";

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    if (selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setPdfUrl(URL.createObjectURL(selectedFile));
      setError(null);
    } else {
      setError("Please select a valid PDF file.");
    }
  };

  const handleAnalyze = async () => {
    if (inputType === "pdf" && !file) {
      setError("Please upload a PDF document first.");
      return;
    }
    if (inputType === "text" && !manualText.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }

    setExpandedCollegeIdx(null); // Reset expansions on new search

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (inputType === "pdf" && file) {
        formData.append("pdfFile", file);
      }
      
      const context = inputType === "text" ? manualText + "\n\n" + additionalContext : additionalContext;
      formData.append("additionalContext", context);
      formData.append("destinationCountry", destinationCountry);
      formData.append("targetIntake", intake);
      if (currentUser) {
        formData.append("counselorId", currentUser.id.toString());
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
      setHistory(prev => {
        const existingIdx = prev.findIndex((s: any) => s.id === data.id);
        if (existingIdx >= 0) {
          const newHistory = [...prev];
          newHistory[existingIdx] = data;
          return newHistory;
        }
        return [data, ...prev];
      }); 
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setPdfUrl(null);
    setManualText("");
    setAdditionalContext("");
    setError(null);
    setExpandedCollegeIdx(null);
  };

  const handleViewStudent = (student: AnalysisResult) => {
    setResult(student);
    if (student.studentDetails?.originalContext) {
      setInputType("text");
      setManualText(student.studentDetails.originalContext);
      setFile(null);
      setPdfUrl(null);
    }
    setActiveTab("analyzer");
  };

  const handleDeleteStudent = async (studentToDelete: AnalysisResult) => {
    if (studentToDelete && studentToDelete.id) {
      try {
        await fetch('/api/students', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: studentToDelete.id })
        });
      } catch (err) {
        console.error("Failed to delete from DB", err);
      }
    }
    
    setHistory(prev => prev.filter(s => s !== studentToDelete));
    if (result && studentToDelete && result.id === studentToDelete.id) {
      // If we deleted the actively viewed student, clear the view
      setResult(null);
    }
  };

  const handleAddUser = async (name: string, username: string, pass: string, role: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password: pass, role })
      });
      if (res.ok) {
        const newUser = await res.json();
        setAppUsers(prev => [...prev, newUser]);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to add user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (id: number) => {
    const newPass = prompt("Enter new password for this user:");
    if (!newPass) return;
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, newPassword: newPass })
      });
      if (res.ok) {
        alert("Password reset successfully.");
      } else {
        alert("Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch (err) {
      setLoginError("An unexpected error occurred.");
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setHistory([]);
    setResult(null);
    setFile(null);
    setPdfUrl(null);
    setActiveTab('dashboard');
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setAppUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredHistory = history.filter(student => {
    const name = student.studentDetails?.name?.toLowerCase() || "";
    const domain = student.studentDetails?.primaryDomain?.toLowerCase() || "";
    const country = student.studentDetails?.destinationCountry?.toLowerCase() || "";
    const intake = student.studentDetails?.targetIntake || "Not Decided";
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = name.includes(query) || domain.includes(query) || country.includes(query);
    const matchesFilter = filterDomain === "All" || student.studentDetails?.primaryDomain?.toLowerCase() === filterDomain.toLowerCase();
    
    let matchesDate = true;
    if (filterFromDate && student.createdAt) {
       matchesDate = matchesDate && new Date(student.createdAt) >= new Date(filterFromDate);
    }
    if (filterToDate && student.createdAt) {
       matchesDate = matchesDate && new Date(student.createdAt) <= new Date(filterToDate + "T23:59:59");
    }

    let matchesTerm = true;
    if (filterIntakeTerm !== "All") {
       matchesTerm = intake.toLowerCase().includes(filterIntakeTerm.toLowerCase());
    }

    let matchesYear = true;
    if (filterIntakeYear !== "All") {
       matchesYear = intake.includes(filterIntakeYear);
    }
    
    return matchesSearch && matchesFilter && matchesDate && matchesTerm && matchesYear;
  });

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortBy === "name") {
      const nameA = a.studentDetails?.name || "";
      const nameB = b.studentDetails?.name || "";
      return nameA.localeCompare(nameB);
    } else {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }
  });

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-indigo-400 font-bold">
        <Sparkles className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-slate-200 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-900/10 blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />
        
        <div className="w-full max-w-md relative z-10 p-8">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 p-px shadow-xl shadow-indigo-500/20 mx-auto mb-6">
              <div className="w-full h-full bg-[#111113] rounded-2xl flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-white">Learn Overseas</h1>
            <p className="text-slate-400 font-medium mt-2">Counselor AI Portal</p>
          </div>
          
          <form onSubmit={handleLogin} className="bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
            {loginError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm font-bold text-rose-400 text-center">
                {loginError}
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
                <input 
                  type="text" 
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
                  placeholder="Enter username..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
                  placeholder="Enter password..."
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full mt-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-500/25"
              >
                Log In Securely
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0A0A0B] text-slate-200 selection:bg-indigo-500/30 flex overflow-hidden ${theme === 'light' ? 'invert hue-rotate-180' : ''}`}>
      


      {/* Premium Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-900/10 blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />
      </div>

      {/* Global Sidebar */}
      <aside className="relative z-20 w-[260px] bg-[#0A0A0B]/90 backdrop-blur-3xl border-r border-white/5 flex flex-col hidden lg:flex shrink-0">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 p-px shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-[#111113] rounded-xl flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-tight">Learn<br/>Overseas</h1>
            </div>
          </div>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all shadow-md shrink-0 ml-2"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-indigo-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>

        <div className="flex-1 py-8 px-4 flex flex-col gap-2">
           <button 
             onClick={() => setActiveTab("dashboard")}
             className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
             <LayoutDashboard className="w-4 h-4" /> Dashboard
           </button>
           <button 
             onClick={() => setActiveTab("analyzer")}
             className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'analyzer' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
             <Sparkles className="w-4 h-4" /> AI Analyzer
           </button>
           <button 
             onClick={() => setActiveTab("roster")}
             className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'roster' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
             <Users className="w-4 h-4" /> Student Roster
           </button>
           
           <button 
             onClick={() => {
               setActiveTab("settings");
               if (currentUser?.role !== 'super_admin') setSettingsTab("preferences");
             }}
             className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
             <Settings className="w-4 h-4" /> System Settings
           </button>
           
           <div className="mt-auto flex flex-col gap-2">
             <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 border border-indigo-500/10 mb-2 flex flex-col gap-4">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shrink-0">
                   <span className="text-xs font-black text-indigo-300">{currentUser.name.charAt(0)}</span>
                 </div>
                 <div className="min-w-0">
                   <h4 className="text-xs font-bold text-indigo-300 truncate">{currentUser.name}</h4>
                   <p className="text-[10px] text-slate-400 capitalize truncate">{currentUser.role.replace('_', ' ')}</p>
                 </div>
               </div>
               <button 
                 onClick={handleLogout}
                 className="w-full py-2 bg-black/40 hover:bg-black/60 border border-white/5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
               >
                 Sign Out
               </button>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col h-screen overflow-hidden px-4 lg:px-8 py-8">
        
        {activeTab === "analyzer" && (
          <>
            {/* Header */}
        <header className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              AI Analyzer
            </h1>
            <p className="text-sm text-slate-400 font-medium tracking-wide mt-1">
              Automated Course & University Matchmaking
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleReset}
              className="px-5 py-2.5 bg-[#1F1F22] hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-all border border-indigo-500/30 hover:border-indigo-500 flex items-center gap-2"
            >
              <BrainCircuit className="w-4 h-4" /> Analyze Another Student
            </button>
          </div>
        </header>

        {/* Main Interface Layout */}
        <div className="flex-1 flex gap-6 min-h-0">
          
          {/* Left Panel: Input & Controls */}
          <div className="w-full lg:w-[40%] flex flex-col gap-6">
            
            {/* Input Selection Card */}
            <div className="bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col min-h-0 flex-1">
              
              {/* Tabs */}
              <div className="flex p-1.5 bg-[#0a0a0c] border border-white/5 rounded-[1.25rem] mb-6 shadow-inner relative z-10">
                <button
                  onClick={() => setInputType("pdf")}
                  className={`flex-1 flex items-center justify-center py-3.5 text-sm font-semibold rounded-xl transition-all duration-500 ease-out ${
                    inputType === "pdf" 
                      ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.1)] border border-indigo-500/30" 
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
                  }`}
                >
                  <FileText className={`w-4 h-4 mr-2 transition-colors ${inputType === "pdf" ? "text-indigo-400" : "text-slate-500"}`} /> PDF Upload
                </button>
                <button
                  onClick={() => setInputType("text")}
                  className={`flex-1 flex items-center justify-center py-3.5 text-sm font-semibold rounded-xl transition-all duration-500 ease-out ${
                    inputType === "text" 
                      ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)] border border-emerald-500/30" 
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
                  }`}
                >
                  <BarChart className={`w-4 h-4 mr-2 transition-colors ${inputType === "text" ? "text-emerald-400" : "text-slate-500"}`} /> Manual Text
                </button>
              </div>

              {/* Data Input Area */}
              <div className="flex-1 bg-[#0a0a0c] border border-white/5 rounded-2xl overflow-hidden relative group ring-1 ring-transparent focus-within:ring-indigo-500/20 focus-within:border-indigo-500/30 transition-all duration-300 shadow-inner">
                {inputType === "pdf" ? (
                  pdfUrl ? (
                    <div className="relative w-full h-full group">
                      <iframe src={pdfUrl} className="w-full h-full rounded-2xl filter contrast-125 grayscale" title="PDF Viewer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-transparent pointer-events-none opacity-50" />
                      <button 
                        onClick={() => { setFile(null); setPdfUrl(null); }}
                        className="absolute top-4 right-4 bg-red-500/90 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        Remove PDF
                      </button>
                    </div>
                  ) : (
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full h-full flex flex-col items-center justify-center p-8 cursor-pointer transition-all duration-300 ${
                        isDragging ? "bg-indigo-500/10 border-2 border-dashed border-indigo-500" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
                      <div className="w-20 h-20 rounded-full bg-gradient-to-b from-indigo-500/20 to-transparent flex items-center justify-center mb-6">
                        <Upload className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Upload Student Profile</h3>
                      <p className="text-sm text-slate-500 text-center max-w-xs">Drag & drop a PDF resume, transcript, or profile here, or click to browse.</p>
                    </div>
                  )
                ) : (
                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Paste student profile data here...&#10;&#10;E.g. Name: Alex&#10;CGPA: 8.5&#10;Targeting: MS in Computer Science"
                    className="w-full h-full p-6 text-[15px] leading-relaxed text-slate-200 font-mono bg-transparent border-0 outline-none resize-none placeholder:text-slate-600 custom-scrollbar transition-all duration-300 focus:bg-[#111114] focus:shadow-inner"
                  />
                )}
              </div>
            </div>
            
            {/* AI Parameters Setup */}
            <div className="bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl shrink-0">
              <label className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">
                <Sparkles className="w-4 h-4" /> Targeting Parameters
              </label>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Country</label>
                  <select value={destinationCountry} onChange={(e) => setDestinationCountry(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all">
                    {["USA", "Canada", "United Kingdom", "Australia", "New Zealand", "Germany", "Spain", "France", "Ireland", "Poland", "EU/Other", "UAE/Middle East", "Singapore/APJ", "Malaysia", "Other", "Italy", "Nagaland", "Not Decided"].map(c => <option key={c} className="bg-[#1C1C1E]">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Intake</label>
                  <select value={intake} onChange={(e) => setIntake(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all">
                    {intakeOptions.map(option => (
                      <option key={option} value={option} className="bg-[#1C1C1E]">{option}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2 lg:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Budget Constraints</label>
                  <input type="text" value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} placeholder="e.g. 50 Lakhs or $60,000" className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-600 transition-all" />
                </div>
              </div>

              <button 
                onClick={handleAnalyze} 
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-px font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] bg-[length:200%_100%] animate-shine opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-xl" />
                <div className="relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-4 transition-all group-hover:from-indigo-400 group-hover:to-fuchsia-400 z-0">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" /> Generate Intelligence Report
                    </>
                  )}
                </div>
              </button>
            </div>
            

            
          </div>

          {/* Right Panel: Intelligence Output */}
          <div className="w-full lg:w-[60%] bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full relative">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 bg-black/20 flex justify-between items-center z-10">
              <h3 className="text-lg font-black text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <BarChart className="w-4 h-4 text-indigo-400" />
                </div>
                Intelligence Report
              </h3>
              {result && (
                <div className="flex gap-2">
                  <button 
                    onClick={exportToPDF} 
                    disabled={isExporting} 
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isExporting ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Download className="w-3 h-3" />}
                    {isExporting ? "Exporting..." : "Export PDF"}
                  </button>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Analysis Complete
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {!result && !error && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                  <BrainCircuit className="w-16 h-16 mb-4 stroke-[1.5]" />
                  <p className="text-lg font-medium">Awaiting Profile Data</p>
                  <p className="text-sm">Upload a PDF and run analysis to view insights.</p>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center text-indigo-400">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
                  <p className="text-lg font-bold animate-pulse">Running Neural Heuristics...</p>
                  <p className="text-sm text-slate-500 mt-2">Processing profile against global database.</p>
                </div>
              )}

              {result && (
                <div ref={reportRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 -m-4 bg-[#111113] rounded-2xl">
                  
                  {/* Student Profile Header */}
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 p-px shadow-lg shadow-indigo-500/20">
                      <div className="w-full h-full bg-[#111113] rounded-2xl flex items-center justify-center text-xl font-black text-white">
                        {result.studentDetails?.name ? result.studentDetails.name.charAt(0) : "U"}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">{result.studentDetails?.name || "Unknown Student"}</h2>
                      <p className="text-sm font-bold text-indigo-400">{result.studentDetails?.primaryDomain} Applicant</p>
                    </div>
                  </div>

                  {/* Top Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">CGPA</h5>
                      <p className="text-xl font-black text-white">{result.studentDetails?.cgpa} <span className="text-xs font-bold text-slate-600">/ 10</span></p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Degree Obj</h5>
                      <p className="text-xs font-bold text-indigo-300 leading-snug">{result.studentDetails?.degreeObjective}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Country</h5>
                      <p className="text-xs font-bold text-indigo-300 leading-snug">{result.studentDetails?.destinationCountry}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Target Intake</h5>
                      <p className="text-xs font-bold text-indigo-300 leading-snug">{result.studentDetails?.targetIntake}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Domain</h5>
                      <p className="text-xs font-bold text-indigo-300 leading-snug">{result.studentDetails?.primaryDomain}</p>
                    </div>
                    
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Work Exp</h5>
                      <p className="text-xs font-bold text-indigo-300 leading-snug">{result.studentDetails?.workExperience || "None"}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Backlogs</h5>
                      <p className="text-xs font-bold text-indigo-300 leading-snug">{result.studentDetails?.backlogs || "0"}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Visa Status</h5>
                      <p className="text-xs font-bold text-indigo-300 leading-snug">{result.studentDetails?.visaStatus || "Not Specified"}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center lg:col-span-2">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Test Scores</h5>
                      <p className="text-xs font-bold text-indigo-300 leading-snug">{result.studentDetails?.testScores}</p>
                    </div>
                  </div>

                  {/* Summary & Budget Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/20 to-black border border-indigo-500/20 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Executive Summary
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        {result.studentSummary}
                      </p>
                    </div>
                    
                    <div className="bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-center text-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-10 h-10 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                        <CircleDollarSign className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Calculated Budget</h4>
                      <p className="text-sm font-black text-emerald-400 leading-tight">
                        {result.estimatedBudgetRange}
                      </p>
                    </div>
                  </div>

                  {/* Recommendations Section */}
                  <div>
                    <h4 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-400" /> Recommended Institutions
                      <span className="ml-2 px-2.5 py-0.5 bg-white/10 text-slate-300 rounded-full text-[10px] font-bold">
                        {result.recommendedColleges.length} Matches
                      </span>
                    </h4>
                    
                    {/* Admissions Legend */}
                    <div className="flex flex-wrap items-center gap-4 mb-6 bg-black/20 px-4 py-3 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Match Legend:</span>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                        <span className="text-[10px] text-slate-400"><strong className="text-slate-300">Safety</strong> (Highly likely)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
                        <span className="text-[10px] text-slate-400"><strong className="text-slate-300">Target</strong> (Perfect match)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]"></span>
                        <span className="text-[10px] text-slate-400"><strong className="text-slate-300">Reach</strong> (Competitive stretch)</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {result.recommendedColleges.length === 0 ? (
                        <div className="bg-black/40 border border-rose-500/30 rounded-2xl p-6 text-center shadow-sm">
                          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
                          <h4 className="text-white font-bold mb-2">No Matching Universities Found</h4>
                          <p className="text-sm text-slate-400">
                            Our database currently has no universities in the selected country that match this specific academic domain and CGPA criteria. Please verify the target country or expand the student's options.
                          </p>
                        </div>
                      ) : (
                        result.recommendedColleges.map((uni, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setExpandedCollegeIdx(expandedCollegeIdx === idx ? null : idx)}
                          className="group bg-black/40 hover:bg-[#1A1A1D] border border-white/5 hover:border-indigo-500/30 rounded-2xl p-5 transition-all shadow-sm cursor-pointer"
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h5 className="text-base font-black text-white group-hover:text-indigo-400 transition-colors">
                                  {uni.name}
                                </h5>
                                <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md border
                                  ${uni.category === "Reach" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : 
                                    uni.category === "Target" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}
                                >
                                  {uni.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" /> {uni.location}
                              </p>
                              
                              <div className="bg-black/30 rounded-xl p-3 border border-white/5 mb-4">
                                <p className="text-xs font-bold text-slate-300 mb-1">Recommended Course:</p>
                                <p className="text-sm font-medium text-fuchsia-300">{uni.recommendedCourse}</p>
                              </div>
                              
                              <p className="text-sm text-slate-400 leading-relaxed border-l-2 border-white/10 pl-3 italic">
                                "{uni.rationale}"
                              </p>
                            </div>
                            
                            <div className="md:w-32 flex flex-col items-end justify-center shrink-0">
                              <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="32" cy="32" r="28" fill="none" className="stroke-white/5" strokeWidth="6" />
                                  <circle 
                                    cx="32" cy="32" r="28" fill="none" 
                                    className={`stroke-current ${uni.matchPercentage > 85 ? 'text-emerald-400' : uni.matchPercentage > 75 ? 'text-amber-400' : 'text-rose-400'}`}
                                    strokeWidth="6" 
                                    strokeDasharray="175" 
                                    strokeDashoffset={175 - (175 * uni.matchPercentage) / 100}
                                    strokeLinecap="round" 
                                  />
                                </svg>
                                <span className="absolute text-sm font-black text-white">{uni.matchPercentage}%</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Match Score</span>
                            </div>
                          </div>
                          
                          {/* Expanded Details */}
                          {expandedCollegeIdx === idx && (
                            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-5 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tuition</p>
                                <p className="text-sm font-black text-indigo-300">
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: uni.currency || 'USD', maximumFractionDigits: 0 }).format(uni.tuition)}/yr
                                  <span className="block text-xs font-bold text-emerald-400 mt-1">{uni.tuitionConverted}</span>
                                </p>
                              </div>
                              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Deadline</p>
                                <p className="text-sm font-black text-rose-300">{uni.applicationDeadline}</p>
                              </div>
                              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Acceptance</p>
                                <p className="text-sm font-black text-indigo-300">{uni.acceptanceRate}</p>
                              </div>
                              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Min. CGPA</p>
                                <p className="text-sm font-black text-indigo-300">{uni.minCgpa.toFixed(1)}/10</p>
                              </div>
                              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Setting</p>
                                <p className="text-sm font-black text-indigo-300">{uni.campusSetting}</p>
                              </div>
                              
                              <div className="col-span-2 md:col-span-5 bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/10 mt-2">
                                <p className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest mb-2">Program Details</p>
                                <p className="text-sm text-slate-300 leading-relaxed mb-3">{uni.courseDetails}</p>
                                <div className="flex flex-wrap gap-2">
                                  {uni.notablePrograms?.map((prog, pIdx) => (
                                    <span key={pIdx} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-400 font-medium">
                                      {prog}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )))}
                    </div>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                      <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Key Strengths
                      </h4>
                      <ul className="space-y-2">
                        {result.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                      <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Areas to Improve
                      </h4>
                      <ul className="space-y-2">
                        {result.areasForImprovement.map((a, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-rose-500 mt-0.5">•</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5" /> Career Horizons
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.careerOpportunities.map((c, i) => (
                          <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-slate-300">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>


                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )}

        {activeTab === "dashboard" && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto custom-scrollbar pr-2">
            <header className="mb-8 shrink-0">
              <h2 className="text-3xl font-black text-white">Global Dashboard</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">Live metrics from Learn Overseas On-Premise Server</p>
            </header>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
              {[
                { title: "Total Students Analyzed", value: totalStudents.toLocaleString(), trend: "Live", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
                { title: "Avg. Match Success", value: avgMatch, trend: "Overall", icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { title: "Top Target Country", value: topCountry, trend: "Highest Demand", icon: Globe, color: "text-indigo-400", bg: "bg-indigo-500/10" },
                { title: "System Uptime", value: "99.99%", trend: "Stable", icon: Database, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-3xl group-hover:bg-white/[0.04] transition-colors" />
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded-full text-slate-300">{stat.trend}</span>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-1">{stat.value}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.title}</p>
                </div>
              ))}
            </div>

            {/* Charts Area Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 min-h-[300px]">
              <div className="lg:col-span-2 bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6">Application Trends</h3>
                <div className="flex-1 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                  {history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={
                        Object.entries(countryCounts)
                          .map(([name, count]) => ({ name, count }))
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 5)
                      } margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#ffffff0a' }} contentStyle={{ backgroundColor: '#111113', borderColor: '#ffffff1a', borderRadius: '12px' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {Object.entries(countryCounts).slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#475569'} />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center opacity-50 border border-dashed border-white/10 rounded-2xl w-full h-full">
                      <TrendingUp className="w-12 h-12 text-indigo-500/20 group-hover:scale-110 transition-transform duration-500 mb-2" />
                      <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">No Data Yet</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6">Recent Activity</h3>
                <div className="flex flex-col gap-4">
                  {history.length === 0 ? (
                    <p className="text-sm text-slate-500">No activity yet. Analyze a student to see history.</p>
                  ) : history.slice(0, 4).map((student, i) => (
                    <div key={i} className="flex gap-4 items-center cursor-pointer group" onClick={() => handleViewStudent(student)}>
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] group-hover:scale-150 transition-transform" />
                      <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                          {student.studentDetails?.name && student.studentDetails.name !== "Unknown Student" ? student.studentDetails.name : `New ${student.studentDetails?.primaryDomain || "General"} Profile`}
                        </p>
                        <p className="text-xs text-slate-500">{student.studentDetails?.primaryDomain || "General"} • {student.studentDetails?.destinationCountry || "Global"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "roster" && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
            <header className="mb-8 shrink-0 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-white">Student Roster</h2>
                <p className="text-sm text-slate-400 font-medium mt-1">CRM pipeline & counselor assignments</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students..." 
                    className="pl-9 pr-4 py-2 bg-black/40 border border-white/5 rounded-lg text-sm text-slate-200 outline-none focus:border-indigo-500/50 w-48" 
                  />
                </div>
                
                {/* Date Filters */}
                <div className="flex items-center gap-2">
                  <input 
                    type="date"
                    value={filterFromDate}
                    onChange={(e) => setFilterFromDate(e.target.value)}
                    className="px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm text-slate-300 outline-none hover:bg-white/5"
                    title="From Date"
                  />
                  <span className="text-slate-500 text-sm">to</span>
                  <input 
                    type="date"
                    value={filterToDate}
                    onChange={(e) => setFilterToDate(e.target.value)}
                    className="px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm text-slate-300 outline-none hover:bg-white/5"
                    title="To Date"
                  />
                </div>

                {/* Term & Year Filters */}
                <div className="flex gap-2">
                  <select 
                    value={filterIntakeTerm}
                    onChange={(e) => setFilterIntakeTerm(e.target.value)}
                    className="px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm font-bold text-slate-300 hover:bg-white/5 transition-all outline-none"
                  >
                    <option value="All">All Terms</option>
                    <option value="fall">Fall</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="winter">Winter</option>
                  </select>
                  <select 
                    value={filterIntakeYear}
                    onChange={(e) => setFilterIntakeYear(e.target.value)}
                    className="px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm font-bold text-slate-300 hover:bg-white/5 transition-all outline-none"
                  >
                    <option value="All">All Years</option>
                    <option value={currentYear.toString()}>{currentYear}</option>
                    <option value={(currentYear + 1).toString()}>{currentYear + 1}</option>
                    <option value={(currentYear + 2).toString()}>{currentYear + 2}</option>
                  </select>
                </div>

                {/* Existing Domain Filter */}
                <div className="relative">
                  <select 
                    value={filterDomain}
                    onChange={(e) => setFilterDomain(e.target.value)}
                    className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2 bg-black/40 border border-white/5 rounded-lg text-sm font-bold text-slate-300 hover:bg-white/5 transition-all outline-none"
                  >
                    <option value="All">All Domains</option>
                    {uniqueDomains.map(domain => (
                      <option key={domain} value={domain}>
                        {domain.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  <Filter className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Sort Filter */}
                <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2 bg-black/40 border border-white/5 rounded-lg text-sm font-bold text-slate-300 hover:bg-white/5 transition-all outline-none"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                  <Filter className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0" />
                  <svg className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </header>

            <div className="flex-1 bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-xl">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-black/40">
                      <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Student Name</th>
                      {currentUser?.role === 'super_admin' && (
                        <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Counselor</th>
                      )}
                      <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Domain</th>
                      <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Target</th>
                      <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Date Added</th>
                      <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                      <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedHistory.length === 0 ? (
                      <tr>
                        <td colSpan={currentUser?.role === 'super_admin' ? 7 : 6} className="p-12 text-center">
                           <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                           <p className="text-sm font-medium text-slate-400">No students found matching your criteria.</p>
                           {searchQuery || filterDomain !== "All" ? (
                             <button onClick={() => {setSearchQuery(''); setFilterDomain('All')}} className="mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Clear Filters &rarr;</button>
                           ) : (
                             <button onClick={() => setActiveTab("analyzer")} className="mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Go to AI Analyzer &rarr;</button>
                           )}
                        </td>
                      </tr>
                    ) : sortedHistory.map((student, i) => {
                      const name = student.studentDetails?.name && student.studentDetails.name !== "Unknown Student" 
                        ? student.studentDetails.name 
                        : "Student Profile #" + (sortedHistory.length - i);
                      return (
                      <tr key={student.id || i} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-black text-white">
                              {name.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-slate-200">{name}</span>
                          </div>
                        </td>
                        {currentUser?.role === 'super_admin' && (
                          <td className="p-5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {student.counselorName || 'Unknown'}
                            </span>
                          </td>
                        )}
                        <td className="p-5">
                          <span className="text-sm font-bold text-slate-400 capitalize">{student.studentDetails?.primaryDomain?.replace(/_/g, ' ') || "General"}</span>
                        </td>
                        <td className="p-5">
                          <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" /> {student.studentDetails?.destinationCountry || "Global"}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className="text-sm font-medium text-slate-400">
                            {student.createdAt ? new Date(student.createdAt + 'Z').toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            }) : "Just now"}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400`}>
                            Analyzed
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleViewStudent(student)} className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg transition-all shadow-inner" title="View Profile">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleViewStudent(student)} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-lg transition-all shadow-inner" title="Edit Student">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteStudent(student)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-all shadow-inner" title="Delete Record">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden h-full max-w-7xl mx-auto w-full">
            <header className="flex items-center justify-between shrink-0">
              <div>
                <h1 className="text-3xl font-black text-white">System Settings</h1>
                <p className="text-sm text-slate-400 font-medium tracking-wide mt-1">
                  {currentUser?.role === 'super_admin' ? 'Super Admin Controls' : 'Personal Settings & Support'}
                </p>
              </div>
            </header>
            
            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
              {/* Settings Sidebar */}
              <div className="w-full lg:w-64 bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-4 flex flex-col gap-2 shrink-0 h-fit shadow-xl">
                {currentUser?.role === 'super_admin' && (
                  <>
                    <button 
                      onClick={() => setSettingsTab("users")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'users' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                      <Users className="w-4 h-4" /> User Management
                    </button>
                    <button 
                      onClick={() => setSettingsTab("security")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'security' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                      <AlertCircle className="w-4 h-4" /> Security & Access
                    </button>
                    <button 
                      onClick={() => setSettingsTab("database")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'database' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                      <Database className="w-4 h-4" /> Global Database
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setSettingsTab("preferences")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'preferences' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  <Settings className="w-4 h-4" /> Preferences
                </button>
              </div>

              {/* Settings Content Area */}
              <div className="flex-1 bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-y-auto flex flex-col shadow-xl">
                {settingsTab === 'database' && (
                  <div className="h-full">
                    <AdminDatabase />
                  </div>
                )}
                
                {settingsTab === 'users' && (
                  <div className="p-8 flex flex-col gap-8">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-6">User Management</h2>
                      
                      <div className="border border-white/5 rounded-2xl overflow-hidden shadow-2xl bg-black/20">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-black/60 border-b border-white/5">
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">ID</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">User Profile</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {appUsers.map(u => (
                              <tr key={u.id} className="hover:bg-white/[0.03] transition-colors group">
                                <td className="p-4 text-sm font-medium text-slate-500">#{u.id}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 flex items-center justify-center border border-indigo-500/20 text-indigo-300 font-black text-xs">
                                      {u.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-200">{u.name}</p>
                                      <p className="text-xs font-medium text-slate-500">@{u.username}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${u.role === 'super_admin' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                    {u.role === 'super_admin' ? 'Admin' : 'Counselor'}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                   {u.role !== 'super_admin' && (
                                     <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold transition-all" onClick={() => handleResetPassword(u.id)}>Reset Pass</button>
                                       <button className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-bold transition-all" onClick={() => handleDeleteUser(u.id)}>Remove</button>
                                     </div>
                                   )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5 border border-indigo-500/10 rounded-3xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                       <h3 className="text-sm font-bold text-indigo-300 mb-6 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                         Add New Counselor
                       </h3>
                       <div className="flex flex-col lg:flex-row gap-4 relative z-10">
                         <div className="flex-1 space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Full Name</label>
                           <input 
                             id="newUserName"
                             type="text" 
                             placeholder="e.g. John Doe" 
                             className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all shadow-inner"
                           />
                         </div>
                         <div className="flex-1 space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Username</label>
                           <input 
                             id="newUserUsername"
                             type="text" 
                             placeholder="e.g. johndoe" 
                             className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all shadow-inner"
                           />
                         </div>
                         <div className="flex-1 space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Password</label>
                           <input 
                             id="newUserPass"
                             type="password" 
                             placeholder="••••••••" 
                             className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all shadow-inner"
                           />
                         </div>
                         <div className="flex items-end pb-0.5">
                           <button 
                             onClick={() => {
                                const name = (document.getElementById('newUserName') as HTMLInputElement).value;
                                const username = (document.getElementById('newUserUsername') as HTMLInputElement).value;
                                const pass = (document.getElementById('newUserPass') as HTMLInputElement).value;
                                
                                if(name && username && pass) {
                                  handleAddUser(name, username, pass, 'counselor');
                                  (document.getElementById('newUserName') as HTMLInputElement).value = '';
                                  (document.getElementById('newUserUsername') as HTMLInputElement).value = '';
                                  (document.getElementById('newUserPass') as HTMLInputElement).value = '';
                                } else {
                                  alert("All fields are required to add a user.");
                                }
                             }}
                             className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-500/25 whitespace-nowrap h-[46px]"
                           >
                             Add User
                           </button>
                         </div>
                       </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'security' && (
                  <div className="p-8 flex flex-col gap-8 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">Security & Access</h2>
                      <p className="text-sm text-slate-400">Manage how users authenticate and protect their accounts.</p>
                    </div>

                    <div className="space-y-4 max-w-4xl">
                      {/* MFA Card */}
                      <div className="bg-[#18181B] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-500/30 transition-colors shadow-lg">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-100 mb-1">Multi-Factor Authentication (MFA)</h3>
                          <p className="text-sm text-slate-400">Require all counselors to provide a secondary time-based one-time password (TOTP) when logging in.</p>
                        </div>
                        <button 
                          onClick={() => setMfaEnabled(!mfaEnabled)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${mfaEnabled ? 'bg-indigo-500' : 'bg-slate-700'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${mfaEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      {/* Enforce Strong Pass Card */}
                      <div className="bg-[#18181B] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-500/30 transition-colors shadow-lg">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-100 mb-1">Enforce Strong Passwords</h3>
                          <p className="text-sm text-slate-400">Passwords must be at least 12 characters and include numbers, symbols, and mixed case letters.</p>
                        </div>
                        <button 
                          onClick={() => setEnforceStrongPass(!enforceStrongPass)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${enforceStrongPass ? 'bg-indigo-500' : 'bg-slate-700'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${enforceStrongPass ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      {/* Session Timeout */}
                      <div className="bg-[#18181B] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-500/30 transition-colors shadow-lg">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-100 mb-1">Session Timeout</h3>
                          <p className="text-sm text-slate-400">Automatically log users out after a period of inactivity to prevent unauthorized access.</p>
                        </div>
                        <div className="relative shrink-0 w-48">
                          <select 
                            value={sessionTimeout}
                            onChange={(e) => setSessionTimeout(e.target.value)}
                            className="w-full appearance-none bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50 shadow-inner"
                          >
                            <option value="15">15 Minutes</option>
                            <option value="30">30 Minutes</option>
                            <option value="60">1 Hour</option>
                            <option value="1440">24 Hours</option>
                            <option value="10080">7 Days</option>
                          </select>
                          <svg className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Max Failed Attempts */}
                      <div className="bg-[#18181B] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-500/30 transition-colors shadow-lg">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-100 mb-1">Max Failed Login Attempts</h3>
                          <p className="text-sm text-slate-400">Lock out a counselor account temporarily after consecutive incorrect password attempts.</p>
                        </div>
                        <div className="relative shrink-0 w-48">
                          <select 
                            value={maxFailedAttempts}
                            onChange={(e) => setMaxFailedAttempts(e.target.value)}
                            className="w-full appearance-none bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50 shadow-inner"
                          >
                            <option value="3">3 Attempts</option>
                            <option value="5">5 Attempts</option>
                            <option value="10">10 Attempts</option>
                            <option value="unlimited">Unlimited</option>
                          </select>
                          <svg className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 max-w-4xl flex justify-end">
                      <button 
                        onClick={() => saveSettings({ mfaEnabled, sessionTimeout, enforceStrongPass, maxFailedAttempts })}
                        className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-500/25"
                      >
                        Save Security Settings
                      </button>
                    </div>
                  </div>
                )}

                {settingsTab === 'preferences' && (
                  <div className="p-8 flex flex-col gap-8 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">System Preferences</h2>
                      <p className="text-sm text-slate-400">Customize the AI Engine and global agency variables.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                      {/* Agency Branding / IT Support */}
                      <div className="bg-[#18181B] border border-white/10 rounded-2xl p-8 space-y-6 hover:border-fuchsia-500/30 transition-colors shadow-lg flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-black text-fuchsia-400 mb-2 flex items-center gap-3">
                            <Briefcase className="w-5 h-5" /> {currentUser?.role === 'super_admin' ? 'Agency Branding' : 'IT Support'}
                          </h3>
                          
                          {currentUser?.role === 'super_admin' && (
                            <div className="space-y-2 mt-6">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agency Name</label>
                              <input 
                                type="text" 
                                value={agencyName}
                                onChange={(e) => setAgencyName(e.target.value)}
                                className="w-full px-4 py-3 bg-[#0A0A0B] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-fuchsia-500/50 shadow-inner"
                              />
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          <a 
                            href="https://it.learnoverseas.co.in/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-fuchsia-400 hover:text-fuchsia-300 font-bold transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open IT Support Portal
                          </a>
                        </div>
                      </div>

                      {/* Config or Password Reset */}
                      {currentUser?.role === 'super_admin' ? (
                        <div className="bg-[#18181B] border border-white/10 rounded-2xl p-8 space-y-6 hover:border-indigo-500/30 transition-colors shadow-lg">
                          <h3 className="text-lg font-black text-indigo-400 mb-2 flex items-center gap-3">
                            <BrainCircuit className="w-5 h-5" /> AI Configuration
                          </h3>
                          
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis Strictness</label>
                            <div className="relative">
                              <select 
                                value={aiStrictness}
                                onChange={(e) => setAiStrictness(e.target.value)}
                                className="w-full appearance-none px-4 py-3 bg-[#0A0A0B] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-indigo-500/50 shadow-inner"
                              >
                                <option value="lenient">Lenient (Optimistic Matching)</option>
                                <option value="standard">Standard (Balanced)</option>
                                <option value="strict">Strict (Highly Realistic)</option>
                              </select>
                              <svg className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Controls how aggressively the AI filters universities based on student profiles and acceptance rates.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#18181B] border border-white/10 rounded-2xl p-8 space-y-6 hover:border-indigo-500/30 transition-colors shadow-lg flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-black text-indigo-400 mb-2 flex items-center gap-3">
                              <Key className="w-5 h-5" /> Account Security
                            </h3>
                            <p className="text-sm text-slate-400 mt-2">
                              Update your password to keep your account secure.
                            </p>
                          </div>
                          <div className="pt-2">
                            <button 
                              onClick={() => handleResetPassword(currentUser.id)}
                              className="px-6 py-2.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 font-bold rounded-xl text-sm transition-colors w-full"
                            >
                              Reset My Password
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {currentUser?.role === 'super_admin' && (
                      <div className="pt-2 max-w-4xl flex justify-end">
                        <button 
                          onClick={() => saveSettings({ agencyName, aiStrictness })}
                          className="px-6 py-2.5 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-fuchsia-500/25"
                        >
                          Save Preferences
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
