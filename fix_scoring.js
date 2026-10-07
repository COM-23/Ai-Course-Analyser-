const fs = require('fs');
let code = fs.readFileSync('src/app/api/analyze/route.ts', 'utf-8');

const oldLogic = `          let weight = 1;
          // Give high weight to explicit degrees (btech, mtech, ba, ma, bs, ms)
          if (kw.includes("bachelor") || kw.includes("master") || kw.length <= 5 || kw.includes("tech")) {
            weight = 10;
          }
          // Demote generic single-word subjects back to 1
          if (["arts", "science", "commerce", "management", "history", "english", "languages", "data", "it", "media"].includes(kw)) {
            weight = 1; 
          }
          d.score += (matches.length * weight);`;

const newLogic = `          let weight = 1;
          // Give high weight to explicit degrees
          if (kw.includes("bachelor") || kw.includes("master") || kw.includes("tech")) {
            weight = 5;
          }
          // Demote generic single-word subjects back to 1
          if (["arts", "science", "commerce", "management", "history", "english", "languages", "data", "it", "media", "ba", "ma", "bs", "ms", "bsc", "msc", "b.a", "m.a", "b.s.", "m.s.", "b.sc", "m.sc"].includes(kw)) {
            weight = 1; 
          }
          
          // CRITICAL: Massive boost if the keyword appears inside the specific target degree
          if (degreeObjective.toLowerCase().includes(kw)) {
            // Only boost actual subject words, not generic prefixes
            if (!["ba", "ma", "bs", "ms", "bsc", "msc", "b.a", "m.a", "b.s.", "m.s.", "b.sc", "m.sc", "bachelor", "master"].includes(kw)) {
               weight += 50; 
            }
          }
          
          d.score += (matches.length * weight);`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/app/api/analyze/route.ts', code);
console.log("Fixed scoring logic");
