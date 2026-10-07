const rawData = `
Student 1
Name: Arjun Mehta
Country: India
Preferred Abroad Destination: USA
Education: B.Tech Computer Science
CGPA: 8.2/10
Graduation Year: 2025
GRE: 318 (Q: 165, V: 153, AWA: 3.5)
IELTS: 7.5
Work Experience: 1.2 years
Backlogs: 0
Target Degree: MS in Computer Science
Visa: F-1
`;
const lowerText = rawData.toLowerCase();
let extractedName = "Unknown Student";
const nameMatch = lowerText.match(/(?:my name is|i am|this is|student name:?|name:?)\s+([a-z]+(?:\s+[a-z]+)?)/i);
if (nameMatch && nameMatch[1]) extractedName = nameMatch[1].replace(/\b\w/g, l => l.toUpperCase());

let destinationCountry = "Not Decided";
const explicitCountry = lowerText.match(/(?:target country|study in|destination|interested in|location|country)[\s:-]*(usa|us|united states|uk|united kingdom|canada|australia|germany|ireland|new zealand|europe|singapore|dubai)/i);
const fallbackCountry = lowerText.match(/\b(usa|united states|uk|united kingdom|canada|australia|germany|ireland|new zealand|europe|singapore|dubai)\b/i);
const matchedC = explicitCountry ? explicitCountry[1] : (fallbackCountry ? fallbackCountry[1] : null);
if (matchedC) {
    const c = matchedC.toLowerCase();
    if (c.includes("us") || c.includes("america")) destinationCountry = "USA";
    else if (c.includes("uk") || c.includes("kingdom")) destinationCountry = "UK";
    else destinationCountry = matchedC; // Fallback
}

let degreeObjective = "Post Graduate / Masters";
const genericDegreeMatch = lowerText.match(/\b(ms|m\.s|msc|m\.sc|mtech|m\.tech|ma|m\.a|mba|btech|b\.tech|bsc|b\.sc|ba|b\.a|bca|bba|master|bachelor)(?:'s|s)?\s+(?:in|of)\s+([a-z\s]+)\b/i);
const targetDegreeMatch = lowerText.match(/(?:target degree|degree|course)[\s:]*([a-z0-9\- \t\.]+)/i);
if (genericDegreeMatch && genericDegreeMatch[1] && genericDegreeMatch[2]) {
    const degreeType = genericDegreeMatch[1].toUpperCase().replace(/\./g, '');
    const subject = genericDegreeMatch[2].trim().replace(/\b\w/g, c => c.toUpperCase());
    degreeObjective = `${degreeType} in ${subject}`;
} else if (targetDegreeMatch && targetDegreeMatch[1]) {
    degreeObjective = targetDegreeMatch[1].trim();
    degreeObjective = degreeObjective.replace(/\b\w/g, c => c.toUpperCase());
}

let extractedCgpa = 7.5;
const cgpaMatch = lowerText.match(/(?:cgpa|gpa)(?:\s+of|\s+is)?[\s:=]*(\d+\.?\d*)(?:\s*\/\s*(\d+\.?\d*))?/i) || lowerText.match(/(\d+\.?\d*)\s*(?:cgpa|gpa)/i);
if (cgpaMatch && cgpaMatch[1]) {
    extractedCgpa = parseFloat(cgpaMatch[1]);
}

let extractedBudget = 50000;
const usdNumberSniffer = lowerText.match(/(?:\s|^)([1-9][0-9]{4}|[1-9][0-9],[0-9]{3})(?:\s|$)/);
if (usdNumberSniffer && usdNumberSniffer[1]) {
    extractedBudget = parseInt(usdNumberSniffer[1].replace(/,/g, ''));
}
const massiveNumberSniffer = lowerText.match(/(?:\s|^)([1-9][0-9,]{5,})(?:\s|$)/);
if (massiveNumberSniffer && massiveNumberSniffer[1]) {
    extractedBudget = parseInt(massiveNumberSniffer[1].replace(/,/g, '')) / 83.5;
}

console.log({ extractedName, destinationCountry, degreeObjective, extractedCgpa, extractedBudget });
