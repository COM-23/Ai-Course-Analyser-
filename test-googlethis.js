const google = require('googlethis');

async function test() {
    try {
        const response = await google.search('Top universities in USA tuition fees', {
            page: 0,
            safe: false,
            parse_ads: false
        });
        console.log("Found", response.results.length, "results");
        if (response.results.length > 0) {
            console.log(response.results[0].title);
            console.log(response.results[0].description);
        }
    } catch (e) {
        console.error(e);
    }
}
test();
