const lowerText = "ms in computer science destination as usa".toLowerCase();
const explicitCountry = lowerText.match(/(?:target country|study in|destination|interested in)[\s:-]*(usa|us|united states|uk|united kingdom|canada|australia|germany|ireland|new zealand|europe|singapore|dubai)/i);
console.log("Regex 1:", explicitCountry ? explicitCountry[1] : "null");

const lowerText2 = "destination: usa".toLowerCase();
const explicitCountry2 = lowerText2.match(/(?:target country|study in|destination|interested in)[\s:-]*(usa|us|united states|uk|united kingdom|canada|australia|germany|ireland|new zealand|europe|singapore|dubai)/i);
console.log("Regex 2:", explicitCountry2 ? explicitCountry2[1] : "null");
