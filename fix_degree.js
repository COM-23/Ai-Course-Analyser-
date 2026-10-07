const fs = require('fs');
let code = fs.readFileSync('src/app/api/analyze/route.ts', 'utf-8');

const oldLogic = `    if (genericDegreeMatch && genericDegreeMatch[1] && genericDegreeMatch[2]) {
      const degreeType = genericDegreeMatch[1].toUpperCase().replace(/\\./g, '');
      const subject = genericDegreeMatch[2].trim().replace(/\\b\\w/g, c => c.toUpperCase());
      degreeObjective = \`\${degreeType} in \${subject}\`;
    } else if (targetDegreeMatch && targetDegreeMatch[1]) {
      degreeObjective = targetDegreeMatch[1].trim();
      degreeObjective = degreeObjective.replace(/\\b\\w/g, c => c.toUpperCase());
    }`;

const newLogic = `    if (targetDegreeMatch && targetDegreeMatch[1]) {
      degreeObjective = targetDegreeMatch[1].trim();
      degreeObjective = degreeObjective.replace(/\\b\\w/g, c => c.toUpperCase());
    } else if (genericDegreeMatch && genericDegreeMatch[1] && genericDegreeMatch[2]) {
      const degreeType = genericDegreeMatch[1].toUpperCase().replace(/\\./g, '');
      const subject = genericDegreeMatch[2].trim().replace(/\\b\\w/g, c => c.toUpperCase());
      degreeObjective = \`\${degreeType} in \${subject}\`;
    }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/app/api/analyze/route.ts', code);
console.log("Fixed degree extraction precedence");
