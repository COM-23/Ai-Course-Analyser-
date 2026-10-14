const lowerText = "dishik\nbtech cs completed\n5.98 cgpa\npreferred course masters in ai 8000000";
const cgpaMatch = lowerText.match(/(?:cgps|cgp|cgpa|gpa|pointer|score)[a-z \t]{0,20}(?:\s+of|\s+is|in)?[\s:=]*(\d+\.?\d*)(?:\s*\/\s*(\d+\.?\d*))?/i) || lowerText.match(/(\d+\.?\d*)\s*(?:cgps|cgp|cgpa|gpa|pointer|score)/i);
console.log(cgpaMatch);
