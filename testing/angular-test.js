const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function registerAsGuestAndVoteOnEveryPoll100Times() {
    try {
        const browser = await puppeteer.launch({ headless: false }); // Set to false for visual debugging
        const page = await browser.newPage();

        // Navigate to the page where the component is rendered
        await page.goto('http://localhost:4200');

        // Wait for the polls to be rendered
        await page.waitForSelector('.container');

        // Initialize performance log structure
        const performanceLogs = {
            startTime: new Date().toISOString(),
            iterations: []
        };

        const totalIterations = 100; // Changed to 100 as per function name

        for (let i = 0; i < totalIterations; i++) {
            console.log(`Voting iteration ${i + 1}`);

            // Capture metrics before the iteration
            const iterationStartTime = Date.now();
            const iterationStartISO = new Date(iterationStartTime).toISOString();
            const loadAveragesBefore = os.loadavg();
            const memoryUsageBefore = process.memoryUsage();

            // Initialize log for the current iteration
            const iterationLog = {
                iteration: i + 1,
                startTime: iterationStartISO,
                cpuLoadBefore: {
                    '1min': loadAveragesBefore[0],
                    '5min': loadAveragesBefore[1],
                    '15min': loadAveragesBefore[2]
                },
                memoryUsageBefore: formatMemoryUsage(memoryUsageBefore),
                pollsVoted: []
            };

            const polls = await page.$$('.poll-card');
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
                await clickVoteButton(poll, page);

                const voteEnd = Date.now();
                const voteDuration = voteEnd - voteStart;
                iterationLog.pollsVoted[iterationLog.pollsVoted.length - 1].voteDurationMs = voteDuration;

                console.log(`Poll ${pollIndex + 1}: Vote completed in ${voteDuration} ms`);

                await sleep(20); // Sleep between votes to mimic human behavior
            }

            // Capture metrics after the iteration
            const iterationEndTime = Date.now();
            const iterationEndISO = new Date(iterationEndTime).toISOString();
            const iterationDuration = iterationEndTime - iterationStartTime;
            const loadAveragesAfter = os.loadavg();
            const memoryUsageAfter = process.memoryUsage();

            // Update iteration log with end metrics
            iterationLog.endTime = iterationEndISO;
            iterationLog.durationMs = iterationDuration;
            iterationLog.cpuLoadAfter = {
                '1min': loadAveragesAfter[0],
                '5min': loadAveragesAfter[1],
                '15min': loadAveragesAfter[2]
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

        // Write the performance logs to a CSV file
        const logFilePath = path.join(__dirname, 'performance-angular.csv');
        fs.writeFileSync(logFilePath, csvContent, 'utf8');

        // Close the browser
        await browser.close();
        console.log('Browser closed.');
        console.log('Performance log has been written to performance-angular.csv');
    } catch (err) {
        console.error('An error occurred:', err);
    }
}

async function clickVoteButton(poll, page) {
    try {
        // Wait for all non-disabled "Upvote" buttons to be loaded within the poll
        await poll.waitForSelector('.upvote-button:not([disabled])', { timeout: 5000 });

        // Get all non-disabled "Upvote" buttons within the poll
        const upvoteButtons = await poll.$$('.upvote-button:not([disabled])');
        if (upvoteButtons.length > 0) {
            // Generate a random index
            const randomIndex = Math.floor(Math.random() * upvoteButtons.length);
            // Scroll the selected button into view to ensure it's visible
            // Click the random button and wait for any resulting actions to complete
            const selectedButton = upvoteButtons[randomIndex];
            await selectedButton.evaluate(node => node.scrollIntoView());
            await selectedButton.click();

            // Log the index for debugging
            console.log(`Attempting to click button at index: ${randomIndex}`);



            console.log('Clicked a random Upvote button');
        } else {
            console.log('No active Upvote buttons found');
        }
    } catch (error) {
        console.log('Error in clickVoteButton:', error);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatMemoryUsage(memoryUsage) {
    // Convert bytes to megabytes for readability
    const format = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return {
        rss: format(memoryUsage.rss),
        heapTotal: format(memoryUsage.heapTotal),
        heapUsed: format(memoryUsage.heapUsed),
        external: format(memoryUsage.external)
    };
}

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

registerAsGuestAndVoteOnEveryPoll100Times();

