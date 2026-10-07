const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
async function run() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([200, 200]);
  page.drawText('This is a test student profile. Budget $50,000. CGPA 9.5/10. Domain: Tech', { x: 10, y: 150, size: 10, color: rgb(0, 0, 0) });
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test.pdf', pdfBytes);
}
run();
