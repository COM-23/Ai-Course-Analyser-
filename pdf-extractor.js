const fs = require('fs');
const pdfParse = require('pdf-parse');

async function extract() {
  try {
    const buffer = fs.readFileSync(process.argv[2]);
    const data = await pdfParse(buffer);
    console.log(JSON.stringify({ text: data.text }));
  } catch (e) {
    console.log(JSON.stringify({ error: e.message }));
  }
}
extract();
