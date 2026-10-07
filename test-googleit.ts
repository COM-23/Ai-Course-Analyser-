import googleIt from 'google-it';

async function test() {
    try {
        const results = await googleIt({ query: 'Top universities for Masters in Science technology in USA with tuition fees' });
        results.forEach((r: any) => {
            console.log(r.title);
            console.log(r.snippet);
            console.log("---");
        });
    } catch (e) {
        console.error("ERROR:", e);
    }
}
test();
