fetch("http://localhost:3004/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ additionalContext: "I have 9.0 CGPA in computer science", destinationCountry: "USA" })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
