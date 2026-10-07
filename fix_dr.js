const fs = require('fs');
let code = fs.readFileSync('src/app/api/analyze/route.ts', 'utf-8');

const oldRegex = `const nameMatch = lowerText.match(/(?:my name is|i am|this is|student name:?|student:?|name:?)\\s+([a-z]+(?:\\s+[a-z]+)?)/i);`;
const newRegex = `const nameMatch = lowerText.match(/(?:my name is|i am|this is|student name:?|student:?|name:?)\\s+(?:dr\\.?|mr\\.?|ms\\.?|mrs\\.?\\s+)?([a-z]+(?:\\s+[a-z]+)?)/i);`;

code = code.replace(oldRegex, newRegex);
fs.writeFileSync('src/app/api/analyze/route.ts', code);
console.log("Fixed Dr. prefix in name extraction");
