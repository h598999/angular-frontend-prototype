const puppeteer = require('puppeteer');
const fs = require('fs');

/**
 * Retrieves performance metrics from the browser using CDP.
 * @param {object} client - CDP session client.
 * @returns {object} - Performance metrics.
 */
async function getPerformanceMetrics(client) {
    const metrics = await client.send('Performance.getMetrics');
    const metricsObj = {};
    metrics.metrics.forEach(metric => {
        metricsObj[metric.name] = metric.value;
    });
    return metricsObj;
}


async function registerAsGuestAndVoteOnEveryPoll100Times(){
    try {
        await page.locator('.guest-button button').wait(); // Ensure this matches your DOM structure
        await page.locator('.guest-button button').click();
        console.log('Clicked the "Continue as Guest" button');
        const browser = await puppeteer.launch({ headless: true}); // Set to false for visual debugging
        const page = await browser.newPage();

        // Navigate to the page where the component is rendered
        await page.goto('http://localhost:5174');

        // Wait for the "Continue as Guest" button and click it

        // Wait for the polls to be rendered and click the first "Upvote" button
        await page.locator('.poll').wait();
        for (let i = 0; i<10; i++){    
        const polls = await page.$$('.poll');
        for (const poll of polls){
            await clickVoteButton(poll, page)
        }
        }

        await browser.close(); // Close the browser
    } catch (err) {
        console.error('An error occurred:', err);
    }
}

async function registerAndCreate100Polls(){
    const performanceData = [];
    const browser = await puppeteer.launch({ headless: false}); 
    const page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Performance.enable'); // Enable performance metrics
    try {
        // Create a CDP session to access Chrome DevTools Protocol

        await page.goto('http://localhost:5174');
        // Collect initial performance metrics
        let metrics = await getPerformanceMetrics(client);
        performanceData.push({ action: 'navigate', metrics });

        await page.waitForSelector('#username')
        await page.type('#username', generateRandomString(10))

        metrics = await getPerformanceMetrics(client);
        performanceData.push({ action: 'write_username', metrics });

        await page.waitForSelector('#email');
        await page.type('#email', 'testuser@example.com'); 

        metrics = await getPerformanceMetrics(client);
        performanceData.push({ action: 'write_email', metrics });

        await page.waitForSelector('[type="password"]');
        await page.type('[type="password"]', 'ksdaj;;ghsak'); 
        metrics = await getPerformanceMetrics(client);
        performanceData.push({ action: 'write_password', metrics });

        await page.locator('button').click();
        metrics = await getPerformanceMetrics(client);
        performanceData.push({ action: 'registerbutton', metrics });

        await pressCreatePollNav(page);
        metrics = await getPerformanceMetrics(client);
        performanceData.push({ action: 'clicknav', metrics });
        await addPoll(page);

    } catch (err) {
        console.error('An error occurred:', err); 
    } finally{
        // Save the performance data to a JSON file
        fs.writeFileSync('browserPerformanceMetrics.json', JSON.stringify(performanceData, null, 2));
        console.log('Performance metrics saved to browserPerformanceMetrics.json');

        await browser.close(); // C
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function pressCreatePollNav(page){
    // Wait for the navigation bar to be loaded
    await page.waitForSelector('nav');

    // Click the "Create Poll" link
    await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('a')).find(
            (a) => a.textContent.trim() === 'Create Poll'
        );
        if (link) {
            link.click();
        } else {
            console.error('Create Poll link not found');
        }
    });
}

async function addPoll(page){
    // Wait for the form to load
    await page.waitForSelector('#question');

    await page.type('#question', 'testquestion');


    await page.waitForSelector('#hoursvalid');
    await page.type('#hoursvalid', '2');
    await page.waitForSelector('#voteoptions');
    await page.type('#voteoptions', 'a');


    await sleep(20000)

}


async function clickVoteButton(poll, page) {
    // Wait for all non-disabled "Upvote" buttons to be loaded
    await page.waitForSelector('.poll button:not([disabled])');
    // Get all non-disabled "Upvote" buttons
    const upvoteButtons = await poll.$$('.poll button:not([disabled])');
    if (upvoteButtons.length > 0) {
        // Generate a random index
        const randomIndex = Math.floor(Math.random() * upvoteButtons.length);
        
        // Log the index for debugging
        console.log(`Attempting to click button at index: ${randomIndex}`);
        
        // Click the random button and wait for it to complete
        await upvoteButtons[randomIndex].click();
        
        console.log('Clicked a random Upvote button');
    } else {
        console.log('No active Upvote buttons found');
    }
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

registerAndCreate100Polls(); 
