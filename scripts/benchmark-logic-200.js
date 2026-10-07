const http = require('http');

const ENDPOINT = 'http://localhost:3000/api/analyze';

// -------------------------------------------------------------
// BENCHMARK LOGIC
// -------------------------------------------------------------
// This script runs 200 random test cases and evaluates the JSON 
// server responds. It mathematically asserts that the AI's logic is
// sound for EVERY SINGLE RECOMMENDATION it makes.

const domains = [
  "Clinical Social Work", // arts
  "Supply Chain Management", // commerce
  "Bioinformatics", // science
  "Orthodontics", // medicine
  "Intellectual Property Law", // law
  "Special Education", // education
  "Culinary Arts", // hospitality
  "Cinematography", // performing arts
  "Agronomy", // agriculture
  "MBBS", // medicine
  "B.Tech", // science
  "MBA" // commerce
];
const countries = ["USA", "United Kingdom", "Canada", "Australia", "Germany"];
const intakes = ["Fall 2027", "Spring 2028"];

function getRandomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(1);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTestCase() {
  const cgpa = parseFloat(getRandomFloat(4.5, 9.9));
  const domain = domains[getRandomInt(0, domains.length - 1)];
  const country = countries[getRandomInt(0, countries.length - 1)];
  const intake = intakes[getRandomInt(0, intakes.length - 1)];

  return {
    cgpa,
    domain,
    payload: {
      context: `I have a ${cgpa} CGPA in ${domain}. I want to study in ${country} starting ${intake}.`,
      manualCountry: country,
      manualIntake: intake
    }
  };
}

function runTestCase(testCase, index) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(testCase.payload);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const startTime = Date.now();
    const req = http.request(ENDPOINT, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - startTime;
        let logicPassed = true;
        let failReason = '';

        try {
          const json = JSON.parse(data);
          
          if (!json.studentDetails || !json.recommendedColleges) {
             throw new Error("Missing critical JSON fields");
          }

          // --- LOGIC ASSERTIONS ---
          
          // 1. Did it accurately extract CGPA?
          const extractedCgpa = parseFloat(json.studentDetails.cgpa);
          if (extractedCgpa !== testCase.cgpa) {
            logicPassed = false;
            failReason += `[Extraction Fail] Expected CGPA ${testCase.cgpa}, got ${extractedCgpa}. `;
          }
          
          let expectedTaxonomyDomain = "science_technology";
          if (testCase.domain === "Clinical Social Work") expectedTaxonomyDomain = "arts_humanities_social_sciences";
          else if (testCase.domain === "Supply Chain Management" || testCase.domain === "MBA") expectedTaxonomyDomain = "commerce_management";
          else if (testCase.domain === "Bioinformatics" || testCase.domain === "B.Tech") expectedTaxonomyDomain = "science_technology";
          else if (testCase.domain === "Orthodontics" || testCase.domain === "MBBS") expectedTaxonomyDomain = "medicine_allied_health";
          else if (testCase.domain === "Intellectual Property Law") expectedTaxonomyDomain = "law";
          else if (testCase.domain === "Special Education") expectedTaxonomyDomain = "education";
          else if (testCase.domain === "Culinary Arts") expectedTaxonomyDomain = "hospitality_tourism_events";
          else if (testCase.domain === "Cinematography") expectedTaxonomyDomain = "performing_arts_media";
          else if (testCase.domain === "Agronomy") expectedTaxonomyDomain = "agriculture_veterinary";

          const extractedDomain = json.studentDetails.primaryDomain || json.studentSummary?.toLowerCase();

          // 2. Category logic bounds
          for (const college of json.recommendedColleges) {
            const reqGpa = parseFloat(college.minCgpa);
            const diff = extractedCgpa - reqGpa;
            
            let expectedCategory = "Reach";
            if (diff >= 1.0) expectedCategory = "Safety";
            else if (diff >= 0) expectedCategory = "Target";
            
            if (college.category !== expectedCategory) {
              logicPassed = false;
              failReason += `[Category Logic Fail] CGPA ${extractedCgpa} vs Req ${reqGpa}. Diff is ${diff}. Expected ${expectedCategory}, got ${college.category}. `;
            }
          }

        } catch (e) {
          logicPassed = false;
          failReason = `Parse Error or Server Crash: ${e.message}`;
        }

        if (logicPassed) {
          process.stdout.write(`\rEvaluating Test Case [${index}/200] (CGPA: ${testCase.cgpa}, Domain: ${testCase.domain})... ✅ PASSED (${duration}ms)\n`);
        } else {
          process.stdout.write(`\rEvaluating Test Case [${index}/200] (CGPA: ${testCase.cgpa}, Domain: ${testCase.domain})... ❌ FAILED\n   -> ${failReason}\n`);
        }
        
        resolve(logicPassed);
      });
    });

    req.on('error', (e) => {
      process.stdout.write(`\rEvaluating Test Case [${index}/200] (CGPA: ${testCase.cgpa}, Domain: ${testCase.domain})... ❌ FAILED\n   -> Connection Refused\n`);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

async function runBulkGeneration() {
  console.log("==================================================");
  console.log("🚀 STARTING LOGIC BENCHMARK (200 CASES) 🚀");
  console.log("==================================================");

  let successCount = 0;
  let failCount = 0;
  
  const BATCH_SIZE = 10;
  const TOTAL_CASES = 200;

  for (let i = 0; i < TOTAL_CASES; i += BATCH_SIZE) {
    const batchPromises = [];
    
    for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_CASES; j++) {
      const payload = generateTestCase();
      batchPromises.push(runTestCase(payload, i + j + 1));
    }
    
    const results = await Promise.all(batchPromises);
    const successfulInBatch = results.filter(passed => passed).length;
    successCount += successfulInBatch;
    failCount += (results.length - successfulInBatch);
  }

  const passPercentage = ((successCount / TOTAL_CASES) * 100).toFixed(1);

  console.log("==================================================");
  console.log(`✅ BENCHMARK COMPLETE`);
  console.log(`   Passed: ${successCount}/${TOTAL_CASES} (${passPercentage}%)`);
  console.log(`   Failed: ${failCount}/${TOTAL_CASES}`);
  console.log("==================================================");
}

runBulkGeneration();
