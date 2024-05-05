const puppeteer = require("puppeteer");
async function scrapeGIFirst(_url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(_url);
    // if(page.document){
    //     console.log("page whent to")
    // }
    // else{
    //     console.error("couldnt go to that page")
    // }

    // return
        // Use evaluate to extract the src URL
    const srcUrl = await page.evaluate(() => {
        // Find the parent tag with class="mNsIhb"
        const parentTag = document.querySelector('.mNsIhb');

        // Find the child tag with class="YQ4gaf"
        const childTag = parentTag.querySelector('.YQ4gaf');

        // Extract the src attribute
        return childTag.src;
    });
    
    // console.log(`srcUrl NOT FOUND == ${srcUrl === null}`);
    await browser.close();
    console.log(`srcUrl: ${srcUrl != null}`)
    return srcUrl;
}

module.exports = {
    scrapeGIFirst: scrapeGIFirst
};
