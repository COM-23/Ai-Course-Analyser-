"use client";
import React from "react";
import { 
  Sparkles, 
  MapPin, 
  CircleDollarSign, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  Globe, 
  Calendar,
  Building,
  Target,
  ShieldCheck
} from "lucide-react";
import { BRAND_LOGO_DARK, BRAND_LOGO_LIGHT } from "@/lib/brandLogos";

interface ReportPDFViewProps {
  res: any;
  theme: "dark" | "light";
}

export const ReportPDFView = React.forwardRef<HTMLDivElement, ReportPDFViewProps>(
  ({ res, theme }, ref) => {
    if (!res) return null;
    const isDark = theme === "dark";

    const s = res.studentDetails || {};
    const colleges = res.recommendedColleges || [];
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const studentRefCode = `LO-${(s.name || "STUDENT")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 4)
      .toUpperCase()}-${new Date().getFullYear()}`;

    // Color definitions for Theme Switching
    const c = isDark
      ? {
          bg: "#0D0E12",
          cardBg: "#16171E",
          cardInner: "#101117",
          border: "rgba(255, 255, 255, 0.08)",
          borderSubtle: "rgba(255, 255, 255, 0.05)",
          textPrimary: "#FFFFFF",
          textSecondary: "#E2E8F0",
          textMuted: "#94A3B8",
          textDim: "#64748B",
          tableHeadBg: "#111217",
          tableRowEven: "#16171E",
          tableRowOdd: "#13141A",
          tableBorder: "rgba(255, 255, 255, 0.06)",
          kpiBg: "#111218",
          brandOrange: "#FC7133",
          brandGold: "#F9D440",
          brandTeal: "#7DC1B1",
          brandBlue: "#BBCDE2",
          badgeBg: "rgba(252, 113, 51, 0.15)",
          badgeBorder: "rgba(252, 113, 51, 0.35)",
        }
      : {
          bg: "#FFFFFF",
          cardBg: "#F8FAFC",
          cardInner: "#FFFFFF",
          border: "#E2E8F0",
          borderSubtle: "#EEF2F6",
          textPrimary: "#0F172A",
          textSecondary: "#334155",
          textMuted: "#64748B",
          textDim: "#94A3B8",
          tableHeadBg: "#F1F5F9",
          tableRowEven: "#FFFFFF",
          tableRowOdd: "#F8FAFC",
          tableBorder: "#E2E8F0",
          kpiBg: "#FFFFFF",
          brandOrange: "#FC7133",
          brandGold: "#B45309",
          brandTeal: "#0D9488",
          brandBlue: "#475569",
          badgeBg: "rgba(252, 113, 51, 0.10)",
          badgeBorder: "rgba(252, 113, 51, 0.30)",
        };

    const logoSrc = isDark ? BRAND_LOGO_DARK : BRAND_LOGO_LIGHT;

    return (
      <div
        ref={ref}
        style={{
          width: "1100px",
          backgroundColor: c.bg,
          color: c.textPrimary,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          padding: "48px 56px",
          boxSizing: "border-box",
          margin: "0 auto",
        }}
      >
        {/* Brand Accent Top Bar */}
        <div
          style={{
            height: "6px",
            width: "100%",
            borderRadius: "3px",
            background: "linear-gradient(90deg, #FC7133 0%, #F9D440 50%, #7DC1B1 100%)",
            marginBottom: "32px",
          }}
        />

        {/* =========================================================================
            1. OFFICIAL HEADER & BRANDING
        ========================================================================== */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "24px",
            borderBottom: `2px solid ${c.border}`,
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "16px",
                padding: "2px",
                background: "linear-gradient(135deg, #FC7133 0%, #F9D440 50%, #7DC1B1 100%)",
                boxShadow: "0 8px 20px rgba(252, 113, 51, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: isDark ? "#111218" : "#FFFFFF",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px",
                  backgroundImage: `url(${logoSrc})`,
                  backgroundSize: "48px 48px",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <img
                  src={logoSrc}
                  alt="Learn Overseas Logo"
                  style={{
                    width: "48px",
                    height: "48px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h1
                  style={{
                    fontSize: "26px",
                    fontWeight: 900,
                    letterSpacing: "0.5px",
                    color: c.textPrimary,
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  LEARN OVERSEAS
                </h1>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    backgroundColor: c.badgeBg,
                    color: c.brandOrange,
                    border: `1px solid ${c.badgeBorder}`,
                  }}
                >
                  Official Intelligence Report
                </span>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: c.brandOrange,
                  letterSpacing: "0.05em",
                  margin: "4px 0 0 0",
                  textTransform: "uppercase",
                }}
              >
                AI Course Analyser & Global Admissions Advisory Dossier
              </p>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: c.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Report Ref: <span style={{ color: c.textSecondary }}>{studentRefCode}</span>
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: c.textPrimary,
                marginTop: "4px",
              }}
            >
              {currentDate}
            </div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#10B981",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "4px",
                backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.12)",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              <ShieldCheck size={12} /> Confidential Student Profile
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. STUDENT PROFILE & 9-KPI STATS GRID
        ========================================================================== */}
        <div
          style={{
            backgroundColor: c.cardBg,
            borderRadius: "20px",
            border: `1px solid ${c.border}`,
            padding: "24px 28px",
            marginBottom: "28px",
            boxShadow: isDark
              ? "0 10px 30px rgba(0,0,0,0.4)"
              : "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          {/* Student Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              paddingBottom: "20px",
              borderBottom: `1px solid ${c.borderSubtle}`,
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #FC7133 0%, #F9D440 50%, #7DC1B1 100%)",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: isDark ? "#111218" : "#FFFFFF",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: 900,
                  color: c.textPrimary,
                }}
              >
                {s.name ? s.name.charAt(0).toUpperCase() : "S"}
              </div>
            </div>

            <div>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  color: c.textPrimary,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {s.name || "Candidate Profile"}
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: c.brandOrange,
                  margin: "4px 0 0 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <GraduationCap size={15} />
                {s.primaryDomain || "Higher Education"} Applicant • Target: {s.destinationCountry || "Global"}
              </p>
            </div>
          </div>

          {/* 9-KPI Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "12px",
            }}
          >
            {[
              { label: "CGPA / Grade", value: s.cgpa ? `${s.cgpa} / 10${s.originalGrade && s.originalGrade !== `${s.cgpa}` ? ` (${s.originalGrade})` : ''}` : "N/A", highlight: true },
              { label: "Degree Goal", value: s.degreeObjective || "Master's" },
              { label: "Target Country", value: s.destinationCountry || "General" },
              { label: "Target Intake", value: s.targetIntake || "Next Intake" },
              { label: "Domain", value: s.primaryDomain || "General" },
              { label: "Work Experience", value: s.workExperience || "None" },
              { label: "Backlog Record", value: s.backlogs !== undefined ? `${s.backlogs} Backlogs` : "0" },
              { label: "Visa History", value: s.visaStatus || "Standard" },
              { 
                label: "Language & Aptitude Tests", 
                value: s.testScores || "Not specified", 
                colSpan: 2 
              },
            ].map((kpi, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: c.kpiBg,
                  borderRadius: "14px",
                  border: `1px solid ${c.border}`,
                  padding: "12px 14px",
                  gridColumn: kpi.colSpan ? `span ${kpi.colSpan}` : undefined,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: c.textDim,
                    marginBottom: "4px",
                  }}
                >
                  {kpi.label}
                </div>
                <div
                  style={{
                    fontSize: kpi.highlight ? "17px" : "12px",
                    fontWeight: 800,
                    color: kpi.highlight ? c.brandOrange : c.textSecondary,
                    lineHeight: 1.2,
                    wordBreak: "break-word",
                  }}
                >
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            3. EXECUTIVE COUNSELOR SUMMARY & ESTIMATED BUDGET
        ========================================================================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.2fr 1fr",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          {/* Executive Summary */}
          <div
            style={{
              backgroundColor: isDark ? "rgba(252, 113, 51, 0.08)" : "#FFF8F5",
              border: `1px solid ${isDark ? "rgba(252, 113, 51, 0.25)" : "#FDD0BE"}`,
              borderRadius: "20px",
              padding: "22px 26px",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "11px",
                fontWeight: 800,
                color: c.brandOrange,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "12px",
              }}
            >
              <Sparkles size={16} color={isDark ? "#F9D440" : "#B45309"} />
              Executive Admissions Assessment
            </div>
            <p
              style={{
                fontSize: "12.5px",
                fontWeight: 500,
                color: c.textSecondary,
                lineHeight: 1.65,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {res.studentSummary ||
                "Based on the applicant's academic profile and standardized benchmarks, a targeted portfolio of institutions has been selected across Safety, Target, and Reach tiers to optimize acceptance probability."}
            </p>
          </div>

          {/* Budget Card */}
          <div
            style={{
              backgroundColor: c.cardBg,
              border: `1px solid ${c.border}`,
              borderRadius: "20px",
              padding: "22px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "999px",
                backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.12)",
                color: "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px auto",
              }}
            >
              <CircleDollarSign size={22} />
            </div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: c.textDim,
                marginBottom: "6px",
              }}
            >
              Estimated Annual Budget
            </div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 900,
                color: "#10B981",
                lineHeight: 1.3,
              }}
            >
              {res.estimatedBudgetRange || "Calculated based on selection"}
            </div>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 600,
                color: c.textDim,
                marginTop: "6px",
              }}
            >
              Tuition + Estimated Living Expenses
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. RECOMMENDED INSTITUTIONS & MATCHING TABLE
        ========================================================================== */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: c.badgeBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: c.brandOrange,
                }}
              >
                <Building size={16} />
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 900,
                  color: c.textPrimary,
                  margin: 0,
                  letterSpacing: "0.02em",
                }}
              >
                Recommended Institutions & Course Matches
              </h3>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "3px 9px",
                  borderRadius: "999px",
                  backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                  color: c.textSecondary,
                }}
              >
                {colleges.length} Matches
              </span>
            </div>

            {/* Legend */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                fontSize: "10px",
                fontWeight: 700,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "999px",
                    backgroundColor: "#10B981",
                  }}
                />
                <span style={{ color: c.textSecondary }}>Safety</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "999px",
                    backgroundColor: "#F59E0B",
                  }}
                />
                <span style={{ color: c.textSecondary }}>Target</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "999px",
                    backgroundColor: "#F43F5E",
                  }}
                />
                <span style={{ color: c.textSecondary }}>Reach</span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div
            style={{
              borderRadius: "16px",
              border: `1px solid ${c.tableBorder}`,
              overflow: "hidden",
              backgroundColor: c.tableRowEven,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "11px",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: c.tableHeadBg,
                    borderBottom: `1px solid ${c.tableBorder}`,
                  }}
                >
                  <th style={{ padding: "12px 16px", fontWeight: 800, color: c.textSecondary, width: "32%" }}>
                    INSTITUTION & PROGRAM
                  </th>
                  <th style={{ padding: "12px 10px", fontWeight: 800, color: c.textSecondary, textAlign: "center", width: "10%" }}>
                    MATCH %
                  </th>
                  <th style={{ padding: "12px 10px", fontWeight: 800, color: c.textSecondary, textAlign: "center", width: "12%" }}>
                    CATEGORY
                  </th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: c.textSecondary, width: "18%" }}>
                    TUITION / YEAR
                  </th>
                  <th style={{ padding: "12px 10px", fontWeight: 800, color: c.textSecondary, width: "12%" }}>
                    DEADLINE
                  </th>
                  <th style={{ padding: "12px 10px", fontWeight: 800, color: c.textSecondary, textAlign: "center", width: "8%" }}>
                    ACCEPT.
                  </th>
                  <th style={{ padding: "12px 10px", fontWeight: 800, color: c.textSecondary, textAlign: "center", width: "8%" }}>
                    MIN CGPA
                  </th>
                </tr>
              </thead>
              <tbody>
                {colleges.map((uni: any, idx: number) => {
                  const matchColor =
                    uni.matchPercentage >= 85
                      ? "#10B981"
                      : uni.matchPercentage >= 75
                      ? "#F59E0B"
                      : "#F43F5E";

                  const badgeStyle =
                    uni.category === "Safety"
                      ? { bg: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5", text: "#10B981", border: "#10B981" }
                      : uni.category === "Target"
                      ? { bg: isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB", text: "#D97706", border: "#F59E0B" }
                      : { bg: isDark ? "rgba(244, 63, 94, 0.15)" : "#FFF1F2", text: "#E11D48", border: "#F43F5E" };

                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: isEven ? c.tableRowEven : c.tableRowOdd,
                        borderBottom: `1px solid ${c.tableBorder}`,
                      }}
                    >
                      {/* Name & Course */}
                      <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 800, fontSize: "12px", color: c.textPrimary }}>
                          {uni.name}
                        </div>
                        <div
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 700,
                            color: c.brandOrange,
                            marginTop: "2px",
                          }}
                        >
                          {uni.recommendedCourse}
                        </div>
                        {uni.courseLink && (
                          <div style={{ marginTop: "3px" }}>
                            <a
                              href={uni.courseLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                color: "#3B82F6",
                                textDecoration: "underline",
                                display: "inline-block"
                              }}
                            >
                              View Course ↗
                            </a>
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: "9.5px",
                            color: c.textDim,
                            marginTop: "3px",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <MapPin size={10} color={c.brandOrange} /> {uni.location}
                        </div>
                      </td>

                      {/* Match % */}
                      <td style={{ padding: "12px 10px", textAlign: "center", verticalAlign: "top" }}>
                        <span style={{ fontSize: "13px", fontWeight: 900, color: matchColor }}>
                          {uni.matchPercentage}%
                        </span>
                      </td>

                      {/* Category Badge */}
                      <td style={{ padding: "12px 10px", textAlign: "center", verticalAlign: "top" }}>
                        <span
                          style={{
                            fontSize: "9.5px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.text,
                            border: `1px solid ${badgeStyle.border}40`,
                            display: "inline-block",
                          }}
                        >
                          {uni.category}
                        </span>
                      </td>

                      {/* Tuition */}
                      <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                        {(() => {
                          const rawTuition = typeof uni.tuition === 'number' 
                            ? uni.tuition 
                            : parseFloat(String(uni.tuition || 0).replace(/[^\d.]/g, '')) || 0;
                          
                          if (rawTuition === 0) {
                            return (
                              <div style={{ fontWeight: 800, color: "#10B981" }}>
                                Tuition-Free (€0)
                              </div>
                            );
                          }

                          const curr = (uni.currency || 'USD').toUpperCase();
                          let formatted = `${curr} ${rawTuition.toLocaleString()}`;
                          try {
                            formatted = new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: curr,
                              maximumFractionDigits: 0
                            }).format(rawTuition);
                          } catch {}

                          return (
                            <div>
                              <div style={{ fontWeight: 800, color: c.textPrimary }}>{formatted}</div>
                              {uni.tuitionConverted && (
                                <div
                                  style={{
                                    fontSize: "9.5px",
                                    fontWeight: 700,
                                    color: "#10B981",
                                    marginTop: "2px",
                                  }}
                                >
                                  {uni.tuitionConverted.replace(/[()]/g, "")}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Deadline */}
                      <td style={{ padding: "12px 10px", fontSize: "10.5px", verticalAlign: "top" }}>
                        {(() => {
                          const dl = uni.applicationDeadline || "Rolling Admissions";
                          if (!dl.includes(':')) {
                            return (
                              <span style={{ fontWeight: 700, color: dl.toLowerCase().includes('rolling') ? "#10B981" : "#E11D48" }}>
                                {dl}
                              </span>
                            );
                          }

                          const parts = dl.split(/,\s*/);
                          const targetLower = (res.studentDetails?.targetIntake || "").toLowerCase();

                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {parts.map((p: string, pIdx: number) => {
                                const [rawIntake, rawDate] = p.split(':').map((s: string) => s.trim());
                                if (!rawIntake || !rawDate) return <div key={pIdx} style={{ color: "#E11D48", fontWeight: 700 }}>{p}</div>;

                                let intakeLabel = rawIntake;
                                if (/^sep/i.test(rawIntake)) intakeLabel = 'Sep (Fall)';
                                else if (/^jan/i.test(rawIntake)) intakeLabel = 'Jan (Spring)';
                                else if (/^may/i.test(rawIntake)) intakeLabel = 'May (Summer)';
                                else if (/^aug/i.test(rawIntake)) intakeLabel = 'Aug (Fall)';

                                const isTarget = targetLower && (
                                  (targetLower.includes('fall') && (/sep|aug|fall/i.test(rawIntake))) ||
                                  (targetLower.includes('spring') && (/jan|spring|winter/i.test(rawIntake))) ||
                                  (targetLower.includes('summer') && (/may|summer/i.test(rawIntake)))
                                );

                                return (
                                  <div
                                    key={pIdx}
                                    style={{
                                      fontSize: "9px",
                                      padding: "3px 6px",
                                      borderRadius: "4px",
                                      backgroundColor: isTarget ? "#FC713318" : "#F8FAFC",
                                      border: isTarget ? "1px solid #FC7133" : "1px solid #E2E8F0",
                                      color: isTarget ? "#FC7133" : "#475569",
                                      fontWeight: isTarget ? 800 : 600,
                                      display: "flex",
                                      justifyContent: "space-between",
                                      gap: "6px"
                                    }}
                                  >
                                    <span>{intakeLabel}:</span>
                                    <span style={{ color: isTarget ? "#FC7133" : "#E11D48", fontWeight: 800 }}>{rawDate}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Acceptance Rate */}
                      <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 700, color: c.textSecondary, verticalAlign: "top" }}>
                        {uni.acceptanceRate || "N/A"}
                      </td>

                      {/* Min CGPA */}
                      <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 900, color: c.brandGold, verticalAlign: "top" }}>
                        {uni.minCgpa ? uni.minCgpa.toFixed(1) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            5. STRATEGIC ADMISSIONS PROFILE: STRENGTHS, IMPROVEMENTS, CAREERS
        ========================================================================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "18px",
            marginBottom: "36px",
          }}
        >
          {/* Key Strengths */}
          <div
            style={{
              backgroundColor: c.cardBg,
              borderRadius: "18px",
              border: `1px solid ${c.border}`,
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#10B981",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <CheckCircle2 size={15} /> Key Profile Strengths
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {(res.strengths || ["Strong foundational GPA", "Standardized test score alignment", "Targeted degree objective"]).map(
                (item: string, i: number) => (
                  <li
                    key={i}
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 500,
                      color: c.textSecondary,
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "6px",
                      lineHeight: 1.45,
                    }}
                  >
                    <span style={{ color: "#10B981", fontWeight: 900, marginTop: "1px" }}>•</span>
                    <span>{item}</span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div
            style={{
              backgroundColor: c.cardBg,
              borderRadius: "18px",
              border: `1px solid ${c.border}`,
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#F43F5E",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AlertCircle size={15} /> Areas for Improvement
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {(res.areasForImprovement || ["Enhance practical research experience", "Submit applications before primary deadlines", "Highlight project portfolios in SOP"]).map(
                (item: string, i: number) => (
                  <li
                    key={i}
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 500,
                      color: c.textSecondary,
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "6px",
                      lineHeight: 1.45,
                    }}
                  >
                    <span style={{ color: "#F43F5E", fontWeight: 900, marginTop: "1px" }}>•</span>
                    <span>{item}</span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Career Horizons */}
          <div
            style={{
              backgroundColor: c.cardBg,
              borderRadius: "18px",
              border: `1px solid ${c.border}`,
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: c.brandOrange,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Briefcase size={15} /> Career Horizons
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {(res.careerOpportunities || ["Industry Specialist", "Research Analyst", "Senior Systems Engineer", "Advisory Consultant"]).map(
                (career: string, i: number) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      padding: "4px 9px",
                      borderRadius: "6px",
                      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#EEF2F6",
                      color: c.textSecondary,
                      border: `1px solid ${c.border}`,
                    }}
                  >
                    {career}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            6. OFFICIAL FOOTER & VERIFICATION NOTICE
        ========================================================================== */}
        <div
          style={{
            paddingTop: "24px",
            borderTop: `2px solid ${c.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "10px",
            fontWeight: 600,
            color: c.textDim,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 800, color: c.brandOrange }}>LEARN OVERSEAS</span>
            <span>•</span>
            <span>Global Admissions & Career Counseling Intelligence</span>
          </div>
          <div>
            Confidential Admissions Dossier • Powered by AI Course Analyser Engine
          </div>
          <div>
            www.learnoverseas.com
          </div>
        </div>
      </div>
    );
  }
);

ReportPDFView.displayName = "ReportPDFView";
