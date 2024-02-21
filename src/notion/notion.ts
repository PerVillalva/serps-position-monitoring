// @ts-ignore
import { Client, DatabasesQueryResponse, PagesCreateParameters } from '@notionhq/client';
import { log } from 'apify';

// Types
interface ApifyPosition {
    position?: number;
    url?: string;
}

interface TaskInfo {
    finishedAt: string;
}

// Notion Client
export function notionClient(token: string) {
    const notionClient = new Client({ auth: token });
    return notionClient;
}

// Local Util Functions
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatDate = (date: Date) => date.toISOString().split('T')[0];


// Notion API Functions
let keywordMap: Map<string, string> | null = null;

export const fetchAllKeywords = async (notionClient: Client, keywordDatabaseId: string) => {
    log.info('Fetching keywords from Notion database...');

    if (keywordMap) return keywordMap;

    keywordMap = new Map();
    let startCursor: undefined | string;

    do {
        const response = await notionClient.databases.query({
            database_id: keywordDatabaseId,
            start_cursor: startCursor,
            page_size: 100,
        });

        response.results.forEach((item: DatabasesQueryResponse) => {
            if ('properties' in item) {
                const keyword = item.properties.Keyword.title[0]?.plain_text;
                if (keyword) {
                    keywordMap?.set(keyword, item.id);
                }
            }
        });

        startCursor = response.next_cursor ?? undefined;
        await delay(1000);
    } while (startCursor);

    log.info('Finished fetching all keywords.');
    return keywordMap;
};

export const createItemInDatabase = async (
    notionClient: Client,
    serpDatabaseID: string,
    keywordDatabaseId: string,
    {
        apifyPosition,
        keyword,
    }: { apifyPosition: ApifyPosition; keyword: string },
) => {
    const formattedDate = formatDate(new Date());
    const position = apifyPosition?.position?.toString() || 'Not listed';
    const url = apifyPosition?.url || 'n/a';

    const keywordMap = await fetchAllKeywords(
        notionClient,
        keywordDatabaseId,
    );
    const keywordId = keywordMap.get(keyword);

    if (!keywordId) return null;

    const page: PagesCreateParameters = {
        parent: { database_id: serpDatabaseID },
        properties: {
            Keywords: { relation: [{ id: keywordId }] },
            Date: { date: { start: formattedDate } },
            Position: { rich_text: [{ text: { content: position } }] },
            URL: { url: url },
        },
    };

    try {
        return await notionClient.pages.create(page);
    } catch (error) {
        console.error('Failed to create page:', error);
        // You can handle the error here or rethrow it to be handled elsewhere
    }

    return null;
};
