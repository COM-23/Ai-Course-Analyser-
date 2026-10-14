const Database = require('better-sqlite3');
const db = new Database('./students.db');

const universities = [
  // ================= AGRICULTURE & VETERINARY (UK) =================
  { id: "uk_agri_reading", name: "University of Reading", location: "Reading, UK", domain: "agriculture_veterinary", minCgpa: 7.5, tuition: 25000, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Agriculture", masters: "MSc Agriculture and Development" }), acceptanceRate: "45%", campusSetting: "Suburban" },
  { id: "uk_agri_rau", name: "Royal Agricultural University", location: "Cirencester, UK", domain: "agriculture_veterinary", minCgpa: 6.5, tuition: 17500, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Agriculture", masters: "MSc Sustainable Agriculture & Food Security" }), acceptanceRate: "72%", campusSetting: "Rural" },
  { id: "uk_agri_harper", name: "Harper Adams University", location: "Newport, UK", domain: "agriculture_veterinary", minCgpa: 6.8, tuition: 18000, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Agriculture", masters: "MSc Agricultural Sciences & Agronomy" }), acceptanceRate: "65%", campusSetting: "Rural" },
  { id: "uk_agri_nottingham", name: "University of Nottingham", location: "Nottingham, UK", domain: "agriculture_veterinary", minCgpa: 7.8, tuition: 28000, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Agricultural Sciences", masters: "MSc Applied Agricultural Science" }), acceptanceRate: "40%", campusSetting: "Suburban" },
  { id: "uk_agri_newcastle", name: "Newcastle University", location: "Newcastle, UK", domain: "agriculture_veterinary", minCgpa: 7.2, tuition: 24000, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Agriculture", masters: "MSc Agricultural & Environmental Science" }), acceptanceRate: "55%", campusSetting: "Urban" },
  { id: "uk_agri_aberystwyth", name: "Aberystwyth University", location: "Aberystwyth, UK", domain: "agriculture_veterinary", minCgpa: 6.4, tuition: 19000, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Agriculture", masters: "MSc Livestock Science & Agriculture" }), acceptanceRate: "70%", campusSetting: "Rural" },
  { id: "uk_agri_sruc", name: "SRUC (Scotland's Rural College)", location: "Edinburgh, UK", domain: "agriculture_veterinary", minCgpa: 6.2, tuition: 16500, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Agriculture", masters: "MSc Agricultural Technology & Innovation" }), acceptanceRate: "75%", campusSetting: "Rural" },
  { id: "uk_agri_qub", name: "Queen's University Belfast", location: "Belfast, UK", domain: "agriculture_veterinary", minCgpa: 7.0, tuition: 22000, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Agricultural Technology", masters: "MSc Global Food Security & Agriculture" }), acceptanceRate: "58%", campusSetting: "Urban" },
  { id: "uk_agri_cranfield", name: "Cranfield University", location: "Cranfield, UK", domain: "agriculture_veterinary", minCgpa: 7.6, tuition: 27000, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Agri-Tech", masters: "MSc Soil & Water Systems / Agrifood" }), acceptanceRate: "48%", campusSetting: "Suburban" },
  { id: "uk_agri_bristol", name: "University of Bristol", location: "Bristol, UK", domain: "agriculture_veterinary", minCgpa: 8.2, tuition: 31000, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Veterinary Science", masters: "MSc Animal Behaviour & Welfare" }), acceptanceRate: "35%", campusSetting: "Urban" },
  { id: "uk_agri_glasgow", name: "University of Glasgow", location: "Glasgow, UK", domain: "agriculture_veterinary", minCgpa: 7.9, tuition: 29000, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Veterinary Biosciences", masters: "MSc Animal Nutrition & Agriculture" }), acceptanceRate: "42%", campusSetting: "Urban" },
  { id: "uk_agri_writtle", name: "Writtle University College", location: "Chelmsford, UK", domain: "agriculture_veterinary", minCgpa: 5.8, tuition: 14500, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Agriculture", masters: "MSc Crop Science & Horticulture" }), acceptanceRate: "80%", campusSetting: "Rural" },
  { id: "uk_agri_hartpury", name: "Hartpury University", location: "Gloucester, UK", domain: "agriculture_veterinary", minCgpa: 6.0, tuition: 15500, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Agriculture", masters: "MSc Applied Agricultural Science" }), acceptanceRate: "75%", campusSetting: "Rural" },
  { id: "uk_agri_bangor", name: "Bangor University", location: "Bangor, UK", domain: "agriculture_veterinary", minCgpa: 6.6, tuition: 18500, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Agroforestry", masters: "MSc Agroforestry & Food Security" }), acceptanceRate: "68%", campusSetting: "Coastal" },
  { id: "uk_agri_warwick", name: "University of Warwick", location: "Coventry, UK", domain: "agriculture_veterinary", minCgpa: 8.0, tuition: 30000, currency: "GBP", programs: JSON.stringify({ bachelors: "BSc Life Sciences (Agri)", masters: "MSc Crop Science & Food Security" }), acceptanceRate: "38%", campusSetting: "Suburban" },

  // ================= AGRICULTURE & VETERINARY (USA) =================
  { id: "us_agri_cornell", name: "Cornell University", location: "Ithaca, USA", domain: "agriculture_veterinary", minCgpa: 8.8, tuition: 58000, currency: "USD", programs: JSON.stringify({ bachelors: "BS Plant Science", masters: "MS Agriculture & Life Sciences" }), acceptanceRate: "9%", campusSetting: "Rural" },
  { id: "us_agri_iowa", name: "Iowa State University", location: "Ames, USA", domain: "agriculture_veterinary", minCgpa: 7.0, tuition: 29000, currency: "USD", programs: JSON.stringify({ bachelors: "BS Agronomy", masters: "MS Agricultural & Biosystems Engineering" }), acceptanceRate: "75%", campusSetting: "Suburban" },
  { id: "us_agri_purdue", name: "Purdue University", location: "West Lafayette, USA", domain: "agriculture_veterinary", minCgpa: 7.8, tuition: 33000, currency: "USD", programs: JSON.stringify({ bachelors: "BS Agricultural Sciences", masters: "MS Agronomy / Crop Breeding" }), acceptanceRate: "50%", campusSetting: "Suburban" },
  { id: "us_agri_ufl", name: "University of Florida", location: "Gainesville, USA", domain: "agriculture_veterinary", minCgpa: 7.5, tuition: 30000, currency: "USD", programs: JSON.stringify({ bachelors: "BS Agricultural Operations", masters: "MS Soil & Water Sciences" }), acceptanceRate: "30%", campusSetting: "Suburban" },
  { id: "us_agri_tamu", name: "Texas A&M University", location: "College Station, USA", domain: "agriculture_veterinary", minCgpa: 7.4, tuition: 35000, currency: "USD", programs: JSON.stringify({ bachelors: "BS Agricultural Systems", masters: "MS Animal Science & Agriculture" }), acceptanceRate: "55%", campusSetting: "Suburban" },
  { id: "us_agri_wisconsin", name: "University of Wisconsin-Madison", location: "Madison, USA", domain: "agriculture_veterinary", minCgpa: 8.0, tuition: 38000, currency: "USD", programs: JSON.stringify({ bachelors: "BS Dairy Science", masters: "MS Agroecology & Soil Science" }), acceptanceRate: "45%", campusSetting: "Urban" },

  // ================= AGRICULTURE & VETERINARY (Canada) =================
  { id: "ca_agri_guelph", name: "University of Guelph", location: "Guelph, Canada", domain: "agriculture_veterinary", minCgpa: 7.5, tuition: 32000, currency: "CAD", programs: JSON.stringify({ bachelors: "BSc Agriculture", masters: "MSc Plant Agriculture / Animal Biosciences" }), acceptanceRate: "50%", campusSetting: "Suburban" },
  { id: "ca_agri_sask", name: "University of Saskatchewan", location: "Saskatoon, Canada", domain: "agriculture_veterinary", minCgpa: 7.0, tuition: 24000, currency: "CAD", programs: JSON.stringify({ bachelors: "BSc Agronomy", masters: "MSc Animal & Poultry Science" }), acceptanceRate: "65%", campusSetting: "Suburban" },
  { id: "ca_agri_alberta", name: "University of Alberta", location: "Edmonton, Canada", domain: "agriculture_veterinary", minCgpa: 7.8, tuition: 28000, currency: "CAD", programs: JSON.stringify({ bachelors: "BSc Agriculture", masters: "MSc Agricultural Systems & Bioresources" }), acceptanceRate: "52%", campusSetting: "Urban" },
  { id: "ca_agri_mcgill", name: "McGill University", location: "Montreal, Canada", domain: "agriculture_veterinary", minCgpa: 8.4, tuition: 35000, currency: "CAD", programs: JSON.stringify({ bachelors: "BSc Agricultural Economics", masters: "MSc Bioresource Engineering" }), acceptanceRate: "38%", campusSetting: "Suburban" },

  // ================= AGRICULTURE & VETERINARY (Australia) =================
  { id: "au_agri_uq", name: "University of Queensland", location: "Brisbane, Australia", domain: "agriculture_veterinary", minCgpa: 7.8, tuition: 45000, currency: "AUD", programs: JSON.stringify({ bachelors: "BSc Agricultural Science", masters: "Master of Agricultural Science" }), acceptanceRate: "45%", campusSetting: "Suburban" },
  { id: "au_agri_melbourne", name: "University of Melbourne", location: "Melbourne, Australia", domain: "agriculture_veterinary", minCgpa: 8.2, tuition: 48000, currency: "AUD", programs: JSON.stringify({ bachelors: "BSc Agriculture", masters: "Master of Agricultural Sciences" }), acceptanceRate: "40%", campusSetting: "Urban" },
  { id: "au_agri_adelaide", name: "University of Adelaide", location: "Adelaide, Australia", domain: "agriculture_veterinary", minCgpa: 7.2, tuition: 40000, currency: "AUD", programs: JSON.stringify({ bachelors: "BSc Agricultural Sciences", masters: "Master of Global Food & Agricultural Business" }), acceptanceRate: "60%", campusSetting: "Suburban" },
  { id: "au_agri_sydney", name: "University of Sydney", location: "Sydney, Australia", domain: "agriculture_veterinary", minCgpa: 8.0, tuition: 46000, currency: "AUD", programs: JSON.stringify({ bachelors: "BSc Agriculture", masters: "Master of Agriculture and Environment" }), acceptanceRate: "42%", campusSetting: "Urban" }
];

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO universities (id, name, location, domain, minCgpa, tuition, currency, programs, acceptanceRate, campusSetting)
  VALUES (@id, @name, @location, @domain, @minCgpa, @tuition, @currency, @programs, @acceptanceRate, @campusSetting)
`);

const insertMany = db.transaction((unis) => {
  for (const u of unis) {
    insertStmt.run(u);
  }
});

insertMany(universities);
console.log(`✅ Successfully seeded ${universities.length} agricultural universities into students.db!`);
