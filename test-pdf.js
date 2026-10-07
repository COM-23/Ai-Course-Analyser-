const fs = require('fs');
const pdfParse = require('pdf-parse');
async function test() {
  try {
    const dataBuffer = fs.readFileSync('package.json'); // wait, need a pdf file
    console.log("pdfParse loaded");
  } catch (e) {
    console.error("error", e);
  }
}
test();
