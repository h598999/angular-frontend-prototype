// vote-vue.js

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Formats memory usage from bytes to megabytes.
 * @param {Object} memoryUsage - The memory usage object from process.memoryUsage().
 * @returns {Object} - Formatted memory usage in MB.
 */
function formatMemoryUsage(memoryUsage) {
    const toMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return {
        rss: toMB(memoryUsage.rss),
        heapTotal: toMB(memoryUsage.heapTotal),
        heapUsed: toMB(memoryUsage.heapUsed),
        external: toMB(memoryUsage.external)
    };
}

/**
 * Generates CSV content from the performance logs.
 * @param {Object} performanceLogs - The performance logs object.
 * @returns {string} - The CSV formatted string.
 */
function generateCSV(performanceLogs) {
    const header = [
        'Iteration',
        'StartTime',
        'EndTime',
        'DurationMs',
        'CPU_LoadBefore_1min',
        'CPU_LoadBefore_5min',
        'CPU_LoadBefore_15min',
        'MemoryBefore_RSS_MB',
        'MemoryBefore_HeapTotal_MB',
        'MemoryBefore_HeapUsed_MB',
        'MemoryBefore_External_MB',
        'CPU_LoadAfter_1min',
        'CPU_LoadAfter_5min',
        'CPU_LoadAfter_15min',
        'MemoryAfter_RSS_MB',
        'MemoryAfter_HeapTotal_MB',
        'MemoryAfter_HeapUsed_MB',
        'MemoryAfter_External_MB',
        'PollIndex',
        'VoteStartTime',
        'VoteDurationMs'
    ];

    let csvRows = [];
    csvRows.push(header.join(','));

    performanceLogs.iterations.forEach(iteration => {
        const {
            iteration: iterNum,
            startTime,
            endTime,
            durationMs,
            cpuLoadBefore,
            memoryUsageBefore,
            cpuLoadAfter,
            memoryUsageAfter,
            pollsVoted
        } = iteration;

        pollsVoted.forEach(vote => {
            const row = [
                iterNum,
                `"${startTime}"`,
                `"${endTime}"`,
                durationMs,
                cpuLoadBefore['1min'],
                cpuLoadBefore['5min'],
                cpuLoadBefore['15min'],
                memoryUsageBefore.rss,
                memoryUsageBefore.heapTotal,
                memoryUsageBefore.heapUsed,
                memoryUsageBefore.external,
                cpuLoadAfter['1min'],
                cpuLoadAfter['5min'],
                cpuLoadAfter['15min'],
                memoryUsageAfter.rss,
                memoryUsageAfter.heapTotal,
                memoryUsageAfter.heapUsed,
                memoryUsageAfter.external,
                vote.pollIndex,
                `"${vote.voteStartTime}"`,
                vote.voteDurationMs
            ];
            csvRows.push(row.join(','));
        });
    });

    return csvRows.join(os.EOL);
}

/**
 * Clicks a random "Upvote" button within a poll.
 * @param {ElementHandle} poll - The Puppeteer ElementHandle representing a poll.
 * @param {number} pollIndex - The index of the poll for logging purposes.
 * @returns {Promise<void>}
 */
async function clickVoteButton(poll, pollIndex) {
    try {
        // Find all buttons within the poll that have the label "Upvote" and are not disabled
        const buttons = await poll.$$('button');

        const availableVoteButtons = [];

        for (const button of buttons) {
            const label = await (await button.getProperty('innerText')).jsonValue();
            if (label.trim().toLowerCase() === 'upvote') {
                const isDisabled = await (await button.getProperty('disabled')).jsonValue();
                if (!isDisabled) {
                    availableVoteButtons.push(button);
                }
            }
        }

        if (availableVoteButtons.length === 0) {
            console.log(`Poll ${pollIndex}: No active "Upvote" buttons found.`);
            return;
        }

        // Select a random "Upvote" button
        const randomIndex = Math.floor(Math.random() * availableVoteButtons.length);
        const selectedButton = availableVoteButtons[randomIndex];
        const selectedButtonLabel = await (await selectedButton.getProperty('innerText')).jsonValue();

        // Scroll the button into view and click it
        await selectedButton.evaluate(button => button.scrollIntoView());
        await selectedButton.click();

        console.log(`Poll ${pollIndex}: Clicked "${selectedButtonLabel}" button.`);
    } catch (error) {
        console.error(`Error clicking vote button in poll ${pollIndex}:`, error);
    }
}

/**
 * Sleeps for the specified number of milliseconds.
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to automate voting and performance logging.
 */
async function automateVotingAndLogPerformance() {
    try {
        const browser = await puppeteer.launch({ headless: false}); // Set to false if you want to see the browser actions
        const page = await browser.newPage();

        // Navigate to the Vue application
        await page.goto('http://localhost:8081', { waitUntil: 'networkidle2' });

        // Wait for the container with polls to load
        await page.waitForSelector('.container');

        // Initialize performance log structure
        const performanceLogs = {
            startTime: new Date().toISOString(),
            iterations: []
        };

        const totalIterations = 100; // Number of voting iterations

        for (let i = 0; i < totalIterations; i++) {
            console.log(`\nStarting Iteration ${i + 1} of ${totalIterations}`);

            // Capture metrics before the iteration
            const iterationStartTime = Date.now();
            const iterationStartISO = new Date(iterationStartTime).toISOString();
            const cpuLoadBefore = os.loadavg();
            const memoryUsageBefore = process.memoryUsage();

            // Initialize log for the current iteration
            const iterationLog = {
                iteration: i + 1,
                startTime: iterationStartISO,
                cpuLoadBefore: {
                    '1min': cpuLoadBefore[0],
                    '5min': cpuLoadBefore[1],
                    '15min': cpuLoadBefore[2]
                },
                memoryUsageBefore: formatMemoryUsage(memoryUsageBefore),
                pollsVoted: []
            };

            // Get all polls
            const polls = await page.$$('.poll');
            console.log(`Found ${polls.length} polls in Iteration ${i + 1}`);

            for (const [pollIndex, poll] of polls.entries()) {
                const voteStart = Date.now();
                const voteStartISO = new Date(voteStart).toISOString();

                // Log the vote start
                iterationLog.pollsVoted.push({
                    pollIndex: pollIndex + 1, // 1-based index
                    voteStartTime: voteStartISO,
                    voteDurationMs: null // To be updated after vote
                });

                // Perform the vote
                await clickVoteButton(poll, pollIndex + 1);

                const voteEnd = Date.now();
                const voteDuration = voteEnd - voteStart;
                iterationLog.pollsVoted[iterationLog.pollsVoted.length - 1].voteDurationMs = voteDuration;

                console.log(`Poll ${pollIndex + 1}: Vote completed in ${voteDuration} ms`);

                // Optional: Sleep between votes to mimic human behavior
                await sleep(20); // 20 ms
            }

            // Capture metrics after the iteration
            const iterationEndTime = Date.now();
            const iterationEndISO = new Date(iterationEndTime).toISOString();
            const iterationDuration = iterationEndTime - iterationStartTime;
            const cpuLoadAfter = os.loadavg();
            const memoryUsageAfter = process.memoryUsage();

            // Update iteration log with end metrics
            iterationLog.endTime = iterationEndISO;
            iterationLog.durationMs = iterationDuration;
            iterationLog.cpuLoadAfter = {
                '1min': cpuLoadAfter[0],
                '5min': cpuLoadAfter[1],
                '15min': cpuLoadAfter[2]
            };
            iterationLog.memoryUsageAfter = formatMemoryUsage(memoryUsageAfter);

            // Add the current iteration's log to the performanceLogs
            performanceLogs.iterations.push(iterationLog);

            console.log(`Iteration ${i + 1} completed in ${iterationDuration} ms`);
        }

        // Capture overall end time
        performanceLogs.endTime = new Date().toISOString();

        // Convert performanceLogs to CSV format
        const csvContent = generateCSV(performanceLogs);

        // Define the CSV file path
        const logFilePath = path.join(__dirname, 'performance-vue.csv');

        // Write the CSV content to the file
        fs.writeFileSync(logFilePath, csvContent, 'utf8');
        console.log(`\nPerformance log has been written to ${logFilePath}`);

        // Close the browser
        await browser.close();
        console.log('Browser closed.');
    } catch (error) {
        console.error('An error occurred during automation:', error);
    }
}

// Execute the main function
automateVotingAndLogPerformance();

