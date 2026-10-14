const Database = require('better-sqlite3');
const db = new Database('./students.db');
const crypto = require('crypto');

const universities = [
  // ================= USA (Extended) =================
  { name: "Yale University", loc: "USA", domain: "arts_humanities", minCgpa: 8.9, tuition: 62000, curr: "USD", programs: ["Law", "History"], ar: "5%", cs: "Urban" },
  { name: "Princeton University", loc: "USA", domain: "science_technology", minCgpa: 9.0, tuition: 57000, curr: "USD", programs: ["Physics", "Mathematics"], ar: "4%", cs: "Suburban" },
  { name: "Columbia University", loc: "USA", domain: "business_management", minCgpa: 8.7, tuition: 65000, curr: "USD", programs: ["Business", "Journalism"], ar: "4%", cs: "Urban" },
  { name: "University of Pennsylvania", loc: "USA", domain: "business_management", minCgpa: 8.8, tuition: 63000, curr: "USD", programs: ["Wharton MBA", "Economics"], ar: "6%", cs: "Urban" },
  { name: "Cornell University", loc: "USA", domain: "science_technology", minCgpa: 8.5, tuition: 60000, curr: "USD", programs: ["Engineering", "Computer Science"], ar: "9%", cs: "Rural" },
  { name: "University of Michigan, Ann Arbor", loc: "USA", domain: "science_technology", minCgpa: 8.3, tuition: 55000, curr: "USD", programs: ["Engineering", "Business"], ar: "18%", cs: "Urban" },
  { name: "University of Southern California", loc: "USA", domain: "arts_humanities", minCgpa: 8.2, tuition: 63000, curr: "USD", programs: ["Cinematic Arts", "Communications"], ar: "12%", cs: "Urban" },
  { name: "New York University", loc: "USA", domain: "business_management", minCgpa: 8.1, tuition: 60000, curr: "USD", programs: ["Stern Business", "Arts"], ar: "12%", cs: "Urban" },
  { name: "University of Washington", loc: "USA", domain: "science_technology", minCgpa: 7.9, tuition: 40000, curr: "USD", programs: ["Computer Science", "Medicine"], ar: "53%", cs: "Urban" },
  { name: "Pennsylvania State University", loc: "USA", domain: "science_technology", minCgpa: 7.4, tuition: 38000, curr: "USD", programs: ["Engineering", "IT"], ar: "55%", cs: "Suburban" },
  { name: "Michigan State University", loc: "USA", domain: "business_management", minCgpa: 7.2, tuition: 41000, curr: "USD", programs: ["Supply Chain", "Business"], ar: "83%", cs: "Suburban" },
  { name: "Ohio State University", loc: "USA", domain: "science_technology", minCgpa: 7.1, tuition: 36000, curr: "USD", programs: ["Engineering", "Business"], ar: "53%", cs: "Urban" },
  { name: "University of Illinois Urbana-Champaign", loc: "USA", domain: "science_technology", minCgpa: 8.0, tuition: 42000, curr: "USD", programs: ["Computer Science", "Engineering"], ar: "45%", cs: "Suburban" },
  { name: "Texas A&M University", loc: "USA", domain: "science_technology", minCgpa: 7.3, tuition: 40000, curr: "USD", programs: ["Petroleum Engineering", "Agriculture"], ar: "64%", cs: "Suburban" },
  { name: "University of Florida", loc: "USA", domain: "business_management", minCgpa: 7.5, tuition: 29000, curr: "USD", programs: ["Business", "Engineering"], ar: "23%", cs: "Suburban" },
  { name: "Rutgers University", loc: "USA", domain: "arts_humanities", minCgpa: 6.9, tuition: 32000, curr: "USD", programs: ["Philosophy", "History"], ar: "66%", cs: "Urban" },
  { name: "University of Houston", loc: "USA", domain: "science_technology", minCgpa: 6.5, tuition: 27000, curr: "USD", programs: ["Engineering", "Computer Science"], ar: "65%", cs: "Urban" },
  { name: "Florida International University", loc: "USA", domain: "business_management", minCgpa: 6.2, tuition: 19000, curr: "USD", programs: ["Hospitality", "Business"], ar: "64%", cs: "Urban" },
  { name: "California State University, Long Beach", loc: "USA", domain: "arts_humanities", minCgpa: 6.0, tuition: 17000, curr: "USD", programs: ["Design", "Liberal Arts"], ar: "40%", cs: "Urban" },
  { name: "University of North Texas", loc: "USA", domain: "science_technology", minCgpa: 5.8, tuition: 20000, curr: "USD", programs: ["IT", "Engineering"], ar: "81%", cs: "Suburban" },
  { name: "Illinois Institute of Technology", loc: "USA", domain: "science_technology", minCgpa: 6.5, tuition: 48000, curr: "USD", programs: ["Computer Science", "Architecture"], ar: "66%", cs: "Urban" },

  // ================= UK (Extended) =================
  { name: "University College London (UCL)", loc: "UK", domain: "science_technology", minCgpa: 8.5, tuition: 32000, curr: "GBP", programs: ["Medicine", "Computer Science"], ar: "29%", cs: "Urban" },
  { name: "University of Edinburgh", loc: "UK", domain: "arts_humanities", minCgpa: 8.3, tuition: 28000, curr: "GBP", programs: ["Linguistics", "Data Science"], ar: "10%", cs: "Urban" },
  { name: "King's College London", loc: "UK", domain: "arts_humanities", minCgpa: 8.0, tuition: 30000, curr: "GBP", programs: ["Law", "Nursing"], ar: "13%", cs: "Urban" },
  { name: "University of Bristol", loc: "UK", domain: "science_technology", minCgpa: 7.8, tuition: 27000, curr: "GBP", programs: ["Engineering", "Geology"], ar: "67%", cs: "Urban" },
  { name: "University of Glasgow", loc: "UK", domain: "business_management", minCgpa: 7.5, tuition: 25000, curr: "GBP", programs: ["Business", "Veterinary Medicine"], ar: "70%", cs: "Urban" },
  { name: "University of Leeds", loc: "UK", domain: "business_management", minCgpa: 7.4, tuition: 26000, curr: "GBP", programs: ["Marketing", "Accounting"], ar: "64%", cs: "Urban" },
  { name: "University of Sheffield", loc: "UK", domain: "science_technology", minCgpa: 7.2, tuition: 25000, curr: "GBP", programs: ["Engineering", "Architecture"], ar: "14%", cs: "Urban" },
  { name: "University of Southampton", loc: "UK", domain: "science_technology", minCgpa: 7.0, tuition: 24000, curr: "GBP", programs: ["Electronics", "Computer Science"], ar: "84%", cs: "Suburban" },
  { name: "Lancaster University", loc: "UK", domain: "business_management", minCgpa: 6.8, tuition: 22000, curr: "GBP", programs: ["Management", "Linguistics"], ar: "19%", cs: "Rural" },
  { name: "Aston University", loc: "UK", domain: "business_management", minCgpa: 6.5, tuition: 19000, curr: "GBP", programs: ["Business", "Optometry"], ar: "50%", cs: "Urban" },
  { name: "University of Leicester", loc: "UK", domain: "arts_humanities", minCgpa: 6.3, tuition: 18000, curr: "GBP", programs: ["Archaeology", "History"], ar: "71%", cs: "Urban" },
  { name: "Bournemouth University", loc: "UK", domain: "science_technology", minCgpa: 6.0, tuition: 16000, curr: "GBP", programs: ["Animation", "Media"], ar: "50%", cs: "Urban" },
  { name: "University of Hertfordshire", loc: "UK", domain: "science_technology", minCgpa: 5.5, tuition: 15000, curr: "GBP", programs: ["Computer Science", "Engineering"], ar: "70%", cs: "Suburban" },
  { name: "Middlesex University London", loc: "UK", domain: "business_management", minCgpa: 5.0, tuition: 14000, curr: "GBP", programs: ["Business", "Arts"], ar: "75%", cs: "Urban" },

  // ================= Canada (Extended) =================
  { name: "McMaster University", loc: "Canada", domain: "science_technology", minCgpa: 8.0, tuition: 40000, curr: "CAD", programs: ["Health Sciences", "Engineering"], ar: "58%", cs: "Urban" },
  { name: "University of Calgary", loc: "Canada", domain: "science_technology", minCgpa: 7.6, tuition: 28000, curr: "CAD", programs: ["Engineering", "Geosciences"], ar: "20%", cs: "Urban" },
  { name: "Queen's University", loc: "Canada", domain: "business_management", minCgpa: 8.1, tuition: 50000, curr: "CAD", programs: ["Commerce", "Engineering"], ar: "42%", cs: "Urban" },
  { name: "Western University", loc: "Canada", domain: "business_management", minCgpa: 7.8, tuition: 45000, curr: "CAD", programs: ["Ivey Business", "Medicine"], ar: "58%", cs: "Suburban" },
  { name: "University of Ottawa", loc: "Canada", domain: "arts_humanities", minCgpa: 7.4, tuition: 35000, curr: "CAD", programs: ["Law", "Public Policy"], ar: "42%", cs: "Urban" },
  { name: "Dalhousie University", loc: "Canada", domain: "science_technology", minCgpa: 7.0, tuition: 25000, curr: "CAD", programs: ["Oceanography", "Computer Science"], ar: "60%", cs: "Urban" },
  { name: "University of Victoria", loc: "Canada", domain: "science_technology", minCgpa: 6.8, tuition: 27000, curr: "CAD", programs: ["Computer Science", "Earth Sciences"], ar: "63%", cs: "Suburban" },
  { name: "Ryerson University (TMU)", loc: "Canada", domain: "business_management", minCgpa: 6.6, tuition: 32000, curr: "CAD", programs: ["Media", "Business"], ar: "80%", cs: "Urban" },
  { name: "Carleton University", loc: "Canada", domain: "science_technology", minCgpa: 6.4, tuition: 30000, curr: "CAD", programs: ["Engineering", "Journalism"], ar: "73%", cs: "Urban" },
  { name: "Seneca College", loc: "Canada", domain: "business_management", minCgpa: 5.5, tuition: 17000, curr: "CAD", programs: ["Business", "Aviation"], ar: "85%", cs: "Urban" },
  { name: "Centennial College", loc: "Canada", domain: "science_technology", minCgpa: 5.2, tuition: 16000, curr: "CAD", programs: ["IT", "Engineering Technology"], ar: "88%", cs: "Urban" },

  // ================= Australia (Extended) =================
  { name: "Australian National University (ANU)", loc: "Australia", domain: "arts_humanities", minCgpa: 8.5, tuition: 47000, curr: "AUD", programs: ["Politics", "Law"], ar: "35%", cs: "Urban" },
  { name: "University of Queensland", loc: "Australia", domain: "science_technology", minCgpa: 7.9, tuition: 45000, curr: "AUD", programs: ["Biotechnology", "Engineering"], ar: "40%", cs: "Suburban" },
  { name: "University of Western Australia", loc: "Australia", domain: "science_technology", minCgpa: 7.5, tuition: 42000, curr: "AUD", programs: ["Mining Engineering", "Anatomy"], ar: "38%", cs: "Urban" },
  { name: "University of Adelaide", loc: "Australia", domain: "business_management", minCgpa: 7.2, tuition: 40000, curr: "AUD", programs: ["Agriculture", "Business"], ar: "75%", cs: "Urban" },
  { name: "Macquarie University", loc: "Australia", domain: "business_management", minCgpa: 6.9, tuition: 38000, curr: "AUD", programs: ["Finance", "Accounting"], ar: "40%", cs: "Suburban" },
  { name: "Griffith University", loc: "Australia", domain: "business_management", minCgpa: 6.5, tuition: 33000, curr: "AUD", programs: ["Hospitality", "Nursing"], ar: "50%", cs: "Suburban" },
  { name: "La Trobe University", loc: "Australia", domain: "arts_humanities", minCgpa: 6.2, tuition: 34000, curr: "AUD", programs: ["Arts", "Health Sciences"], ar: "75%", cs: "Suburban" },
  { name: "Victoria University", loc: "Australia", domain: "science_technology", minCgpa: 5.5, tuition: 28000, curr: "AUD", programs: ["Sports Science", "IT"], ar: "64%", cs: "Urban" },

  // ================= Germany (Extended) =================
  { name: "LMU Munich", loc: "Germany", domain: "arts_humanities", minCgpa: 8.5, tuition: 3000, curr: "EUR", programs: ["Physics", "Philosophy"], ar: "10%", cs: "Urban" },
  { name: "Free University of Berlin", loc: "Germany", domain: "arts_humanities", minCgpa: 8.0, tuition: 1500, curr: "EUR", programs: ["Political Science", "History"], ar: "15%", cs: "Urban" },
  { name: "University of Freiburg", loc: "Germany", domain: "science_technology", minCgpa: 7.8, tuition: 3000, curr: "EUR", programs: ["Environmental Sciences", "Medicine"], ar: "33%", cs: "Urban" },
  { name: "Karlsruhe Institute of Technology (KIT)", loc: "Germany", domain: "science_technology", minCgpa: 7.7, tuition: 3000, curr: "EUR", programs: ["Engineering", "Computer Science"], ar: "20%", cs: "Urban" },
  { name: "University of Stuttgart", loc: "Germany", domain: "science_technology", minCgpa: 7.2, tuition: 3000, curr: "EUR", programs: ["Automotive Engineering", "Physics"], ar: "70%", cs: "Urban" },
  { name: "Darmstadt University of Technology", loc: "Germany", domain: "science_technology", minCgpa: 7.0, tuition: 1500, curr: "EUR", programs: ["IT", "Engineering"], ar: "29%", cs: "Urban" },
  { name: "Frankfurt School of Finance & Management", loc: "Germany", domain: "business_management", minCgpa: 6.8, tuition: 18000, curr: "EUR", programs: ["Finance", "Management"], ar: "40%", cs: "Urban" },

  // ================= Ireland (Extended) =================
  { name: "University College Cork", loc: "Ireland", domain: "science_technology", minCgpa: 7.2, tuition: 20000, curr: "EUR", programs: ["Nursing", "Pharmacy"], ar: "52%", cs: "Urban" },
  { name: "University of Limerick", loc: "Ireland", domain: "business_management", minCgpa: 6.8, tuition: 16000, curr: "EUR", programs: ["Business", "Engineering"], ar: "65%", cs: "Suburban" },
  { name: "Maynooth University", loc: "Ireland", domain: "arts_humanities", minCgpa: 6.5, tuition: 15000, curr: "EUR", programs: ["Arts", "Computer Science"], ar: "73%", cs: "Suburban" },
  { name: "Technological University Dublin", loc: "Ireland", domain: "science_technology", minCgpa: 6.0, tuition: 13000, curr: "EUR", programs: ["IT", "Hospitality"], ar: "46%", cs: "Urban" },

  // ================= New Zealand (Extended) =================
  { name: "University of Canterbury", loc: "New Zealand", domain: "science_technology", minCgpa: 7.2, tuition: 35000, curr: "NZD", programs: ["Civil Engineering", "Forestry"], ar: "50%", cs: "Suburban" },
  { name: "Massey University", loc: "New Zealand", domain: "business_management", minCgpa: 6.5, tuition: 30000, curr: "NZD", programs: ["Aviation", "Veterinary Science"], ar: "65%", cs: "Urban" },
  { name: "University of Waikato", loc: "New Zealand", domain: "business_management", minCgpa: 6.2, tuition: 28000, curr: "NZD", programs: ["Management", "Education"], ar: "70%", cs: "Suburban" },
  { name: "Lincoln University", loc: "New Zealand", domain: "science_technology", minCgpa: 5.8, tuition: 27000, curr: "NZD", programs: ["Agriculture", "Environmental Science"], ar: "60%", cs: "Rural" },

  // ================= UAE (Extended) =================
  { name: "Khalifa University", loc: "UAE", domain: "science_technology", minCgpa: 7.8, tuition: 100000, curr: "AED", programs: ["Engineering", "Medicine"], ar: "30%", cs: "Urban" },
  { name: "Zayed University", loc: "UAE", domain: "business_management", minCgpa: 6.5, tuition: 80000, curr: "AED", programs: ["Business", "Arts"], ar: "60%", cs: "Urban" },
  { name: "Abu Dhabi University", loc: "UAE", domain: "business_management", minCgpa: 6.0, tuition: 50000, curr: "AED", programs: ["Business", "Law"], ar: "70%", cs: "Urban" },
  { name: "Heriot-Watt University Dubai", loc: "UAE", domain: "science_technology", minCgpa: 5.8, tuition: 60000, curr: "AED", programs: ["Engineering", "Construction"], ar: "75%", cs: "Urban" },
  { name: "University of Wollongong in Dubai", loc: "UAE", domain: "business_management", minCgpa: 5.5, tuition: 55000, curr: "AED", programs: ["Business", "Computer Science"], ar: "80%", cs: "Urban" },

  // ================= Singapore (Extended) =================
  { name: "Singapore University of Technology and Design", loc: "Singapore", domain: "science_technology", minCgpa: 7.5, tuition: 28000, curr: "SGD", programs: ["Architecture", "Engineering"], ar: "35%", cs: "Urban" },
  { name: "Singapore Institute of Management (SIM)", loc: "Singapore", domain: "business_management", minCgpa: 6.0, tuition: 20000, curr: "SGD", programs: ["Business", "Economics"], ar: "70%", cs: "Urban" },
  { name: "PSB Academy", loc: "Singapore", domain: "science_technology", minCgpa: 5.5, tuition: 18000, curr: "SGD", programs: ["IT", "Engineering"], ar: "80%", cs: "Urban" },
  { name: "MDIS Singapore", loc: "Singapore", domain: "business_management", minCgpa: 5.0, tuition: 15000, curr: "SGD", programs: ["Business", "Tourism"], ar: "85%", cs: "Urban" },

  // ================= Malaysia (Extended) =================
  { name: "Universiti Putra Malaysia", loc: "Malaysia", domain: "science_technology", minCgpa: 7.0, tuition: 22000, curr: "MYR", programs: ["Agriculture", "Forestry"], ar: "40%", cs: "Suburban" },
  { name: "Universiti Sains Malaysia", loc: "Malaysia", domain: "science_technology", minCgpa: 7.0, tuition: 24000, curr: "MYR", programs: ["Pharmacy", "Engineering"], ar: "45%", cs: "Suburban" },
  { name: "INTI International University", loc: "Malaysia", domain: "business_management", minCgpa: 5.8, tuition: 30000, curr: "MYR", programs: ["Business", "Computing"], ar: "70%", cs: "Suburban" },
  { name: "Asia Pacific University (APU)", loc: "Malaysia", domain: "science_technology", minCgpa: 5.5, tuition: 28000, curr: "MYR", programs: ["IT", "Cybersecurity"], ar: "80%", cs: "Urban" },
  { name: "SEGi University", loc: "Malaysia", domain: "business_management", minCgpa: 5.0, tuition: 25000, curr: "MYR", programs: ["Business", "Education"], ar: "85%", cs: "Suburban" },

  // ================= France (Extended) =================
  { name: "INSEAD", loc: "France", domain: "business_management", minCgpa: 8.8, tuition: 90000, curr: "EUR", programs: ["MBA", "Executive Education"], ar: "30%", cs: "Suburban" },
  { name: "Sciences Po", loc: "France", domain: "arts_humanities", minCgpa: 8.2, tuition: 14000, curr: "EUR", programs: ["Political Science", "International Relations"], ar: "20%", cs: "Urban" },
  { name: "ESSEC Business School", loc: "France", domain: "business_management", minCgpa: 7.8, tuition: 25000, curr: "EUR", programs: ["Management", "Finance"], ar: "15%", cs: "Suburban" },
  { name: "CentraleSupélec", loc: "France", domain: "science_technology", minCgpa: 8.0, tuition: 18000, curr: "EUR", programs: ["Engineering", "Computer Science"], ar: "10%", cs: "Suburban" },
  { name: "EDHEC Business School", loc: "France", domain: "business_management", minCgpa: 7.0, tuition: 20000, curr: "EUR", programs: ["Finance", "Business"], ar: "25%", cs: "Urban" },

  // ================= Italy (Extended) =================
  { name: "Politecnico di Torino", loc: "Italy", domain: "science_technology", minCgpa: 7.5, tuition: 3000, curr: "EUR", programs: ["Engineering", "Architecture"], ar: "30%", cs: "Urban" },
  { name: "University of Bologna", loc: "Italy", domain: "arts_humanities", minCgpa: 7.2, tuition: 3500, curr: "EUR", programs: ["Law", "Arts"], ar: "55%", cs: "Urban" },
  { name: "University of Padua", loc: "Italy", domain: "science_technology", minCgpa: 7.0, tuition: 3000, curr: "EUR", programs: ["Medicine", "Psychology"], ar: "50%", cs: "Urban" },
  { name: "LUISS Guido Carli", loc: "Italy", domain: "business_management", minCgpa: 6.8, tuition: 12000, curr: "EUR", programs: ["Economics", "Political Science"], ar: "40%", cs: "Urban" },
  { name: "University of Florence", loc: "Italy", domain: "arts_humanities", minCgpa: 6.0, tuition: 2500, curr: "EUR", programs: ["Architecture", "Humanities"], ar: "60%", cs: "Urban" },

  // ================= Spain (Extended) =================
  { name: "ESADE Business School", loc: "Spain", domain: "business_management", minCgpa: 8.2, tuition: 35000, curr: "EUR", programs: ["MBA", "Law"], ar: "25%", cs: "Urban" },
  { name: "Autonomous University of Madrid", loc: "Spain", domain: "science_technology", minCgpa: 7.8, tuition: 3000, curr: "EUR", programs: ["Physics", "Mathematics"], ar: "50%", cs: "Suburban" },
  { name: "University of Navarra", loc: "Spain", domain: "business_management", minCgpa: 7.5, tuition: 15000, curr: "EUR", programs: ["Business", "Communications"], ar: "30%", cs: "Urban" },
  { name: "Pompeu Fabra University", loc: "Spain", domain: "business_management", minCgpa: 7.2, tuition: 4000, curr: "EUR", programs: ["Economics", "Political Science"], ar: "40%", cs: "Urban" },
  { name: "Complutense University of Madrid", loc: "Spain", domain: "arts_humanities", minCgpa: 6.5, tuition: 3500, curr: "EUR", programs: ["Arts", "Journalism"], ar: "65%", cs: "Urban" }
];

console.log(`Seeding an additional ${universities.length} global universities into the database...`);

const insertStmt = db.prepare(`
  INSERT INTO universities (id, name, location, domain, minCgpa, tuition, currency, programs, acceptanceRate, campusSetting)
  VALUES (@id, @name, @location, @domain, @minCgpa, @tuition, @currency, @programs, @acceptanceRate, @campusSetting)
  ON CONFLICT(id) DO UPDATE SET
    minCgpa = @minCgpa,
    tuition = @tuition,
    currency = @currency,
    programs = @programs
`);

let count = 0;
for (const uni of universities) {
  const id = crypto.createHash('md5').update(uni.name.toLowerCase() + uni.loc.toLowerCase()).digest('hex');
  insertStmt.run({
    id: id,
    name: uni.name,
    location: uni.loc,
    domain: uni.domain,
    minCgpa: uni.minCgpa,
    tuition: uni.tuition,
    currency: uni.curr,
    programs: JSON.stringify(uni.programs),
    acceptanceRate: uni.ar,
    campusSetting: uni.cs
  });
  count++;
}

console.log(`Successfully seeded ${count} MORE global universities across 13 countries!`);
db.close();
