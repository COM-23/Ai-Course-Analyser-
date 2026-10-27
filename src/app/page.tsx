"use client";
import { useState, useRef, useEffect, Fragment } from "react";
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
  Download,
  ExternalLink,
  DollarSign,
  Calendar,
  Coins,
  RefreshCw
} from "lucide-react";
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ReportPDFView } from "@/components/ReportPDFView";
import { BRAND_LOGO_DARK, BRAND_LOGO_LIGHT } from "@/lib/brandLogos";

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
  courseLink?: string;
};

type AnalysisResult = {
  id?: number;
  comparisonData?: any[];
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

const FALLBACK_FX_RATES: Record<string, number> = {
  USD: 1,
  INR: 94.90,
  EUR: 0.892,
  GBP: 0.747,
  CAD: 1.401,
  AUD: 1.425,
  NZD: 1.760,
  AED: 3.673,
  SGD: 1.277,
  MYR: 4.083,
  CHF: 0.821,
  SEK: 9.910,
  JPY: 156.92,
  HKD: 7.837,
  CNY: 6.688,
  SAR: 3.750,
  KRW: 1324.95,
  THB: 33.73,
  IDR: 18082.48,
  MUR: 47.27,
  BHD: 0.376,
  GEL: 2.60,
  PLN: 3.90,
  DKK: 6.67,
  NOK: 9.34,
  HUF: 365.20,
  CZK: 23.40,
  TRY: 34.25,
  VND: 25450,
  KZT: 485.50,
  QAR: 3.64,
  KWD: 0.31,
  OMR: 0.385,
  ZAR: 16.50
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "AU$",
  NZD: "NZ$",
  AED: "AED ",
  SGD: "S$",
  MYR: "RM ",
  CHF: "CHF ",
  SEK: "kr ",
  DKK: "kr ",
  NOK: "kr ",
  JPY: "¥",
  HKD: "HK$",
  CNY: "¥",
  SAR: "SAR ",
  KRW: "₩",
  THB: "฿",
  IDR: "Rp ",
  MUR: "₨ ",
  BHD: "BD ",
  GEL: "₾",
  PLN: "zł ",
  HUF: "Ft ",
  CZK: "Kč ",
  TRY: "₺",
  VND: "₫",
  KZT: "₸ ",
  QAR: "QR ",
  KWD: "KD ",
  OMR: "OMR ",
  ZAR: "R ",
};

const CURRENCY_LIST = [
  { code: "NATIVE", label: "🌐 Native University Currency (with Live ₹ INR)" },
  { code: "INR", label: "🇮🇳 India — INR ₹ (Lakhs)" },
  { code: "USD", label: "🇺🇸 United States — USD ($)" },
  { code: "EUR", label: "🇪🇺 European Union — EUR (€)" },
  { code: "GBP", label: "🇬🇧 United Kingdom — GBP (£)" },
  { code: "CAD", label: "🇨🇦 Canada — CAD (CA$)" },
  { code: "AUD", label: "🇦🇺 Australia — AUD (AU$)" },
  { code: "NZD", label: "🇳🇿 New Zealand — NZD (NZ$)" },
  { code: "AED", label: "🇦🇪 UAE / Dubai — AED (Dirham)" },
  { code: "SGD", label: "🇸🇬 Singapore — SGD (S$)" },
  { code: "MYR", label: "🇲🇾 Malaysia — MYR (Ringgit RM)" },
  { code: "CHF", label: "🇨🇭 Switzerland — CHF (Swiss Franc)" },
  { code: "SEK", label: "🇸🇪 Sweden — SEK (Krona kr)" },
  { code: "DKK", label: "🇩🇰 Denmark — DKK (Krone kr)" },
  { code: "NOK", label: "🇳🇴 Norway — NOK (Krone kr)" },
  { code: "JPY", label: "🇯🇵 Japan — JPY (Yen ¥)" },
  { code: "HKD", label: "🇭🇰 Hong Kong — HKD (HK$)" },
  { code: "CNY", label: "🇨🇳 China — CNY (Yuan ¥)" },
  { code: "SAR", label: "🇸🇦 Saudi Arabia — SAR (Riyal)" },
  { code: "KRW", label: "🇰🇷 South Korea — KRW (Won ₩)" },
  { code: "THB", label: "🇹🇭 Thailand — THB (Baht ฿)" },
  { code: "IDR", label: "🇮🇩 Indonesia — IDR (Rupiah Rp)" },
  { code: "MUR", label: "🇲🇺 Mauritius — MUR (Rupee ₨)" },
  { code: "BHD", label: "🇧🇭 Bahrain — BHD (Dinar BD)" },
  { code: "GEL", label: "🇬🇪 Georgia — GEL (Lari ₾)" },
  { code: "PLN", label: "🇵🇱 Poland — PLN (Zloty zł)" },
  { code: "HUF", label: "🇭🇺 Hungary — HUF (Forint Ft)" },
  { code: "CZK", label: "🇨🇿 Czech Republic — CZK (Koruna Kč)" },
  { code: "TRY", label: "🇹🇷 Turkey — TRY (Lira ₺)" },
  { code: "VND", label: "🇻🇳 Vietnam — VND (Dong ₫)" },
  { code: "KZT", label: "🇰🇿 Kazakhstan — KZT (Tenge ₸)" },
  { code: "QAR", label: "🇶🇦 Qatar — QAR (Riyal QR)" },
  { code: "KWD", label: "🇰🇼 Kuwait — KWD (Dinar KD)" },
  { code: "OMR", label: "🇴🇲 Oman — OMR (Rial OMR)" },
  { code: "ZAR", label: "🇿🇦 South Africa — ZAR (Rand R)" },
];

function formatTuitionDisplay(uni: any, viewCurrency: string, fxRates: Record<string, number>) {
  const origCurrency = (uni.currency || 'USD').toUpperCase().trim();
  let origTuition = 0;
  if (typeof uni.tuition === 'number') {
    origTuition = uni.tuition;
  } else if (typeof uni.tuition === 'string') {
    origTuition = parseFloat(uni.tuition.replace(/[^\d.]/g, '')) || 0;
  }

  if (origTuition === 0) {
    return {
      primary: "Tuition-Free (€0)",
      secondary: "No tuition fee required"
    };
  }

  const activeRates = { ...FALLBACK_FX_RATES, ...fxRates };
  const fromRate = activeRates[origCurrency] || 1;
  const usdVal = origTuition / fromRate;
  const inrRate = activeRates.INR || 94.90;
  const inrVal = usdVal * inrRate;
  const inrLakhs = (inrVal / 100000).toFixed(1);

  let formattedOrig = `${origCurrency} ${origTuition.toLocaleString()}`;
  try {
    formattedOrig = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: origCurrency,
      maximumFractionDigits: 0
    }).format(origTuition);
  } catch {}

  // 1. Default NATIVE view:
  if (viewCurrency === 'NATIVE') {
    return {
      primary: formattedOrig + ' / yr',
      secondary: origCurrency === 'INR' ? 'Domestic Tuition' : `≈ ₹${inrLakhs} Lakhs / yr (Real-time FX)`
    };
  }

  // 2. User selected INR:
  if (viewCurrency === 'INR') {
    return {
      primary: `₹${inrLakhs} Lakhs / yr`,
      secondary: origCurrency !== 'INR' ? `Orig: ${formattedOrig} / yr` : 'Indian Rupee'
    };
  }

  // 3. User selected ANY global currency (USD, EUR, GBP, CAD, AUD, NZD, AED, SGD, MYR, JPY, etc.):
  const targetRate = activeRates[viewCurrency] || FALLBACK_FX_RATES[viewCurrency] || 1;
  const targetVal = Math.round(usdVal * targetRate);

  let formattedTarget = '';
  try {
    formattedTarget = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: viewCurrency,
      maximumFractionDigits: 0
    }).format(targetVal);
  } catch {
    const sym = CURRENCY_SYMBOLS[viewCurrency] || (viewCurrency + ' ');
    formattedTarget = `${sym}${targetVal.toLocaleString()}`;
  }

  return {
    primary: `${formattedTarget} / yr`,
    secondary: origCurrency !== viewCurrency 
      ? `Orig: ${formattedOrig} (≈ ₹${inrLakhs}L)` 
      : `≈ ₹${inrLakhs} Lakhs / yr`
  };
}

function renderDeadlinePills(deadlineStr: string, targetIntake?: string) {
  if (!deadlineStr || deadlineStr === 'Rolling' || deadlineStr === 'Rolling Admissions') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        ⚡ Rolling Admissions
      </div>
    );
  }

  // Multi-intake deadlines (e.g. 'Sep: 26 Feb, Jan: 01 Jul' or 'Aug: ASAP' or 'Fall(Aug): 26 Feb, Spring(Jan): 29 Sep')
  if (deadlineStr.includes(':')) {
    const parts = deadlineStr.split(/,\s*/);
    const targetLower = (targetIntake || '').toLowerCase();

    return (
      <div className="flex flex-col gap-1.5 min-w-[170px]">
        {parts.map((part, pIdx) => {
          const [rawIntake, rawDate] = part.split(':').map(s => s.trim());
          if (!rawIntake || !rawDate) return <span key={pIdx} className="text-xs text-rose-300 font-bold">{part}</span>;

          let intakeLabel = rawIntake;
          let intakeIcon = '🎓';
          if (/^sep/i.test(rawIntake)) { intakeLabel = 'Sep (Fall Intake)'; intakeIcon = '🍂'; }
          else if (/^aug/i.test(rawIntake)) { intakeLabel = 'Aug (Fall Intake)'; intakeIcon = '🍂'; }
          else if (/^jan/i.test(rawIntake)) { intakeLabel = 'Jan (Spring Intake)'; intakeIcon = '🌱'; }
          else if (/^feb/i.test(rawIntake)) { intakeLabel = 'Feb (Spring Intake)'; intakeIcon = '🌱'; }
          else if (/^may/i.test(rawIntake)) { intakeLabel = 'May (Summer Intake)'; intakeIcon = '☀️'; }
          else if (/^jun|jul/i.test(rawIntake)) { intakeLabel = `${rawIntake} (Summer Intake)`; intakeIcon = '☀️'; }
          else if (/^oct|nov|dec/i.test(rawIntake)) { intakeLabel = `${rawIntake} (Winter Intake)`; intakeIcon = '❄️'; }
          else if (/fall/i.test(rawIntake)) { intakeLabel = 'Fall Intake'; intakeIcon = '🍂'; }
          else if (/spring/i.test(rawIntake)) { intakeLabel = 'Spring Intake'; intakeIcon = '🌱'; }

          const isTarget = targetLower && (
            (targetLower.includes('fall') && (/sep|aug|fall/i.test(rawIntake))) ||
            (targetLower.includes('spring') && (/jan|feb|spring|winter/i.test(rawIntake))) ||
            (targetLower.includes('summer') && (/may|jun|jul|summer/i.test(rawIntake)))
          );

          const isAsap = /asap/i.test(rawDate);

          return (
            <div
              key={pIdx}
              className={`p-2 rounded-xl border text-[11px] transition-all ${
                isTarget 
                  ? 'bg-gradient-to-r from-[#FC7133]/25 to-[#F9D440]/15 border-[#FC7133]/60 text-white shadow-[0_0_12px_rgba(252,113,51,0.3)] ring-1 ring-[#FC7133]/50' 
                  : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-[10.5px] flex items-center gap-1.5">
                  <span>{intakeIcon}</span>
                  <span className={isTarget ? 'text-[#FC7133] font-black' : 'text-slate-300'}>{intakeLabel}</span>
                </span>
                {isTarget && (
                  <span className="text-[8.5px] font-black uppercase px-1.5 py-0.5 bg-[#FC7133] text-black rounded font-mono shadow-sm">
                    TARGET
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] bg-black/30 px-2 py-1 rounded-lg border border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Deadline:</span>
                <span className={`font-black whitespace-nowrap ${isTarget ? 'text-[#F9D440]' : isAsap ? 'text-amber-400' : 'text-rose-400'}`}>
                  {isAsap ? '⚡ ASAP (Apply Now)' : rawDate}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Single date or date range format (e.g. 'Dec 15 - Jan 15')
  return (
    <div className="inline-flex flex-col p-2 rounded-xl bg-black/40 border border-white/10 text-[11px] min-w-[140px] shadow-sm">
      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
        📅 Application Window
      </span>
      <span className="font-black text-rose-400 text-xs">
        {deadlineStr}
      </span>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "analyzer" | "roster" | "settings">("analyzer");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [settingsTab, setSettingsTab] = useState<"users" | "security" | "preferences" | "database">("users");
  
  // Real-time Currency Conversion & View State
  const [currencyView, setCurrencyView] = useState<string>("NATIVE");
  const [fxRates, setFxRates] = useState<Record<string, number>>(FALLBACK_FX_RATES);
  const [fxLiveUpdated, setFxLiveUpdated] = useState<boolean>(false);

  useEffect(() => {
    // 1. Fetch from Next.js server route
    fetch('/api/currency')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data?.rates && data.rates.INR) {
          setFxRates(data.rates);
          setFxLiveUpdated(true);
        }
      })
      .catch(err => {
        console.warn('[FX] Server currency route unavailable, trying direct client fetch...', err);
        // 2. Direct browser fallback to open.er-api.com
        fetch('https://open.er-api.com/v6/latest/USD')
          .then(res => res.json())
          .then(data => {
            if (data?.rates && data.rates.INR) {
              setFxRates(prev => ({ ...prev, ...data.rates }));
              setFxLiveUpdated(true);
            }
          })
          .catch(() => {
            // 3. Direct browser fallback to Cloudflare Pages CDN
            fetch('https://latest.currency-api.pages.dev/v1/currencies/usd.json')
              .then(res => res.json())
              .then(data => {
                if (data?.usd) {
                  const upper: Record<string, number> = {};
                  for (const [k, v] of Object.entries(data.usd)) upper[k.toUpperCase()] = v as number;
                  setFxRates(prev => ({ ...prev, ...upper }));
                  setFxLiveUpdated(true);
                }
              })
              .catch(() => {
                console.warn('[FX] All live FX providers unreachable. Running on offline 2026 market rates.');
              });
          });
      });
  }, []);
  
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
  const [appendMode, setAppendMode] = useState(false);
  const [realtimeFetching, setRealtimeFetching] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedCollegeIdx, setExpandedCollegeIdx] = useState<number | null>(null);
  const [compareResults, setCompareResults] = useState<AnalysisResult[]>([]);
  const [compareExpandedCollegeIdx, setCompareExpandedCollegeIdx] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareCountries, setCompareCountries] = useState<string[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareProgress, setCompareProgress] = useState(0);
  const [activeCompareTab, setActiveCompareTab] = useState(0);
  // Legacy compat shim so existing code that reads compareResult still works
  const compareResult = compareResults[activeCompareTab] ?? null;
  const setCompareResult = (r: AnalysisResult | null) => {
    if (r) setCompareResults(prev => { const next = [...prev]; next[activeCompareTab] = r; return next; });
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDomain, setFilterDomain] = useState("All");
  const [filterExactCourse, setFilterExactCourse] = useState("All");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [filterIntakeTerm, setFilterIntakeTerm] = useState("All");
  const [filterIntakeYear, setFilterIntakeYear] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
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
  const [customAiEndpoint, setCustomAiEndpoint] = useState("");
  const [aiHealthStatus, setAiHealthStatus] = useState<any>(null);
  const [isCheckingAi, setIsCheckingAi] = useState(false);

  // Restore custom AI endpoint and strictness from localStorage immediately on client mount
  useEffect(() => {
    try {
      const savedEndpoint = localStorage.getItem('learn_overseas_custom_ai_endpoint');
      if (savedEndpoint) {
        setCustomAiEndpoint(savedEndpoint);
      }
      const savedStrictness = localStorage.getItem('learn_overseas_ai_strictness');
      if (savedStrictness) {
        setAiStrictness(savedStrictness);
      }
      const savedAgency = localStorage.getItem('learn_overseas_agency_name');
      if (savedAgency) {
        setAgencyName(savedAgency);
      }
    } catch (e) {}
  }, []);

  const checkAiHealth = async (endpointOverride?: string) => {
    setIsCheckingAi(true);
    try {
      let savedEp = "";
      try {
        savedEp = localStorage.getItem('learn_overseas_custom_ai_endpoint') || "";
      } catch (e) {}
      const ep = endpointOverride !== undefined ? endpointOverride : (customAiEndpoint || savedEp);
      const url = ep ? `/api/health?endpoint=${encodeURIComponent(ep)}` : '/api/health';
      const res = await fetch(url, {
        headers: ep ? { 'x-ai-endpoint': ep } : {}
      });
      const data = await res.json();
      setAiHealthStatus(data?.aiServer);
      // Only set customAiEndpoint if neither state nor localStorage has an endpoint
      if (data?.aiServer?.endpoint && !customAiEndpoint && !savedEp) {
        setCustomAiEndpoint(data.aiServer.endpoint);
        try {
          localStorage.setItem('learn_overseas_custom_ai_endpoint', data.aiServer.endpoint);
        } catch (e) {}
      }
    } catch (e: any) {
      setAiHealthStatus({ status: 'unreachable', error: e?.message });
    } finally {
      setIsCheckingAi(false);
    }
  };

  const reportRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    if (!result) return;
    setIsExporting(true);
    
    try {
      // Allow DOM tick for export element to render
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const targetElement = exportRef.current || reportRef.current;
      if (!targetElement) {
        throw new Error("Report element is not available for export");
      }
      
      const isDark = theme === "dark";
      const bgColor = isDark ? "#0D0E12" : "#FFFFFF";
      
      const imgData = await htmlToImage.toPng(targetElement, {
        backgroundColor: bgColor,
        pixelRatio: 2,
        cacheBust: true,
        style: {
          visibility: "visible",
          opacity: "1",
        }
      });
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const nodeWidth = targetElement.offsetWidth || 1100;
      const nodeHeight = targetElement.offsetHeight || 1600;
      const pdfHeight = (nodeHeight * pdfWidth) / nodeWidth;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      
      // Explicitly stamp the high-resolution Learn Overseas logo directly onto the header box of Page 1
      // Image 2 (BRAND_LOGO_LIGHT) for Light Theme, Image 3 (BRAND_LOGO_DARK) for Dark Theme
      const logoData = isDark ? BRAND_LOGO_DARK : BRAND_LOGO_LIGHT;
      const scale = pdfWidth / nodeWidth;
      const boxCenter_x = (56 + 34) * scale;
      const boxCenter_y = (48 + 6 + 32 + 34) * scale;
      const logoSize = 48 * scale;
      const logoX = boxCenter_x - (logoSize / 2);
      const logoY = boxCenter_y - (logoSize / 2);
      
      pdf.addImage(logoData, "PNG", logoX, logoY, logoSize, logoSize, undefined, "FAST");
      
      let heightLeft = pdfHeight - pdfPageHeight;
      let position = -pdfPageHeight;
      
      while (heightLeft > 2) {
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight, undefined, "FAST");
        heightLeft -= pdfPageHeight;
        position -= pdfPageHeight;
      }
      
      const activeRes = activeCompareTab === -1 ? result : (compareResults[activeCompareTab] ?? result);
      const studentName = activeRes?.studentDetails?.name?.replace(/\s+/g, "_") || "Student";
      const themeTag = isDark ? "Dark" : "Light";
      pdf.save(`${studentName}_Learn_Overseas_Report_${themeTag}.pdf`);
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
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(err => console.error('Auth error:', err));
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
    fetch('/api/settings', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.mfaEnabled !== undefined) setMfaEnabled(data.mfaEnabled);
          if (data.sessionTimeout) setSessionTimeout(data.sessionTimeout);
          if (data.enforceStrongPass !== undefined) setEnforceStrongPass(data.enforceStrongPass);
          if (data.maxFailedAttempts) setMaxFailedAttempts(data.maxFailedAttempts);
          
          if (data.agencyName) setAgencyName(data.agencyName);
          if (data.aiStrictness) setAiStrictness(data.aiStrictness);
          let localEp = "";
          try { localEp = localStorage.getItem('learn_overseas_custom_ai_endpoint') || ""; } catch (e) {}
          if (!localEp && data.aiEndpoint) setCustomAiEndpoint(data.aiEndpoint);
        }
      })
      .catch(err => console.error('Error fetching settings:', err));

    // Perform background health check
    checkAiHealth();
  }, [currentUser]);

  const saveSettings = async (payload: any) => {
    try {
      if (payload.aiEndpoint !== undefined) {
        try { localStorage.setItem('learn_overseas_custom_ai_endpoint', payload.aiEndpoint); } catch (e) {}
      }
      if (payload.aiStrictness !== undefined) {
        try { localStorage.setItem('learn_overseas_ai_strictness', payload.aiStrictness); } catch (e) {}
      }
      if (payload.agencyName !== undefined) {
        try { localStorage.setItem('learn_overseas_agency_name', payload.agencyName); } catch (e) {}
      }
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (payload.aiEndpoint) {
        checkAiHealth(payload.aiEndpoint);
      }
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Settings saved successfully!');
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    
    let deletedIds: any[] = [];
    try {
      const rawDeleted = localStorage.getItem('learn_overseas_deleted_ids');
      if (rawDeleted) deletedIds = JSON.parse(rawDeleted);
    } catch (e) {}

    // First load from localStorage immediately for instantaneous UI render
    let cached: AnalysisResult[] = [];
    try {
      const rawCached = localStorage.getItem('learn_overseas_students');
      if (rawCached) {
        cached = (JSON.parse(rawCached) as AnalysisResult[]).filter((s: any) => !deletedIds.includes(s.id));
        setHistory(cached);
      }
    } catch (e) {}

    fetch(`/api/students`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter out any explicitly deleted IDs
          const cleanServerData = data.filter((s: any) => !deletedIds.includes(s.id));
          
          // Merge server data with any locally cached students/comparisons
          const mergedMap = new Map<any, AnalysisResult>();
          for (const s of cleanServerData) {
            mergedMap.set(s.id, s);
          }
          for (const c of cached) {
            if (!deletedIds.includes(c.id)) {
              const existing = mergedMap.get(c.id);
              if (!existing) {
                mergedMap.set(c.id, c);
              } else if (c.comparisonData && c.comparisonData.length > 0 && (!existing.comparisonData || existing.comparisonData.length === 0)) {
                mergedMap.set(c.id, { ...existing, comparisonData: c.comparisonData });
              }
            }
          }
          const finalRoster = Array.from(mergedMap.values()).sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });
          setHistory(finalRoster);
          try {
            localStorage.setItem('learn_overseas_students', JSON.stringify(finalRoster));
          } catch (e) {}
        }
      })
      .catch(err => console.error('Error fetching history:', err));
  }, [currentUser]);

  const standardDomains = [
    "science_technology", "business_management", "commerce_management", 
    "arts_humanities", "arts_humanities_social_sciences", "medicine_allied_health", 
    "law", "education", "hospitality_tourism_events", 
    "performing_arts_media", "agricultural_sciences", "agriculture_veterinary"
  ];
  
  const historyDomains = history.map(h => h.studentDetails?.primaryDomain || "General");
  const uniqueDomains = Array.from(new Set([...standardDomains, ...historyDomains]));

  const historyExactCourses = history.map(h => (h.studentDetails as any)?.exactCourse).filter(Boolean);
  const uniqueExactCourses = Array.from(new Set(historyExactCourses));

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
      let pdfBase64 = null;
      if (inputType === "pdf" && file) {
        pdfBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      
      const context = inputType === "text" ? manualText + "\n\n" + additionalContext : additionalContext;
      
      const payload = {
        pdfBase64,
        additionalContext: context,
        destinationCountry,
        targetIntake: intake,
        counselorId: currentUser ? currentUser.id : 1,
        realtimeFetching,
        existingColleges: appendMode && result ? result.recommendedColleges : undefined,
        aiEndpoint: customAiEndpoint || (typeof window !== 'undefined' ? localStorage.getItem('learn_overseas_custom_ai_endpoint') || '' : ''),
        aiStrictness
      };

      let res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok && (res.status === 502 || res.status === 504)) {
        // Transparent auto-retry after 1.2s for transient serverless cold starts
        await new Promise(r => setTimeout(r, 1200));
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = `Server error (${res.status})`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error) errMsg = errJson.error;
        } catch {
          const lower = errText.toLowerCase();
          if (lower.includes("<html") || lower.includes("<!doctype") || lower.includes("<title>")) {
            errMsg = `Server Timeout (${res.status}): The request timed out. Please try again.`;
          } else if (errText) {
            errMsg = errText.slice(0, 300);
          }
        }
        throw new Error(errMsg);
      }

      const data = await res.json();

      if (data.dbError) {
        alert("CRITICAL WARNING: The AI analysis succeeded, but saving to the database FAILED! Error: " + data.dbError + ". This means the student will disappear when you refresh. Please fix your database file permissions (it might be owned by root).");
      }

      setResult(data);
      setHistory(prev => {
        const existingIdx = prev.findIndex((s: any) => s.id === data.id);
        let newHistory: AnalysisResult[];
        if (existingIdx >= 0) {
          newHistory = [...prev];
          newHistory[existingIdx] = data;
        } else {
          newHistory = [data, ...prev];
        }
        try {
          localStorage.setItem('learn_overseas_students', JSON.stringify(newHistory));
        } catch (e) {}
        return newHistory;
      }); 
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };


  const handleCompareAnalyze = async () => {
    if (inputType === "pdf" && !file) return;
    if (compareCountries.length === 0) return;
    setCompareExpandedCollegeIdx(null);
    setCompareLoading(true);
    setCompareProgress(0);
    setCompareResults([]);
    setActiveCompareTab(0);
    try {
      let pdfBase64: string | null = null;
      if (inputType === "pdf" && file) {
        pdfBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      const context = inputType === "text" ? manualText + "\n\n" + additionalContext : additionalContext;
      const accumulated: AnalysisResult[] = [];
      let activeStudentId = result?.id ?? null;
      
      for (let i = 0; i < compareCountries.length; i++) {
        const country = compareCountries[i];
        const payload = {
          pdfBase64,
          additionalContext: context,
          destinationCountry: country,
          targetIntake: intake,
          counselorId: currentUser ? currentUser.id : 1,
          primaryStudentId: activeStudentId,
          compareCountryIndex: i,
          totalCompareCountries: compareCountries.length,
          realtimeFetching,
          aiEndpoint: customAiEndpoint || (typeof window !== 'undefined' ? localStorage.getItem('learn_overseas_custom_ai_endpoint') || '' : ''),
          aiStrictness
        };
        let res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok && (res.status === 502 || res.status === 504)) {
          // Transparent auto-retry after 1.2s for transient serverless cold starts
          await new Promise(r => setTimeout(r, 1200));
          res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
        if (!res.ok) {
          const errText = await res.text();
          let errMsg = `Analysis failed for ${country} (${res.status})`;
          try {
            const errJson = JSON.parse(errText);
            if (errJson.error) errMsg = errJson.error;
          } catch {
            const lower = errText.toLowerCase();
            if (lower.includes("<html") || lower.includes("<!doctype") || lower.includes("<title>")) {
              errMsg = `Server Timeout for ${country} (${res.status}): The request timed out.`;
            } else if (errText) {
              errMsg = errText.slice(0, 300);
            }
          }
          throw new Error(errMsg);
        }
        const data = await res.json();
        if (data.dbError) {
          console.warn(`Saving ${country} comparison to DB had warning:`, data.dbError);
        }
        if (!activeStudentId && data.id) {
          activeStudentId = data.id;
        }
        accumulated.push(data);
        setCompareResults([...accumulated]);
        setCompareProgress(Math.round(((i + 1) / compareCountries.length) * 100));
      }

      // Attach comparisonData directly to active student result and history cache
      if (accumulated.length > 0) {
        const baseStudent = result || accumulated[0];
        const targetId = activeStudentId ?? baseStudent?.id;
        const studentWithComparison: AnalysisResult = {
          ...baseStudent,
          id: targetId,
          comparisonData: accumulated
        };

        setResult(studentWithComparison);
        setHistory(prev => {
          const exists = prev.some(s => s.id === targetId || (s.studentDetails?.name && s.studentDetails.name === baseStudent?.studentDetails?.name));
          let updated: AnalysisResult[];
          if (exists) {
            updated = prev.map(s => {
              if (s.id === targetId || (s.studentDetails?.name && s.studentDetails.name === baseStudent?.studentDetails?.name)) {
                return { ...s, comparisonData: accumulated };
              }
              return s;
            });
          } else {
            updated = [studentWithComparison, ...prev];
          }
          try {
            localStorage.setItem('learn_overseas_students', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "An unexpected error occurred in comparison.");
    } finally {
      setCompareLoading(false);
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
    setCompareMode(false);
    setCompareResults([]);
    setCompareCountries([]);
    setCompareExpandedCollegeIdx(null);
    setActiveCompareTab(-1);
    setDestinationCountry("Not Decided");
    setIntake("Not Decided");
    setInputType("pdf");
  };

  const handleViewStudent = (student: AnalysisResult) => {
    setResult(student);
    if (student.studentDetails?.originalContext) {
      setInputType("text");
      setManualText(student.studentDetails.originalContext);
      setFile(null);
      setPdfUrl(null);
    }
    if (student.comparisonData && student.comparisonData.length > 0) {
      setCompareMode(true);
      setCompareResults(student.comparisonData);
      setCompareCountries(student.comparisonData.map(c => c.compareCountry || "Unknown"));
    } else {
      setCompareMode(false);
      setCompareResults([]);
      setCompareCountries([]);
    }
    setActiveTab("analyzer");
  };

  const handleDeleteStudent = async (studentToDelete: AnalysisResult) => {
    if (studentToDelete && studentToDelete.id) {
      // Record deleted ID in localStorage so even serverless cold starts never resurrect it
      try {
        const rawDeleted = localStorage.getItem('learn_overseas_deleted_ids');
        const deletedIds = rawDeleted ? JSON.parse(rawDeleted) : [];
        if (!deletedIds.includes(studentToDelete.id)) {
          deletedIds.push(studentToDelete.id);
          localStorage.setItem('learn_overseas_deleted_ids', JSON.stringify(deletedIds));
        }
      } catch (e) {}

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
    
    setHistory(prev => {
      const updated = prev.filter(s => s !== studentToDelete && s.id !== studentToDelete.id);
      try {
        localStorage.setItem('learn_overseas_students', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (result && studentToDelete && result.id === studentToDelete.id) {
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
    const matchesExactCourse = filterExactCourse === "All" || (student.studentDetails as any)?.exactCourse === filterExactCourse;
    
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
    
    return matchesSearch && matchesFilter && matchesExactCourse && matchesDate && matchesTerm && matchesYear;
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


  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-slate-200 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FC7133]/15 blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#7DC1B1]/10 blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />
        
        <div className="w-full max-w-md relative z-10 p-8">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FC7133] via-[#F9D440] to-[#7DC1B1] p-px shadow-xl shadow-[#FC7133]/25 mx-auto mb-6">
              <div className="w-full h-full bg-[#111113] rounded-2xl flex items-center justify-center p-3">
                <img 
                  src={theme === 'light' ? "/logo-light.png" : "/logo-dark.png"} 
                  alt="Learn Overseas Logo" 
                  className={`w-9 h-9 object-contain transition-all ${theme === 'light' ? 'invert' : ''}`}
                />
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
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 transition-colors"
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
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 transition-colors"
                  placeholder="Enter password..."
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full mt-4 py-3 bg-[#FC7133] hover:bg-[#e65d20] text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-[#FC7133]/25 cursor-pointer"
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
    <>
    <div className={`min-h-screen bg-[#0A0A0B] text-slate-200 selection:bg-[#FC7133]/30 flex overflow-hidden ${theme === 'light' ? 'invert hue-rotate-180' : ''}`}>
      


      {/* Premium Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FC7133]/15 blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#7DC1B1]/10 blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />
      </div>

      {/* Global Sidebar */}
      <aside className="relative z-20 w-[240px] xl:w-[260px] bg-[#0A0A0B]/90 backdrop-blur-3xl border-r border-white/5 flex flex-col hidden lg:flex shrink-0">
        <div className="p-5 xl:p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FC7133] via-[#F9D440] to-[#7DC1B1] p-px shadow-lg shadow-[#FC7133]/20 shrink-0">
              <div className="w-full h-full bg-[#111113] rounded-xl flex items-center justify-center p-2">
                <img 
                  src={theme === 'light' ? "/logo-light.png" : "/logo-dark.png"} 
                  alt="Learn Overseas Logo" 
                  className={`w-6 h-6 object-contain transition-all ${theme === 'light' ? 'invert' : ''}`}
                />
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
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#F9D440]" /> : <Moon className="w-4 h-4 text-[#FC7133]" />}
          </button>
        </div>

        <div className="flex-1 py-5 xl:py-8 px-3 xl:px-4 flex flex-col gap-1.5 xl:gap-2">
           <button 
             onClick={() => setActiveTab("dashboard")}
             className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-[#FC7133]/15 text-[#FC7133] border border-[#FC7133]/30 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
             <LayoutDashboard className="w-4 h-4" /> Dashboard
           </button>
           <button 
             onClick={() => setActiveTab("analyzer")}
             className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'analyzer' ? 'bg-[#FC7133]/15 text-[#FC7133] border border-[#FC7133]/30 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
             <Sparkles className="w-4 h-4" /> AI Analyzer
           </button>
           <button 
             onClick={() => setActiveTab("roster")}
             className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'roster' ? 'bg-[#FC7133]/15 text-[#FC7133] border border-[#FC7133]/30 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
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
             <div className="p-4 rounded-xl bg-gradient-to-br from-[#FC7133]/10 to-[#F9D440]/10 border border-[#FC7133]/20 mb-2 flex flex-col gap-4">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-[#FC7133]/20 flex items-center justify-center border border-[#FC7133]/30 shrink-0">
                   <span className="text-xs font-black text-[#FC7133]">{currentUser.name.charAt(0)}</span>
                 </div>
                 <div className="min-w-0">
                   <h4 className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</h4>
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
      <main className="relative z-10 flex-1 flex flex-col h-screen overflow-hidden px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6 xl:py-8">
        
        {activeTab === "analyzer" && (
          <>
            {/* Header */}
        <header className="flex items-center justify-between mb-4 lg:mb-6 xl:mb-8 shrink-0">
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
              className="px-5 py-2.5 bg-[#1F1F22] hover:bg-[#FC7133]/10 text-white text-sm font-bold rounded-xl transition-all border border-[#FC7133]/40 hover:border-[#FC7133] flex items-center gap-2.5 shadow-md shadow-[#FC7133]/10 cursor-pointer"
            >
              <img 
                src={theme === 'light' ? "/logo-light.png" : "/logo-dark.png"} 
                alt="LO" 
                className={`w-4 h-4 object-contain shrink-0 ${theme === 'light' ? 'invert' : ''}`}
              />
              <span>Analyze Another Student</span>
            </button>
          </div>
        </header>

        {/* Main Interface Layout */}
        <div className="flex-1 flex gap-4 xl:gap-6 min-h-0">
          
          {/* Left Panel: Input & Controls */}
          {!compareMode && (<div className="w-full lg:w-[38%] xl:w-[40%] flex flex-col gap-4 xl:gap-6">
            
            {/* Input Selection Card */}
            <div className="bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-4 sm:p-5 xl:p-6 shadow-2xl flex flex-col min-h-0 flex-1">
              
              {/* Tabs */}
              <div className="flex p-1.5 bg-[#0a0a0c] border border-white/5 rounded-[1.25rem] mb-6 shadow-inner relative z-10">
                <button
                  onClick={() => setInputType("pdf")}
                  className={`flex-1 flex items-center justify-center py-3.5 text-sm font-semibold rounded-xl transition-all duration-500 ease-out ${
                    inputType === "pdf" 
                      ? "bg-gradient-to-r from-[#FC7133]/20 via-[#F9D440]/15 to-[#FC7133]/20 text-[#FC7133] shadow-[0_0_20px_rgba(252,113,51,0.2)] border border-[#FC7133]/40" 
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
                  }`}
                >
                  <FileText className={`w-4 h-4 mr-2 transition-colors ${inputType === "pdf" ? "text-[#FC7133]" : "text-slate-500"}`} /> PDF Upload
                </button>
                <button
                  onClick={() => setInputType("text")}
                  className={`flex-1 flex items-center justify-center py-3.5 text-sm font-semibold rounded-xl transition-all duration-500 ease-out ${
                    inputType === "text" 
                      ? "bg-gradient-to-r from-[#7DC1B1]/20 to-[#BBCDE2]/20 text-[#7DC1B1] shadow-[0_0_20px_rgba(125,193,177,0.2)] border border-[#7DC1B1]/40" 
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
                  }`}
                >
                  <BarChart className={`w-4 h-4 mr-2 transition-colors ${inputType === "text" ? "text-[#7DC1B1]" : "text-slate-500"}`} /> Manual Text
                </button>
              </div>

              {/* Data Input Area */}
              <div className="flex-1 bg-[#0a0a0c] border border-white/5 rounded-2xl overflow-hidden relative group ring-1 ring-transparent focus-within:ring-[#FC7133]/20 focus-within:border-[#FC7133]/30 transition-all duration-300 shadow-inner">
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
                        isDragging ? "bg-[#FC7133]/10 border-2 border-dashed border-[#FC7133]" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
                      <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#FC7133]/20 to-transparent flex items-center justify-center mb-6 border border-[#FC7133]/20">
                        <Upload className="w-8 h-8 text-[#FC7133]" />
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
              <label className="flex items-center gap-2 text-xs font-bold text-[#FC7133] uppercase tracking-widest mb-5">
                <Sparkles className="w-4 h-4 text-[#F9D440]" /> Targeting Parameters
              </label>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Country</label>
                  <select value={destinationCountry} onChange={(e) => setDestinationCountry(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 focus:ring-1 focus:ring-[#FC7133]/30 appearance-none cursor-pointer transition-all">
                    {["USA", "Canada", "United Kingdom", "Australia", "New Zealand", "Germany", "Spain", "France", "Ireland", "EU/Other", "UAE/Middle East", "Singapore/APJ", "Malaysia", "Other", "Italy", "Not Decided"].map(c => <option key={c} className="bg-[#1C1C1E]">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Intake</label>
                  <select value={intake} onChange={(e) => setIntake(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 focus:ring-1 focus:ring-[#FC7133]/30 appearance-none cursor-pointer transition-all">
                    {intakeOptions.map(option => (
                      <option key={option} value={option} className="bg-[#1C1C1E]">{option}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2 lg:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Budget Constraints</label>
                  <input type="text" value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} placeholder="e.g. 50 Lakhs or $60,000" className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 focus:ring-1 focus:ring-[#FC7133]/30 placeholder:text-slate-600 transition-all" />
                </div>
              </div>

              <div className="flex flex-col gap-2 py-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="appendMode" checked={appendMode} onChange={(e) => setAppendMode(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-black/40 text-[#FC7133] accent-[#FC7133] focus:ring-[#FC7133]/50 cursor-pointer" />
                  <label htmlFor="appendMode" className="text-xs text-slate-400 font-medium cursor-pointer">Append new results to current list (Side-by-side comparison)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="realtimeFetching" checked={realtimeFetching} onChange={(e) => setRealtimeFetching(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-black/40 text-[#FC7133] accent-[#FC7133] focus:ring-[#FC7133]/50 cursor-pointer" />
                  <label htmlFor="realtimeFetching" className="text-xs text-slate-400 font-medium cursor-pointer flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" /> Real-time Live Google Search <span className="text-[10px] text-slate-500">(Database has 1,522 colleges; check only for live web query)</span>
                  </label>
                </div>
              </div>

              <button 
                onClick={handleAnalyze} 
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-[#FC7133] via-[#F9D440] to-[#FC7133] p-px font-bold text-white shadow-lg shadow-[#FC7133]/25 transition-all hover:shadow-[#FC7133]/40 active:scale-[0.98] cursor-pointer"
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] bg-[length:200%_100%] animate-shine opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-xl" />
                <div className="relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FC7133] to-[#e65d20] px-6 py-4 transition-all group-hover:brightness-110 z-0">
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

          )} {/* End Left Panel */}

          {/* Right Panel: Intelligence Output */}
          <div className={`w-full ${compareMode ? "lg:w-full" : "lg:w-[62%] xl:w-[60%]"} bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full relative`}>
            
            {/* Header */}
            <div className="px-5 xl:px-8 py-4 xl:py-6 border-b border-white/5 bg-black/20 flex justify-between items-center z-10">
              <h3 className="text-lg font-black text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FC7133]/15 flex items-center justify-center border border-[#FC7133]/30">
                  <BarChart className="w-4 h-4 text-[#FC7133]" />
                </div>
                Intelligence Report
              </h3>
              {result && (
                <div className="flex gap-2">

                  <button 
                    onClick={() => { setCompareMode(!compareMode); setCompareResult(null); }}
                    className="px-3 py-1 bg-[#FC7133]/15 hover:bg-[#FC7133]/25 text-[#FC7133] border border-[#FC7133]/30 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    {compareMode ? "Close Compare" : "Side-by-Side Analysis"}
                  </button>
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

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8 custom-scrollbar">

              {compareMode && compareResults.length === 0 && (
                <div className="w-full p-6 border border-[#FC7133]/30 rounded-2xl bg-[#FC7133]/5 mb-8 animate-in fade-in duration-300">
                  <h4 className="text-sm font-bold text-[#FC7133] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span>🌍</span> Select Countries to Compare (up to 15)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
                    {["USA", "Canada", "United Kingdom", "Australia", "New Zealand", "Germany", "Spain", "France", "Ireland", "UAE/Middle East", "Singapore/APJ", "Malaysia", "Italy", "Japan"].map(c => {
                      const checked = compareCountries.includes(c);
                      return (
                        <label key={c} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all select-none text-xs font-medium ${checked ? 'bg-[#FC7133]/20 border-[#FC7133]/50 text-[#FC7133]' : 'bg-black/30 border-white/5 text-slate-400 hover:border-[#FC7133]/30'}`}>
                          <input
                            type="checkbox"
                            className="accent-[#FC7133] w-3.5 h-3.5"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setCompareCountries(prev => prev.filter(x => x !== c));
                              } else if (compareCountries.length < 15) {
                                setCompareCountries(prev => [...prev, c]);
                              }
                            }}
                          />
                          {c}
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">{compareCountries.length}/15 countries selected — each will generate 15 university matches and be saved to this student&apos;s profile.</p>
                    <button
                      onClick={handleCompareAnalyze}
                      disabled={compareLoading || compareCountries.length === 0}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#FC7133] to-[#e65d20] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-[#FC7133]/20 text-sm whitespace-nowrap"
                    >
                      {compareLoading ? `Running... ${compareProgress}%` : `Run Comparison (${compareCountries.length})`}
                    </button>
                  </div>
                  {compareLoading && (
                    <div className="mt-4">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FC7133] transition-all duration-500 rounded-full" style={{ width: `${compareProgress}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{compareProgress}% — fetching university data for each country...</p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {!result && !error && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FC7133]/20 via-[#F9D440]/10 to-[#7DC1B1]/20 p-px mb-5 shadow-xl shadow-[#FC7133]/10">
                    <div className="w-full h-full bg-[#111113] rounded-3xl flex items-center justify-center p-4">
                      <img 
                        src={theme === 'light' ? "/logo-light.png" : "/logo-dark.png"} 
                        alt="Learn Overseas" 
                        className={`w-10 h-10 object-contain opacity-80 ${theme === 'light' ? 'invert' : ''}`}
                      />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-slate-300">Awaiting Profile Data</p>
                  <p className="text-sm text-slate-500 mt-1">Upload a PDF and run analysis to view insights.</p>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center text-[#FC7133]">
                  <div className="w-12 h-12 border-4 border-[#FC7133]/20 border-t-[#FC7133] rounded-full animate-spin mb-6" />
                  <p className="text-lg font-bold animate-pulse text-[#FC7133]">Running Neural Heuristics...</p>
                  <p className="text-sm text-slate-500 mt-2">Processing profile against global database.</p>
                </div>
              )}

              {/* Country Tabs when compare results exist */}
              {compareResults.length > 0 && (
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  <button
                    onClick={() => setActiveCompareTab(-1)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCompareTab === -1 ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    🏠 Primary
                  </button>
                  {compareResults.map((cr: any, ci: number) => (
                    <button
                      key={ci}
                      onClick={() => setActiveCompareTab(ci)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeCompareTab === ci ? 'bg-[#FC7133]/25 text-[#FC7133] border border-[#FC7133]/40' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      🌍 {compareCountries[ci]}
                      <span className="px-1.5 py-0.5 bg-white/10 rounded-md text-[9px]">{cr.recommendedColleges?.length ?? 0}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => { setCompareResults([]); setActiveCompareTab(0); setCompareCountries([]); }}
                    className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all border border-rose-500/20"
                  >
                    ✕ Clear
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 w-full">
                {[activeCompareTab === -1 ? result : (compareResults.length > 0 ? (compareResults[activeCompareTab] ?? result) : result)].filter(Boolean).map((res: any, viewIdx: number) => (
                <div key={viewIdx} ref={viewIdx === 0 ? reportRef : undefined} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 -m-4 bg-[#111113] rounded-2xl">
                  
                  {/* Official Learn Overseas Report Header on screen */}
                  <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FC7133] via-[#F9D440] to-[#7DC1B1] p-px shadow-lg shadow-[#FC7133]/20 shrink-0">
                        <div className="w-full h-full bg-[#111113] rounded-2xl flex items-center justify-center p-2">
                          <img 
                            src={theme === 'light' ? "/logo-light.png" : "/logo-dark.png"} 
                            alt="Learn Overseas Logo" 
                            className={`w-7 h-7 object-contain ${theme === 'light' ? 'invert' : ''}`}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-white">LEARN OVERSEAS</h2>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FC7133]/20 text-[#FC7133] border border-[#FC7133]/30">
                            Official Report
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-400">AI Admissions & Course Intelligence</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</p>
                      <p className="text-xs font-bold text-slate-300">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>

                  {/* Student Profile Header */}
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FC7133] via-[#F9D440] to-[#7DC1B1] p-px shadow-lg shadow-[#FC7133]/20">
                      <div className="w-full h-full bg-[#111113] rounded-2xl flex items-center justify-center text-xl font-black text-white">
                        {res.studentDetails?.name ? res.studentDetails.name.charAt(0) : "U"}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">{res.studentDetails?.name || "Unknown Student"}</h2>
                      <p className="text-sm font-bold text-[#FC7133]">{res.studentDetails?.primaryDomain} Applicant</p>
                    </div>
                  </div>

                  {/* Top Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">CGPA</h5>
                      <p className="text-xl font-black text-white">{res.studentDetails?.cgpa} <span className="text-xs font-bold text-slate-600">/ 10</span></p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Degree Obj</h5>
                      <p className="text-xs font-bold text-slate-200 leading-snug">{res.studentDetails?.degreeObjective}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Country</h5>
                      <p className="text-xs font-bold text-slate-200 leading-snug">{res.studentDetails?.destinationCountry}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Target Intake</h5>
                      <p className="text-xs font-bold text-slate-200 leading-snug">{res.studentDetails?.targetIntake}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Domain</h5>
                      <p className="text-xs font-bold text-slate-200 leading-snug">{res.studentDetails?.primaryDomain}</p>
                    </div>
                    
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Work Exp</h5>
                      <p className="text-xs font-bold text-slate-200 leading-snug">{res.studentDetails?.workExperience || "None"}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Backlogs</h5>
                      <p className="text-xs font-bold text-slate-200 leading-snug">{res.studentDetails?.backlogs || "0"}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Visa Status</h5>
                      <p className="text-xs font-bold text-slate-200 leading-snug">{res.studentDetails?.visaStatus || "Not Specified"}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center lg:col-span-2">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Test Scores</h5>
                      <p className="text-xs font-bold text-slate-200 leading-snug">{res.studentDetails?.testScores}</p>
                    </div>
                  </div>

                  {/* Summary & Budget Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-gradient-to-br from-[#FC7133]/15 to-black border border-[#FC7133]/25 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FC7133]/10 blur-3xl rounded-full pointer-events-none" />
                      <h4 className="text-xs font-bold text-[#FC7133] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#F9D440]" /> Executive Summary
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                        {res.studentSummary}
                      </p>
                    </div>
                    
                    <div className="bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-center text-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-10 h-10 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                        <CircleDollarSign className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Calculated Budget</h4>
                      <p className="text-sm font-black text-emerald-400 leading-tight">
                        {res.estimatedBudgetRange}
                      </p>
                    </div>
                  </div>

                  {/* Recommendations Section */}
                  <div>
                    <h4 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#FC7133]" /> Recommended Institutions
                      <span className="ml-2 px-2.5 py-0.5 bg-white/10 text-slate-300 rounded-full text-[10px] font-bold">
                        {res.recommendedColleges.length} Matches
                      </span>
                    </h4>
                    
                    {/* Admissions Legend & Live Currency Converter */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-black/30 px-4 py-3 rounded-xl border border-white/10">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Match Legend:</span>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                          <span className="text-[10px] text-slate-400"><strong className="text-slate-300">Safety</strong> (Likely)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
                          <span className="text-[10px] text-slate-400"><strong className="text-slate-300">Target</strong> (Match)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]"></span>
                          <span className="text-[10px] text-slate-400"><strong className="text-slate-300">Reach</strong> (Stretch)</span>
                        </div>
                      </div>

                      {/* Real-Time Live Currency Switcher */}
                      <div className="flex flex-wrap items-center gap-2.5 bg-[#1A1A1D] border border-white/15 px-3.5 py-1.5 rounded-xl shadow-sm">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-[#FC7133]" /> Live Currency:
                        </span>
                        <select
                          value={currencyView}
                          onChange={(e) => setCurrencyView(e.target.value)}
                          className="bg-black/80 border border-white/20 text-xs font-bold text-emerald-400 rounded-lg px-2.5 py-1 outline-none focus:border-[#FC7133] transition-colors cursor-pointer max-w-[240px] sm:max-w-[320px]"
                          title="Convert all university tuition fees in real-time"
                        >
                          {CURRENCY_LIST.map((c) => (
                            <option key={c.code} value={c.code} className="bg-[#111113] text-slate-200">
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1.5 pl-2.5 border-l border-white/15 text-[10.5px] font-mono font-bold text-emerald-400/90">
                          <span className={`w-2 h-2 rounded-full ${fxLiveUpdated ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
                          <span>1 USD = ₹{(fxRates.INR || 94.90).toFixed(1)}</span>
                          <span className="text-[9px] text-slate-400 font-sans font-medium hidden sm:inline">(Live Market)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 w-full overflow-x-auto custom-scrollbar border border-white/10 rounded-2xl bg-[#111113]">
                      {res.recommendedColleges.length === 0 ? (
                        <div className="bg-black/40 border border-rose-500/30 rounded-2xl p-6 text-center shadow-sm">
                          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
                          <h4 className="text-white font-bold mb-2">No Matching Universities Found</h4>
                          <p className="text-sm text-slate-400">
                            Our database currently has no universities in the selected country that match this specific academic domain and CGPA criteria. Please verify the target country or expand the student's options.
                          </p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead>
                            <tr className="border-b border-white/10 bg-black/60">
                              <th className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Institution</th>
                              <th className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider text-center">Match</th>
                              <th className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider text-center">Category</th>
                              <th className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Tuition/Yr</th>
                              <th className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Deadline</th>
                              <th className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Acc. Rate</th>
                              <th className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider text-center">Min CGPA</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {res.recommendedColleges?.map((uni: any, idx: number) => (
                              <Fragment key={idx}>
                                <tr 
                                  onClick={() => { const setFn = viewIdx === 0 ? setExpandedCollegeIdx : setCompareExpandedCollegeIdx; const cur = viewIdx === 0 ? expandedCollegeIdx : compareExpandedCollegeIdx; setFn(cur === idx ? null : idx); }}
                                  className="group hover:bg-[#1A1A1D] cursor-pointer transition-colors"
                                >
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white group-hover:text-[#FC7133] transition-colors">{uni.name}</span>
                                      {uni.isLiveScraped && <span className="text-[9px] bg-[#FC7133]/20 text-[#FC7133] px-1.5 py-0.5 rounded border border-[#FC7133]/30 font-black">LIVE</span>}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-[#FC7133]" /> {uni.location}</div>
                                    {uni.courseLink && (
                                      <a
                                        href={uni.courseLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FC7133] hover:text-[#ff8f58] hover:underline mt-1.5 transition-colors"
                                        title="View official course details"
                                      >
                                        <ExternalLink className="w-3 h-3" /> View Course ↗
                                      </a>
                                    )}
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`font-black text-sm ${uni.matchPercentage > 85 ? 'text-emerald-400' : uni.matchPercentage > 75 ? 'text-amber-400' : 'text-rose-400'}`}>{uni.matchPercentage}%</span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md border
                                      ${uni.category === "Reach" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : 
                                        uni.category === "Target" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}
                                    >
                                      {uni.category}
                                    </span>
                                  </td>
                                  <td className="p-4 text-sm font-medium text-slate-300">
                                    {(() => {
                                      const feeInfo = formatTuitionDisplay(uni, currencyView, fxRates);
                                      return (
                                        <div>
                                          <span className="font-bold text-white block">{feeInfo.primary}</span>
                                          {feeInfo.secondary && (
                                            <span className="block text-[10.5px] font-bold text-emerald-400 mt-0.5">
                                              {feeInfo.secondary}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td className="p-4">
                                    {renderDeadlinePills(uni.applicationDeadline, res.studentDetails?.targetIntake || intake)}
                                  </td>
                                  <td className="p-4 text-sm font-bold text-slate-300">{uni.acceptanceRate}</td>
                                  <td className="p-4 text-sm font-black text-[#F9D440] text-center">{uni.minCgpa.toFixed(1)}</td>
                                </tr>
                                
                                {/* Expanded Details Row */}
                                {(viewIdx === 0 ? expandedCollegeIdx : compareExpandedCollegeIdx) === idx && (
                                  <tr className="bg-black/30">
                                    <td colSpan={7} className="p-6 border-b border-white/5">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Recommended Course</p>
                                          <div className="flex flex-wrap items-center gap-3 mb-5">
                                            <p className="text-sm font-black text-[#FC7133]">{uni.recommendedCourse}</p>
                                            {uni.courseLink && (
                                              <a
                                                href={uni.courseLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-[#FC7133] to-[#F9D440] hover:brightness-110 rounded-lg shadow-sm transition-all"
                                              >
                                                <ExternalLink className="w-3.5 h-3.5" /> View Official Course ↗
                                              </a>
                                            )}
                                          </div>
                                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">AI Rationale</p>
                                          <p className="text-xs text-slate-300 italic leading-relaxed border-l-2 border-[#FC7133]/50 pl-3">"{uni.rationale}"</p>
                                        </div>
                                        <div className="bg-[#FC7133]/5 rounded-xl p-4 border border-[#FC7133]/15">
                                          <p className="text-[10px] font-bold text-[#FC7133] uppercase tracking-widest mb-2">Program Details</p>
                                          <p className="text-xs text-slate-300 leading-relaxed mb-4">{uni.courseDetails}</p>
                                          <div className="flex flex-wrap gap-2">
                                            {uni.notablePrograms?.map((prog: string, pIdx: number) => (
                                              <span key={pIdx} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-400 font-medium">
                                                {prog}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                      <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Key Strengths
                      </h4>
                      <ul className="space-y-2">
                        {res.strengths?.map((s: string, i: number) => (
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
                        {res.areasForImprovement?.map((a: string, i: number) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-rose-500 mt-0.5">•</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                      <h4 className="text-[10px] font-bold text-[#FC7133] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5" /> Career Horizons
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {res.careerOpportunities?.map((c: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-slate-300">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Official Learn Overseas Report Footer on screen */}
                  <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2">
                    <p>© {new Date().getFullYear()} Learn Overseas • AI Admissions & Course Intelligence System</p>
                    <p className="text-slate-400 font-medium">Confidential Student Profile Evaluation</p>
                  </div>

                </div>
              ))}
              </div>
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
                { title: "Top Target Country", value: topCountry, trend: "Highest Demand", icon: Globe, color: "text-[#FC7133]", bg: "bg-[#FC7133]/10" },
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
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#FC7133' : '#475569'} />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center opacity-50 border border-dashed border-white/10 rounded-2xl w-full h-full">
                      <TrendingUp className="w-12 h-12 text-[#FC7133]/20 group-hover:scale-110 transition-transform duration-500 mb-2" />
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
                      <div className="w-2 h-2 rounded-full bg-[#FC7133] shadow-[0_0_8px_rgba(252,113,51,0.8)] group-hover:scale-150 transition-transform" />
                      <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-[#FC7133] transition-colors">
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
                    className="pl-9 pr-4 py-2 bg-black/40 border border-white/5 rounded-lg text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 w-48" 
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
                
                {/* Specific Course Filter */}
                {uniqueExactCourses.length > 0 && (
                  <div className="relative">
                    <select 
                      value={filterExactCourse}
                      onChange={(e) => setFilterExactCourse(e.target.value)}
                      className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2 bg-black/40 border border-white/5 rounded-lg text-sm font-bold text-slate-300 hover:bg-white/5 transition-all outline-none"
                    >
                      <option value="All">All Degrees</option>
                      {uniqueExactCourses.map(course => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                    <Filter className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}

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
                      <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Counselor</th>
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
                        <td colSpan={7} className="p-12 text-center">
                           <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                           <p className="text-sm font-medium text-slate-400">No students found matching your criteria.</p>
                           {searchQuery || filterDomain !== "All" ? (
                             <button onClick={() => {setSearchQuery(''); setFilterDomain('All')}} className="mt-4 text-xs font-bold text-[#FC7133] hover:text-[#FC7133]/80 transition-colors">Clear Filters &rarr;</button>
                           ) : (
                             <button onClick={() => setActiveTab("analyzer")} className="mt-4 text-xs font-bold text-[#FC7133] hover:text-[#FC7133]/80 transition-colors">Go to AI Analyzer &rarr;</button>
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
                        <td className="p-5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#FC7133]/10 text-[#FC7133] border border-[#FC7133]/20">
                            {student.counselorName || 'Team Counselor'}
                          </span>
                        </td>
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
                            <button onClick={() => handleViewStudent(student)} className="p-2 bg-[#FC7133]/10 hover:bg-[#FC7133]/20 border border-[#FC7133]/20 text-[#FC7133] hover:text-[#FC7133]/80 rounded-lg transition-all shadow-inner" title="View Profile">
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
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'users' ? 'bg-[#FC7133]/15 text-[#FC7133] border border-[#FC7133]/30 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                      <Users className="w-4 h-4" /> User Management
                    </button>
                    <button 
                      onClick={() => setSettingsTab("security")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'security' ? 'bg-[#FC7133]/15 text-[#FC7133] border border-[#FC7133]/30 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                      <AlertCircle className="w-4 h-4" /> Security & Access
                    </button>
                    <button 
                      onClick={() => setSettingsTab("database")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'database' ? 'bg-[#FC7133]/15 text-[#FC7133] border border-[#FC7133]/30 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                      <Database className="w-4 h-4" /> Global Database
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setSettingsTab("preferences")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'preferences' ? 'bg-[#FC7133]/15 text-[#FC7133] border border-[#FC7133]/30 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
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
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FC7133]/20 to-[#F9D440]/20 flex items-center justify-center border border-[#FC7133]/20 text-[#FC7133] font-black text-xs">
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
                                       <button className="px-3 py-1.5 bg-[#FC7133]/10 hover:bg-[#FC7133]/20 border border-[#FC7133]/20 text-[#FC7133] rounded-lg text-xs font-bold transition-all" onClick={() => handleResetPassword(u.id)}>Reset Pass</button>
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
                    
                    <div className="p-6 bg-gradient-to-br from-[#FC7133]/5 to-[#F9D440]/5 border border-[#FC7133]/15 rounded-3xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-[#FC7133]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                       <h3 className="text-sm font-bold text-[#FC7133] mb-6 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-[#FC7133] animate-pulse" />
                         Add New Counselor
                       </h3>
                       <div className="flex flex-col lg:flex-row gap-4 relative z-10">
                         <div className="flex-1 space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Full Name</label>
                           <input 
                             id="newUserName"
                             type="text" 
                             placeholder="e.g. John Doe" 
                             className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 focus:bg-black/60 transition-all shadow-inner"
                           />
                         </div>
                         <div className="flex-1 space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Username</label>
                           <input 
                             id="newUserUsername"
                             type="text" 
                             placeholder="e.g. johndoe" 
                             className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 focus:bg-black/60 transition-all shadow-inner"
                           />
                         </div>
                         <div className="flex-1 space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Password</label>
                           <input 
                             id="newUserPass"
                             type="password" 
                             placeholder="••••••••" 
                             className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 focus:bg-black/60 transition-all shadow-inner"
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
                             className="px-8 py-3 bg-[#FC7133] hover:bg-[#e65d20] text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-[#FC7133]/25 whitespace-nowrap h-[46px]"
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
                      <div className="bg-[#18181B] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#FC7133]/30 transition-colors shadow-lg">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-100 mb-1">Multi-Factor Authentication (MFA)</h3>
                          <p className="text-sm text-slate-400">Require all counselors to provide a secondary time-based one-time password (TOTP) when logging in.</p>
                        </div>
                        <button 
                          onClick={() => setMfaEnabled(!mfaEnabled)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${mfaEnabled ? 'bg-[#FC7133]' : 'bg-slate-700'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${mfaEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      {/* Enforce Strong Pass Card */}
                      <div className="bg-[#18181B] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#FC7133]/30 transition-colors shadow-lg">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-100 mb-1">Enforce Strong Passwords</h3>
                          <p className="text-sm text-slate-400">Passwords must be at least 12 characters and include numbers, symbols, and mixed case letters.</p>
                        </div>
                        <button 
                          onClick={() => setEnforceStrongPass(!enforceStrongPass)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${enforceStrongPass ? 'bg-[#FC7133]' : 'bg-slate-700'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${enforceStrongPass ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      {/* Session Timeout */}
                      <div className="bg-[#18181B] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#FC7133]/30 transition-colors shadow-lg">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-100 mb-1">Session Timeout</h3>
                          <p className="text-sm text-slate-400">Automatically log users out after a period of inactivity to prevent unauthorized access.</p>
                        </div>
                        <div className="relative shrink-0 w-48">
                          <select 
                            value={sessionTimeout}
                            onChange={(e) => setSessionTimeout(e.target.value)}
                            className="w-full appearance-none bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 shadow-inner"
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
                      <div className="bg-[#18181B] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#FC7133]/30 transition-colors shadow-lg">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-100 mb-1">Max Failed Login Attempts</h3>
                          <p className="text-sm text-slate-400">Lock out a counselor account temporarily after consecutive incorrect password attempts.</p>
                        </div>
                        <div className="relative shrink-0 w-48">
                          <select 
                            value={maxFailedAttempts}
                            onChange={(e) => setMaxFailedAttempts(e.target.value)}
                            className="w-full appearance-none bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 shadow-inner"
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
                        className="px-6 py-2.5 bg-[#FC7133] hover:bg-[#e65d20] text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-[#FC7133]/25"
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
                        <div className="bg-[#18181B] border border-white/10 rounded-2xl p-8 space-y-6 hover:border-[#FC7133]/30 transition-colors shadow-lg">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-[#FC7133] flex items-center gap-3">
                              <BrainCircuit className="w-5 h-5" /> AI Configuration & Tunnel
                            </h3>
                            <button
                              type="button"
                              onClick={() => checkAiHealth(customAiEndpoint)}
                              disabled={isCheckingAi}
                              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors flex items-center gap-1.5"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingAi ? 'animate-spin' : ''}`} />
                              {isCheckingAi ? 'Testing...' : 'Test Connection'}
                            </button>
                          </div>

                          {/* Live AI Status Pill */}
                          <div className="p-3.5 rounded-xl border bg-[#0A0A0B]/80 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${aiHealthStatus?.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                              <div>
                                <p className="text-xs font-bold text-slate-200">
                                  {aiHealthStatus?.status === 'connected'
                                    ? `AI Engine Connected (${aiHealthStatus.model || 'llama3.1'})`
                                    : 'AI Engine Offline / Disconnected'}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate max-w-xs md:max-w-md">
                                  {aiHealthStatus?.endpoint || 'No active tunnel endpoint detected'}
                                  {aiHealthStatus?.error ? ` (${aiHealthStatus.error})` : ''}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${aiHealthStatus?.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {aiHealthStatus?.status === 'connected' ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis Strictness</label>
                            <div className="relative">
                              <select 
                                value={aiStrictness}
                                onChange={(e) => setAiStrictness(e.target.value)}
                                className="w-full appearance-none px-4 py-3 bg-[#0A0A0B] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 shadow-inner"
                              >
                                <option value="lenient">Lenient (Optimistic Matching)</option>
                                <option value="standard">Standard (Balanced)</option>
                                <option value="strict">Strict (Highly Realistic)</option>
                              </select>
                              <svg className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Controls how aggressively the AI filters universities based on student profiles and acceptance rates.</p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cloud AI Endpoint (Tunnel URL)</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={customAiEndpoint}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomAiEndpoint(val);
                                  try {
                                    localStorage.setItem('learn_overseas_custom_ai_endpoint', val);
                                  } catch (err) {}
                                }}
                                placeholder="https://your-tunnel.trycloudflare.com/api/generate"
                                className="flex-1 px-4 py-3 bg-[#0A0A0B] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-[#FC7133]/50 shadow-inner font-mono text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  try {
                                    localStorage.setItem('learn_overseas_custom_ai_endpoint', customAiEndpoint);
                                    localStorage.setItem('learn_overseas_ai_strictness', aiStrictness);
                                  } catch (err) {}
                                  saveSettings({ agencyName, aiStrictness, aiEndpoint: customAiEndpoint });
                                  checkAiHealth(customAiEndpoint);
                                }}
                                className="px-4 py-3 bg-[#FC7133] hover:bg-[#e65d20] text-white font-bold rounded-xl text-xs whitespace-nowrap transition-colors shadow-lg shadow-[#FC7133]/25 flex items-center gap-1.5"
                              >
                                Save & Connect
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Auto-managed by <code>tunnel-service.js</code>. You can also paste a permanent Cloudflare Named Tunnel or Ngrok domain here anytime.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#18181B] border border-white/10 rounded-2xl p-8 space-y-6 hover:border-[#FC7133]/30 transition-colors shadow-lg flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-black text-[#FC7133] mb-2 flex items-center gap-3">
                              <Key className="w-5 h-5" /> Account Security
                            </h3>
                            <p className="text-sm text-slate-400 mt-2">
                              Update your password to keep your account secure.
                            </p>
                          </div>
                          <div className="pt-2">
                            <button 
                              onClick={() => handleResetPassword(currentUser.id)}
                              className="px-6 py-2.5 bg-[#FC7133]/10 border border-[#FC7133]/20 hover:bg-[#FC7133]/20 text-[#FC7133] font-bold rounded-xl text-sm transition-colors w-full"
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
                          onClick={() => saveSettings({ agencyName, aiStrictness, aiEndpoint: customAiEndpoint })}
                          className="px-6 py-2.5 bg-[#FC7133] hover:bg-[#e65d20] text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-[#FC7133]/25"
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

    {/* Dedicated High-Fidelity Printable/Exportable Report Container */}
    {result && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "1100px",
          zIndex: -9999,
          pointerEvents: "none",
          visibility: isExporting ? "visible" : "hidden",
          opacity: isExporting ? 1 : 0,
        }}
        aria-hidden="true"
      >
        <ReportPDFView 
          ref={exportRef} 
          res={activeCompareTab === -1 ? result : (compareResults[activeCompareTab] ?? result)} 
          theme={theme} 
        />
      </div>
    )}
  </>
  );
}
