const http = require('http');
const FormData = require('form-data');

const form = new FormData();
form.append("additionalContext", "just tel me in germany we dont have the Ms in information science just tell me");
form.append("destinationCountry", "Not Decided");
form.append("targetIntake", "Not Decided");
form.append("aiStrictness", "standard");

const req = http.request('http://localhost:3004/api/analyze', {
  method: 'POST',
  headers: form.getHeaders()
}, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log(JSON.parse(responseData));
  });
});

form.pipe(req);
