const http = require('http');

const ENDPOINT = 'http://localhost:3000/api/analyze';

// Arrays to randomize 200 combinations
const domains = ["Bioinformatics", "Astrophysics", "Clinical Social Work", "Cybersecurity", "Orthodontics", "Supply Chain Management", "Culinary Arts", "Cinematography", "Agronomy", "Intellectual Property Law", "Genetics", "MBBS", "B.Tech", "M.Sc Nursing", "M.Des", "BBA", "B.Pharm"];
const countries = ["USA", "United Kingdom", "Canada", "Australia", "Germany", "New Zealand", "Singapore", "Ireland"];
const intakes = ["Fall 2027", "Spring 2028", "Fall 2028", "Spring 2029"];
const prefixes = [
  "I am an ambitious student with a",
  "I have a",
  "My academic background includes a",
  "I scored a",
  "Graduated with a"
];
const suffixes = [
  "and want to study abroad.",
  "looking for a Master's degree.",
  "seeking top universities.",
  "hoping to get a scholarship.",
  "and want to specialize in this field."
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(1);
}

function generateRandomTestCase(index) {
  const cgpa = getRandomFloat(4.5, 9.9);
  const domain = domains[getRandomInt(0, domains.length - 1)];
  const country = countries[getRandomInt(0, countries.length - 1)];
  const intake = intakes[getRandomInt(0, intakes.length - 1)];
  
  const prefix = prefixes[getRandomInt(0, prefixes.length - 1)];
  const suffix = suffixes[getRandomInt(0, suffixes.length - 1)];
  
  const context = `${prefix} ${cgpa} CGPA in ${domain}. I am ${suffix}`;

  return {
    context,
    manualCountry: country,
    manualIntake: intake
  };
}

function runTest(payload, index) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);

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
        resolve(res.statusCode);
      });
    });

    req.on('error', (e) => {
      resolve(500);
    });
    
    req.write(postData);
    req.end();
  });
}

async function runBulkGeneration() {
  console.log("==================================================");
  console.log("🚀 STARTING BULK TEST GENERATION (200 CASES) 🚀");
  console.log("==================================================");
  console.log("Sending 200 requests to the local server. This will take a moment...");

  let successCount = 0;
  
  // We'll process them in batches of 10 to avoid overwhelming the local server
  const BATCH_SIZE = 10;
  const TOTAL_CASES = 200;

  for (let i = 0; i < TOTAL_CASES; i += BATCH_SIZE) {
    const batchPromises = [];
    
    for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_CASES; j++) {
      const payload = generateRandomTestCase(i + j + 1);
      batchPromises.push(runTest(payload, i + j + 1));
    }
    
    const results = await Promise.all(batchPromises);
    const successfulInBatch = results.filter(status => status === 200).length;
    successCount += successfulInBatch;
    
    console.log(`Processed batch ${i / BATCH_SIZE + 1}/${TOTAL_CASES / BATCH_SIZE} (${successCount} successful so far)`);
  }

  console.log("==================================================");
  console.log(`✅ FINISHED! Sent 200 test cases. (${successCount} succeeded)`);
  console.log(`🌍 Open your web browser at http://localhost:3000 to see the dashboard filled with 200 students!`);
  console.log("==================================================");
}

runBulkGeneration();
