// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor, log } from 'apify';
import { filteredSerpActorOutput } from './utils/serpData.js';
import { monitorSerpPositionChange } from './utils/positionMonitoring.js';
import { postSlackMessage } from './slack/sendMessage.js';
import { checkTaskRunNumber } from './utils/fetchData.js';

// Initialize the actor
await Actor.init();

// Define the ActorInput interface
interface ActorInput {
    keywords: string;
    countryCode: string;
    maxPagesPerQuery: number;
    maxResultsPerPage: number;
    slackChannel: string;
    slackBotToken: string;
    slackSignInSecret: string;
}

// Get the input data and specify its type
const input = (await Actor.getInput()) as ActorInput;

if (!input) {
    throw new Error('Missing input data.');
}

const {
    keywords,
    countryCode,
    maxPagesPerQuery,
    maxResultsPerPage,
    slackChannel,
    slackBotToken,
    slackSignInSecret,
} = input;

// Call the filteredSerpActorOutput function
await filteredSerpActorOutput(
    keywords,
    countryCode,
    maxPagesPerQuery,
    maxResultsPerPage
);

// Call the monitorSerpPositionChange function if this is Actor's second run or +
const numberOfRuns = await checkTaskRunNumber();
console.log(numberOfRuns);
if (numberOfRuns >= 1) {
    const messages = await monitorSerpPositionChange();

    await postSlackMessage(
        messages,
        slackSignInSecret,
        slackBotToken,
        slackChannel
    );
} else {
    log.info(
        'If this is your first time running this Actor Task, please run it again'
    );
}

// Exit the actor
await Actor.exit();
