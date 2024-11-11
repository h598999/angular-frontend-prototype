const puppeteer = require('puppeteer')

async function registerAsGuestAndVoteOnEveryPoll100Times(){
    try {
        const browser = await puppeteer.launch({ headless: false}); // Set to false for visual debugging
        const page = await browser.newPage();

        // Navigate to the page where the component is rendered
        await page.goto('http://localhost:4200');

        // Wait for the "Continue as Guest" button and click it

        // Wait for the polls to be rendered and click the first "Upvote" button
        await page.locator('.container').wait();
        for (let i = 0; i<10; i++){    
        const polls = await page.$$('.poll-card');
        for (const poll of polls){
            await clickVoteButton(poll, page)
            await sleep(200)
        }
        }

        await browser.close(); // Close the browser
    } catch (err) {
        console.error('An error occurred:', err);
    }
}
    
async function clickVoteButton(poll, page) {
    // Wait for all non-disabled "Upvote" buttons to be loaded
    await page.waitForSelector('.upvote-button:not([disabled])');
    // Get all non-disabled "Upvote" buttons
    const upvoteButtons = await poll.$$('.upvote-button:not([disabled])');
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

registerAsGuestAndVoteOnEveryPoll100Times();
