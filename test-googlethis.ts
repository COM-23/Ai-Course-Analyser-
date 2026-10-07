import google from 'googlethis';

async function test() {
    const query = 'Top universities for Masters in Science technology in USA with tuition fees';
    try {
        const response = await google.search(query);
        console.log("RESULTS:", response.results.length);
        if (response.results.length === 0) console.log(response);
        response.results.forEach((r: any) => {
            console.log(r.title);
            console.log(r.description);
            console.log("---");
        });
    } catch (e) {
        console.error("ERROR:", e);
    }
}
test();
