import { Actor, log } from 'apify';
import { filteredSerpActorOutput } from './utils/serpData.js';
import { monitorSerpPositionChange } from './utils/positionMonitoring.js';
import { postSlackMessage } from './slack/sendMessage.js';
import { getTaskData } from './utils/fetchData.js';
import {
    notionClient,
    createItemInDatabase,
    fetchAllKeywords,
} from './notion/notion.js';
import { fetchCurrentDatasetItems } from './utils/fetchData.js';

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
    notionToken: string;
    keywordDatabaseID: string;
    serpDatabaseID: string;
    useDatabaseData: boolean;
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
    notionToken,
    keywordDatabaseID,
    serpDatabaseID,
    useDatabaseData,
} = input;

// Start notionClient
const notion = notionClient(notionToken);

// If `useDatabaseData` is true, fetches keywords from the Notion database and uses them as the SERP Actor input. Else, call the Actor with the value provided in the "keywords" input field.
if (useDatabaseData) {
    const databaseKeywords = await fetchAllKeywords(notion, keywordDatabaseID);

    console.log(databaseKeywords.values());

    const keywordsArray = Array.from(databaseKeywords.keys());

    const keywordsStringInput = keywordsArray.join('\n');

    await filteredSerpActorOutput(
        keywordsStringInput,
        countryCode,
        maxPagesPerQuery,
        maxResultsPerPage
    );
} else {
    await filteredSerpActorOutput(
        keywords,
        countryCode,
        maxPagesPerQuery,
        maxResultsPerPage
    );
}

// Call the monitorSerpPositionChange function if this is Actor's second run or +
if (slackSignInSecret) {
    const [taskRuns] = await getTaskData();
    if (taskRuns >= 1) {
        const { headerMessage, keywordMessages } =
            await monitorSerpPositionChange();

        await postSlackMessage(
            headerMessage,
            keywordMessages,
            slackSignInSecret,
            slackBotToken,
            slackChannel
        );
    } else {
        log.info(
            'If this is your first time running this Actor Task, please run it again. The Keyword report will be sent to Slack following the completion of the run.'
        );
    }
}

// If notionToken is provided, create new items in the SERP Notion Database.
if (notionToken) {
    const datasetItems = await fetchCurrentDatasetItems();
    const keywordMap = await fetchAllKeywords(notion, keywordDatabaseID);

    for (let result of datasetItems) {
        const { apifyPosition, keyword } = result;
        await createItemInDatabase(notion, serpDatabaseID, keywordMap, {
            apifyPosition,
            keyword,
        });
    }
}

// Exit the actor
await Actor.exit();
