const puppeteer = require('puppeteer');

async function registerAsGuestAndVoteOnEveryPoll100Times() {
    try {
        const browser = await puppeteer.launch({ headless: false }); // Set to false for visual debugging
        const page = await browser.newPage();

        // Navigate to the page where the component is rendered
        await page.goto('http://localhost:3000');

        // Wait for the container with polls to be rendered
        await page.waitForSelector('.container');

        // Iterate to vote on polls multiple times
        for (let i = 0; i < 10; i++) {
            console.log(`Voting iteration ${i + 1}`);

            // Get all polls
            const polls = await page.$$('.poll-card');

            for (const poll of polls) {
                await clickVoteButton(poll, page);
                await sleep(500); // Sleep for 500ms to mimic human-like interaction
            }
        }

        // Close the browser
        await browser.close();
        console.log('Browser closed.');
    } catch (err) {
        console.error('An error occurred:', err);
    }
}

async function clickVoteButton(poll) {
    try {
        // Find all buttons within the poll
        const buttons = await poll.$$('button');
        
        for (const button of buttons) {
            // Evaluate button text to find the "Upvote" button
            const buttonText = await button.evaluate(node => node.innerText.trim());
            console.log(`Found button with text: ${buttonText}`);

            if (buttonText === 'UPVOTE') {
                const isDisabled = await button.evaluate(node => node.disabled);
                if (!isDisabled) {
                    await button.evaluate(node => node.scrollIntoView()); // Scroll to the button to ensure it is visible
                    await button.click();
                    console.log('Clicked an "Upvote" button');
                    return; // Stop after clicking the first active "Upvote" button
                } else {
                    console.log('Button is disabled, skipping.');
                }
            }
        }

    } catch (error) {
        console.error('Error clicking vote button:', error);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

registerAsGuestAndVoteOnEveryPoll100Times();

