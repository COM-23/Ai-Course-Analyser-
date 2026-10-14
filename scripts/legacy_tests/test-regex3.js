let extractedCgpa = 7.5;
const cgpaMatch = ["5.98 cgp", "5.98", undefined];
if (cgpaMatch && cgpaMatch[1]) {
      const parsed = parseFloat(cgpaMatch[1]);
      const scale = cgpaMatch[2] ? parseFloat(cgpaMatch[2]) : null;

      if (scale === 4 || scale === 4.0) {
        extractedCgpa = (parsed / 4) * 10;
      } else if (scale === 10 || scale === 10.0) {
        extractedCgpa = parsed;
      } else if (parsed > 0 && parsed <= 4.0) {
        extractedCgpa = (parsed / 4) * 10;
      } else if (parsed > 10 && parsed <= 100) {
        extractedCgpa = parsed / 10;
      } else if (parsed > 0 && parsed <= 10) {
        extractedCgpa = parsed;
      }
}
console.log(extractedCgpa);
