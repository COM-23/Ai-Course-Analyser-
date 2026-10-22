import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function sanitizeUniversity(u: any) {
  let parsedPrograms = u.programs;
  if (!parsedPrograms || typeof parsedPrograms !== 'object') {
    if (typeof parsedPrograms === 'string') {
      try { parsedPrograms = JSON.parse(parsedPrograms); } catch { parsedPrograms = null; }
    }
  }
  if (!parsedPrograms || typeof parsedPrograms !== 'object') {
    parsedPrograms = {
      bachelors: u.bachelorsProgram || "Bachelors Degree",
      masters: u.mastersProgram || "Masters Degree"
    };
  }

  // Ensure domain standardizes agricultural_sciences
  let domain = String(u.domain || "science_technology").toLowerCase().trim();
  if (domain === "agriculture_veterinary" || domain === "agriculture" || domain === "agri") {
    domain = "agricultural_sciences";
  }

  return {
    id: String(u.id || `uni_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
    name: String(u.name || "Unnamed University").trim(),
    location: String(u.location || "Global").trim(),
    domain: domain,
    minCgpa: typeof u.minCgpa === 'number' ? u.minCgpa : parseFloat(u.minCgpa || "7.0") || 7.0,
    tuition: typeof u.tuition === 'number' ? Math.round(u.tuition) : parseInt(u.tuition || "25000") || 25000,
    currency: String(u.currency || "USD").toUpperCase().trim(),
    programs: JSON.stringify(parsedPrograms),
    acceptanceRate: String(u.acceptanceRate || "50%").trim(),
    campusSetting: String(u.campusSetting || "Urban").trim(),
    minIelts: String(u.minIelts || "6.5 (min 6.0 each)").trim(),
    minToefl: String(u.minToefl || "88").trim(),
    minPte: String(u.minPte || "62").trim(),
    minDuolingo: String(u.minDuolingo || "115").trim(),
    ieltsWaiver: String(u.ieltsWaiver || "Yes - 70%+ in CBSE/ICSE 12th English").trim(),
    maxBacklogs: typeof u.maxBacklogs === 'number' ? u.maxBacklogs : parseInt(u.maxBacklogs || "4") || 4,
    ranking: String(u.ranking || "Top Tier").trim(),
    scholarships: String(u.scholarships || "Available").trim(),
    intakes: String(u.intakes || "Fall, Spring").trim()
  };
}

export async function GET(req: NextRequest) {
  try {
    const universities = getDb().prepare('SELECT * FROM universities ORDER BY lastUpdated DESC').all().map(u => {
      let parsedPrograms = (u as any).programs;
      if (typeof parsedPrograms === 'string') {
        try { parsedPrograms = JSON.parse(parsedPrograms); } catch { parsedPrograms = { bachelors: "N/A", masters: "N/A" }; }
      }
      return {
        ...(u as any),
        programs: parsedPrograms || { bachelors: "N/A", masters: "N/A" }
      };
    });
    return NextResponse.json({ success: true, data: universities });
  } catch (error: any) {
    console.error("Database fetch error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch database" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'update' || action === 'create') {
      const sanitized = sanitizeUniversity(payload);
      const updateStmt = getDb().prepare(`
        INSERT OR REPLACE INTO universities (
          id, name, location, domain, minCgpa, tuition, currency, programs, acceptanceRate, campusSetting,
          minIelts, minToefl, minPte, minDuolingo, ieltsWaiver, maxBacklogs, ranking, scholarships, intakes, lastUpdated
        ) VALUES (
          @id, @name, @location, @domain, @minCgpa, @tuition, @currency, @programs, @acceptanceRate, @campusSetting,
          @minIelts, @minToefl, @minPte, @minDuolingo, @ieltsWaiver, @maxBacklogs, @ranking, @scholarships, @intakes, CURRENT_TIMESTAMP
        )
      `);
      updateStmt.run(sanitized);
      return NextResponse.json({ success: true, data: sanitized });
    }

    if (action === 'import') {
      const insertStmt = getDb().prepare(`
        INSERT OR REPLACE INTO universities (
          id, name, location, domain, minCgpa, tuition, currency, programs, acceptanceRate, campusSetting,
          minIelts, minToefl, minPte, minDuolingo, ieltsWaiver, maxBacklogs, ranking, scholarships, intakes, lastUpdated
        ) VALUES (
          @id, @name, @location, @domain, @minCgpa, @tuition, @currency, @programs, @acceptanceRate, @campusSetting,
          @minIelts, @minToefl, @minPte, @minDuolingo, @ieltsWaiver, @maxBacklogs, @ranking, @scholarships, @intakes, CURRENT_TIMESTAMP
        )
      `);
      
      const insertMany = getDb().transaction((unis: any[]) => {
        for (const uni of unis) {
          insertStmt.run(sanitizeUniversity(uni));
        }
      });
      
      insertMany(payload);
      return NextResponse.json({ success: true, count: payload.length });
    }
    
    if (action === 'delete') {
      const deleteStmt = getDb().prepare('DELETE FROM universities WHERE id = ?');
      deleteStmt.run(payload.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Database update error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal database error" }, { status: 500 });
  }
}
