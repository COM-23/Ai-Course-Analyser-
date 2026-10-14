const text = "dishik\nbtech cs completed\n5.98 cgpa\npreferred course masters in ai";
const match2 = text.match(/(\d+\.?\d*)\s*(?:cgps|cgp|cgpa|gpa|pointer|score)/i);
console.log(match2);
