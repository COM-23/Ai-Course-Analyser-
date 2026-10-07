const http = require('http');

const ENDPOINT = 'http://localhost:3000/api/analyze';

const profiles = [
  {
    name: "Arjun Mehta",
    text: `Name: Arjun Mehta
Country: India
Preferred Abroad Destination: USA
Education: B.Tech Computer Science
CGPA: 8.2/10
Graduation Year: 2025
GRE: 318 (Q: 165, V: 153, AWA: 3.5)
IELTS: 7.5
Work Experience: 1.2 years
Backlogs: 0
Target Degree: MS in Computer Science
Visa: F-1`
  },
  {
    name: "Sofia Martinez",
    text: `Name: Sofia Martinez
Country: Colombia
Preferred Abroad Destination: Germany
Education: B.Sc. Information Technology
CGPA: 3.4/4.0
Graduation Year: 2024
GRE: Not Taken
IELTS: 7.0
German: A2
Work Experience: 2 years
Backlogs: 1
Target Degree: MSc Data Science
Visa: Student Visa`
  },
  {
    name: "Daniel Okafor",
    text: `Name: Daniel Okafor
Country: Nigeria
Preferred Abroad Destination: Canada
Education: B.Eng. Mechanical Engineering
CGPA: 3.62/4.0
Graduation Year: 2025
GRE: 309 (Q: 161, V: 148, AWA: 3.0)
IELTS: 7.5
Work Experience: 8 months
Backlogs: 0
Target Degree: MASc Mechanical Engineering
Visa: Study Permit`
  },
  {
    name: "Rohan Sharma",
    text: `Name: Rohan Sharma
Country: India
Preferred Abroad Destination: USA
Education: BCA
CGPA: 7.1/10
Graduation Year: 2025
GRE: 302 (Q: 158, V: 144, AWA: 3.0)
TOEFL: 94
Work Experience: 0 years
Backlogs: 2
Target Degree: MS in Information Systems
Visa: F-1
Funding: Self-funded
I-20 Required: Yes`
  }
];

function runProfile(profile) {
  return new Promise((resolve) => {
    const countryMatch = profile.text.match(/Preferred Abroad Destination:\s*([^\n]+)/i);
    const manualCountry = countryMatch ? countryMatch[1].trim() : "Not Decided";
    
    const postData = JSON.stringify({ 
      context: profile.text,
      manualCountry: manualCountry
    });
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(ENDPOINT, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`\n==================================================`);
          console.log(`✅ ${profile.name}`);
          console.log(`==================================================`);
          console.log(`Visa Extracted:`, json.studentDetails?.visaStatus || "MISSING");
          console.log(`Work Exp Extracted:`, json.studentDetails?.workExperience || "MISSING");
          console.log(`Backlogs Extracted:`, json.studentDetails?.backlogs || "MISSING");
          console.log(`Target Degree:`, json.studentDetails?.degreeObjective || "MISSING");
          console.log(`Visa Difficulty:`, json.visaDifficulty);
          console.log(`Recommendations:`, json.recommendedColleges.map(c => c.name).join(', '));
        } catch(e) {
          console.log(`❌ ${profile.name} - PARSE ERROR`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${profile.name} - CONNECTION REFUSED`);
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

async function run() {
  // Clear the database so we ONLY have exactly these test cases and no duplicates
  try {
    const Database = require('better-sqlite3');
    const path = require('path');
    const dbPath = path.join(process.cwd(), 'students.db');
    const db = new Database(dbPath);
    db.prepare('DELETE FROM students').run();
    db.close();
    console.log("🧹 Cleared older test runs from the dashboard...");
  } catch (e) {
    console.log("⚠️ Could not clear DB automatically (make sure you are in root directory)");
  }

  for (const p of profiles) {
    await runProfile(p);
  }
}

run();
