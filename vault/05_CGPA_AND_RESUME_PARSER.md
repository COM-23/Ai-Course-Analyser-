---
title: Academic Profile Parser & CGPA Rules
last_updated: 2026-10-26
tags:
  - parser
  - regex
  - academic-profile
---

# 🎓 Academic Profile Parser & CGPA Rules

The logic responsible for parsing student academic credentials from uploaded PDFs or raw text resides in:
[`src/app/api/analyze/route.ts`](file:///Users/dishik/Downloads/Internship%20/Ai%20Course%20Analyser/src/app/api/analyze/route.ts) (`LocalHeuristicBrain.analyze`).

---

## 🛑 The Core False-Positive Traps (Now Fixed)

### 1. High School vs. University CGPA
In Indian resumes and CVs, education is listed in chronological order:
1. Secondary School (Class 10): e.g. `10 CGPA` or `9.8/10`
2. Higher Secondary (Class 12): e.g. `85%`
3. Bachelor of Technology / Degree: e.g. `5.98 CGPA`

**The Old Bug**: A simple regex matched the first number next to `cgpa`, extracting the 10th-grade `10` instead of the university `5.98`.
**The Fix**: Entries containing markers (`10th`, `class 10`, `matric`, `ssc`, `secondary`) are categorized as High School and de-prioritized. The parser actively selects candidates associated with Degree keywords (`bachelor`, `b.tech`, `undergraduate`, `degree`, `college`, `university`).

### 2. The `score` Keyword Confusion
**The Old Bug**: The keyword list included `(?:cgpa|gpa|pointer|score)`.
This caused test scores (`IELTS score: 7.5`, `GRE score: 320`) and high school scores (`10/10 score`) to match as CGPA.
**The Fix**: `score` was **completely purged** from the CGPA pattern. Only explicit academic grade metrics (`cgpa`, `gpa`, `pointer`) are recognized.

### 3. Floating Point Precision
**The Old Bug**: `extractedCgpa.toFixed(1)` rounded decimals to 1 digit (turning `5.98` into `6.0`).
**The Fix**: Precision is set to `.toFixed(2)` so exact two-decimal CGPAs (`5.98`, `7.85`, `8.42`) are strictly preserved.

---

## 🎯 Extraction Hierarchy (Strict Priority)

```
1. Counselor Manual Box Input (highest priority — user manual entry overrides PDF)
   ↓
2. Bachelor / Degree / College Match (non-high school line)
   ↓
3. Non-high school match with an explicit decimal (e.g. 5.98)
   ↓
4. Any non-high school match
   ↓
5. Percentage conversion (val / 10)
   ↓
6. Fallback math number sniffer
```
