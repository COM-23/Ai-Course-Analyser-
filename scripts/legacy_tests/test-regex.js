const text = "dishik\nbtech cs completed\n5.98 cgpa\npreferred course masters in ai";
const match = text.match(/(?:cgps|cgp|cgpa|gpa|pointer|score)[\s\w]*(?:\s+of|\s+is|in)?[\s:=]*(\d+\.?\d*)(?:\s*\/\s*(\d+\.?\d*))?/i);
console.log(match);
