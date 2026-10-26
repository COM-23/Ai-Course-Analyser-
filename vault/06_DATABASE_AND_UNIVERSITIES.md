---
title: Database Schema & University Matching
last_updated: 2026-10-26
tags:
  - database
  - sqlite
  - universities
---

# 🗄️ Database Schema & University Matching

The application uses SQLite as its primary embedded relational database, defined in [`src/lib/db.ts`](file:///Users/dishik/Downloads/Internship%20/Ai%20Course%20Analyser/src/lib/db.ts) and stored as `students.db`.

---

## 📊 Core Tables

### 1. `universities`
Stores all global academic institutions, their minimum CGPA entry barriers, acceptance rates, and average yearly tuition.

- **Verified Seed Data Count**:
  - **Canada**: 165 verified institutions
  - **United Kingdom**: 310 verified institutions
  - **United States**: 400+ verified institutions
  - **Australia, Germany, UAE, Singapore, New Zealand, Ireland**: Comprehensive coverage
- **Schema**:
  - `id` (TEXT PRIMARY KEY)
  - `name` (TEXT)
  - `location` (TEXT)
  - `domain` (TEXT)
  - `minCgpa` (REAL)
  - `tuition` (REAL)
  - `currency` (TEXT)
  - `programs` (TEXT / JSON)
  - `acceptanceRate` (TEXT)
  - `campusSetting` (TEXT)

### 2. `students`
Stores counselor student evaluations, admission probability tiers, and comparison history.
- `id` (INTEGER PRIMARY KEY)
- `studentDetails` (TEXT / JSON: name, cgpa, domain, degreeObjective, etc.)
- `studentSummary` (TEXT)
- `strengths` (TEXT / JSON)
- `areasForImprovement` (TEXT / JSON)
- `recommendedColleges` (TEXT / JSON)
- `comparisonData` (TEXT / JSON: stores side-by-side country evaluations)
- `counselor_id` (INTEGER)

### 3. `settings`
Stores dynamic Super Admin configuration:
- `aiEndpoint`: Custom AI tunnel override.
- `aiStrictness`: `standard`, `lenient`, or `strict` admission criteria.

---

## ⚡ Matching Algorithm Rules

1. **Safety Schools**: Student CGPA exceeds university minimum by `>= 1.0`. Match %: 95–99%.
2. **Target Schools**: Student CGPA meets or exceeds university minimum by `0.0 to 0.9`. Match %: 85–94%.
3. **Reach Schools**: Student CGPA is within `0.1 to 1.5` below minimum. Match %: 65–84%.
4. **Live Scraping Guard**:
   - In cloud serverless, if the database already contains `>= 5` eligible universities for the selected country, external web scraping is bypassed to eliminate latency and guarantee responses under Netlify limits.
