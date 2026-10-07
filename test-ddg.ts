import * as cheerio from 'cheerio';
async function run() {
  const query = "Top universities for Masters in Science technology in USA tuition fees cgpa";
  const res = await fetch("https://lite.duckduckgo.com/lite/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `q=${encodeURIComponent(query)}`
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const results: any[] = [];
  $('.result-snippet').each((i, el) => {
    results.push($(el).text().trim());
  });
  console.log(JSON.stringify(results, null, 2));
}
run();
