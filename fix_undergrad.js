const fs = require('fs');
let code = fs.readFileSync('src/app/api/analyze/route.ts', 'utf-8');

const oldLogic = `      const explicitUndergrad = /(?:pursuing|seeking|applying for|target|interested in)[\\s\\w]{0,20}(bachelor|undergrad|b\\.tech|b\\.sc|bcom|b\\.com|bba|b\\.b\\.a|bca|b\\.c\\.a|ba|b\\.a)/.test(lowerText);
      const explicitMBA = /(?:pursuing|seeking|applying for|target|interested in)[\\s\\w]{0,20}(mba|m\\.b\\.a)/.test(lowerText);
      const explicitPhD = /(?:pursuing|seeking|applying for|target|interested in)[\\s\\w]{0,20}(phd|doctorate)/.test(lowerText);
      const explicitMasters = /(?:pursuing|seeking|applying for|target|interested in)[\\s\\w]{0,20}(master|m\\.tech|m\\.sc|m\\.a|ms|m\\.s|post graduate)/.test(lowerText);`;

const newLogic = `      const explicitUndergrad = /(?:pursuing|seeking|applying for|target|interested in|course)[\\s\\w:\\-]{0,20}(bachelor|undergrad|b\\.tech|b\\.sc|bcom|b\\.com|bba|b\\.b\\.a|bca|b\\.c\\.a|ba|b\\.a)/.test(lowerText);
      const explicitMBA = /(?:pursuing|seeking|applying for|target|interested in|course)[\\s\\w:\\-]{0,20}(mba|m\\.b\\.a)/.test(lowerText);
      const explicitPhD = /(?:pursuing|seeking|applying for|target|interested in|course)[\\s\\w:\\-]{0,20}(phd|doctorate)/.test(lowerText);
      const explicitMasters = /(?:pursuing|seeking|applying for|target|interested in|course)[\\s\\w:\\-]{0,20}(master|m\\.tech|m\\.sc|m\\.a|ms|m\\.s|post graduate)/.test(lowerText);`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/app/api/analyze/route.ts', code);
console.log("Fixed intent sniffing logic");
