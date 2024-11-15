const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function voteOnEveryPoll100Times(){
    try{
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();

        // Set up PerformanceObservers before any page interactions
        await page.evaluateOnNewDocument(() => {
            // Initialize Web Vitals variables
            window.firstContentfulPaint = 0;
            window.largestContentfulPaint = 0;
            window.cumulativeLayoutShiftScore = 0;
            window.interactionToNextPaintTimes = [];

            // FCP Observer
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntriesByName("first-contentful-paint");
                if (entries.length > 0) {
                    window.firstContentfulPaint = entries[0].startTime;
                }
            }).observe({ type: 'paint', buffered: true });

            // LCP Observer
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntriesByType("largest-contentful-paint");
                if (entries.length > 0) {
                    window.largestContentfulPaint = entries[entries.length - 1].startTime;
                }
            }).observe({ type: 'largest-contentful-paint', buffered: true });

            // CLS Observer
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        window.cumulativeLayoutShiftScore += entry.value;
                    }
                }
            }).observe({ type: 'layout-shift', buffered: true });

            // INP Setup
            const measureInteractionToNextPaint = (startTime) => {
                requestAnimationFrame(() => {
                    const paintTime = performance.now();
                    const inpTime = paintTime - startTime;
                    window.interactionToNextPaintTimes.push(inpTime);
                });
            };

            const interactionEvents = ['click', 'keydown', 'pointerdown'];
            interactionEvents.forEach(event => {
                window.addEventListener(event, () => {
                    const startTime = performance.now();
                    measureInteractionToNextPaint(startTime);
                }, { passive: true });
            });
        });

        // Navigate to the URL and wait until all network activity stops
        await page.goto('http://localhost:3000', {waitUntil: "networkidle0"});

        // Wait for the container with polls to be rendered
        await page.waitForSelector('.container');

        // Initialize performance log structure
        const performanceLogs = {
            startTime: new Date().toISOString(),
            iterations: []
        };

        const totalIterations = 50; // Set to 100 as needed

        for (let i = 0; i < totalIterations; i++) {
            console.log(`Voting iteration ${i + 1}`);

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
            const polls = await page.$$('.poll-card');
            console.log(`Found ${polls.length} polls in Iteration ${i + 1}`);

            for (const [pollIndex, poll] of polls.entries()) {
                const voteStart = Date.now();
                const voteStartISO = new Date(voteStart).toISOString();

                // Perform the vote
                await clickVoteButton(poll, pollIndex + 1);
                const voteEnd = Date.now();
                const voteDuration = voteEnd - voteStart;

                // Log the vote details
                iterationLog.pollsVoted.push({
                    voteStartTime: voteStartISO,
                    voteDurationMs: voteDuration
                });

                // Optionally, add a short delay between votes
                // await sleep(20);
            }

            // Capture metrics after the iteration
            const iterationEndTime = Date.now();
            const iterationEndISO = new Date(iterationEndTime).toISOString();
            const iterationDuration = iterationEndTime - iterationStartTime;
            const cpuLoadAfter = os.loadavg();
            const memoryUsageAfter = process.memoryUsage();

            // Retrieve web vitals after the iteration
            const vitals = await measureWebVitals(page);

            // Allow some time for PerformanceObservers to process any new entries
            await sleep(1000); // 1 second

            // Update iteration log with end metrics
            iterationLog.endTime = iterationEndISO;
            iterationLog.durationMs = iterationDuration;
            iterationLog.cpuLoadAfter = {
                '1min': cpuLoadAfter[0],
                '5min': cpuLoadAfter[1],
                '15min': cpuLoadAfter[2]
            };
            iterationLog.memoryUsageAfter = formatMemoryUsage(memoryUsageAfter);
            iterationLog.FCP = vitals.FCP;
            iterationLog.TTFB = vitals.TTFB;
            iterationLog.CLS = vitals.CLS;
            iterationLog.LCP = vitals.LCP;
            iterationLog.INP = vitals.INP;

            // Add the current iteration's log to the performanceLogs
            performanceLogs.iterations.push(iterationLog);

            console.log(`Iteration ${i + 1} completed in ${iterationDuration} ms`);
            console.log(`FCP: ${vitals.FCP.toFixed(2)} ms, TTFB: ${vitals.TTFB.toFixed(2)} ms, CLS: ${vitals.CLS.toFixed(4)}, LCP: ${vitals.LCP.toFixed(2)} ms, INP: ${vitals.INP.toFixed(2)} ms`);
        }

        // Capture overall end time
        performanceLogs.endTime = new Date().toISOString();

        // Convert performanceLogs to CSV format
        const csvContent = generateCSV(performanceLogs);
        
        // Write the performance logs to a CSV file
        const logFilePath = path.join(__dirname, 'performance-react.csv');
        fs.writeFileSync(logFilePath, csvContent, 'utf8');

        // Close the browser
        await browser.close();
    } catch(error){
        console.error(error);
    }finally{
        console.log('Browser closed.');
        console.log('Performance log has been written to performance-react.csv');
    }
}

async function measureWebVitals(page) {
    return page.evaluate(() => {
        // Retrieve TTFB from navigation entries
        const navigationEntries = performance.getEntriesByType('navigation');
        const ttfb = navigationEntries.length > 0 ? navigationEntries[0].responseStart : 0;

        // Calculate INP as the maximum interaction time recorded
        const inp = window.interactionToNextPaintTimes.length > 0 ? Math.max(...window.interactionToNextPaintTimes) : 0;

        return {
            FCP: window.firstContentfulPaint || 0,
            TTFB: ttfb,
            CLS: window.cumulativeLayoutShiftScore || 0,
            LCP: window.largestContentfulPaint || 0,
            INP: inp
        };
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatMemoryUsage(memoryUsage) {
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
        'Iteration', 'StartTime', 'EndTime', 'DurationMs',
        'CPU_LoadBefore_1min', 'CPU_LoadBefore_5min', 'CPU_LoadBefore_15min',
        'MemoryBefore_RSS_MB', 'MemoryBefore_HeapTotal_MB', 'MemoryBefore_HeapUsed_MB', 'MemoryBefore_External_MB',
        'CPU_LoadAfter_1min', 'CPU_LoadAfter_5min', 'CPU_LoadAfter_15min',
        'MemoryAfter_RSS_MB', 'MemoryAfter_HeapTotal_MB', 'MemoryAfter_HeapUsed_MB', 'MemoryAfter_External_MB',
        'FCP', 'TTFB', 'CLS', 'LCP', 'INP',
        'PollIndex', 'VoteStartTime', 'VoteDurationMs'
    ];

    let csvRows = [];
    csvRows.push(header.join(','));

    performanceLogs.iterations.forEach(iteration => {
        const {
            iteration: iterNum, startTime, endTime, durationMs,
            cpuLoadBefore, memoryUsageBefore, cpuLoadAfter, memoryUsageAfter,
            FCP, TTFB, CLS, LCP, INP, pollsVoted
        } = iteration;

        pollsVoted.forEach((vote, pollIndex) => {
            const row = [
                iterNum, `"${startTime}"`, `"${endTime}"`, durationMs,
                cpuLoadBefore['1min'], cpuLoadBefore['5min'], cpuLoadBefore['15min'],
                memoryUsageBefore.rss, memoryUsageBefore.heapTotal, memoryUsageBefore.heapUsed, memoryUsageBefore.external,
                cpuLoadAfter['1min'], cpuLoadAfter['5min'], cpuLoadAfter['15min'],
                memoryUsageAfter.rss, memoryUsageAfter.heapTotal, memoryUsageAfter.heapUsed, memoryUsageAfter.external,
                FCP.toFixed(2), TTFB.toFixed(2), CLS.toFixed(4), LCP.toFixed(2), INP.toFixed(2),
                pollIndex + 1, `"${vote.voteStartTime}"`, vote.voteDurationMs
            ];
            csvRows.push(row.join(','));
        });
    });

    return csvRows.join(os.EOL);
}

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

voteOnEveryPoll100Times();

