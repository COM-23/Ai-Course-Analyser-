async function test() {
    const res = await fetch("https://lite.duckduckgo.com/lite/", {
      method: "POST",
      headers: { "User-Agent": "Mozilla/5.0", "Content-Type": "application/x-www-form-urlencoded" },
      body: `q=${encodeURIComponent('Top universities in USA')}`
    });
    const html = await res.text();
    console.log(html.substring(0, 1000));
}
test();
