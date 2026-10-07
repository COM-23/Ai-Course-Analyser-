const google = require('googlethis');
async function run() {
  const query = "universities in USA";
  const response = await google.search(query, { page: 0, safe: false, parse_ads: false });
  console.log(JSON.stringify(response.results, null, 2));
}
run();
