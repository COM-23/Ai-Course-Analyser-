const text = `John Doe
Contact: 12345
Education: BTech`;
const lowerText = text.toLowerCase();
let extractedName = "Unknown";
const firstLine = text.trim().split(/[\r\n]+/)[0];
if (firstLine && firstLine.length > 2 && firstLine.length < 30) {
  extractedName = firstLine.trim().replace(/\b\w/g, l => l.toUpperCase());
}
console.log("Name:", extractedName);
