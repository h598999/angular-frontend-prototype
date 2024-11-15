const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.goto("https://pptr.dev", {waitUntil: "networkidle2"});

    const metrics = await page.evaluate(() => JSON.stringify(window.performance))
    console.log(JSON.parse(metrics));

    //Built in metrics can be parsed into 
    const pageMetrics = await page.metrics();
    console.log(pageMetrics);
    
    await browser.close();
})();
