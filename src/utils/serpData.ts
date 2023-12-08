import { Actor, log, Dataset } from 'apify';
import axios from 'axios';

const { APIFY_TOKEN } = process.env;

async function fetchDataFromApify(datasetId: string) {
    const url = `https://api.apify.com/v2/datasets/${datasetId}/items/?token=${APIFY_TOKEN}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error: any) {
        log.error('Failed to fetch data from Apify:', error);
        throw error;
    }
}

function filterUrlByTerm(arr: { url?: string }[], filterTerm: string) {
    return arr.filter((result) => {
        return result?.url?.includes(filterTerm);
    });
}

async function fetchGoogleSerpData(
    keywords: string,
    countryCode: string,
    maxPages: number,
    maxResults: number
) {
    log.info('🔍 Gathering Google SERP Data...');
    try {
        const googleSerpActorData = await Actor.call(
            'apify/google-search-scraper',
            {
                queries: keywords,
                countryCode: countryCode,
                maxPagesPerQuery: maxPages,
                resultsPerPage: maxResults,
            }
        );

        log.info('✅ Google SERP data actor call completed.');

        return googleSerpActorData;
    } catch (error: any) {
        log.error('❌ Failed to fetch Google SERP data:', error);
        throw error;
    }
}

export async function filteredSerpActorOutput(
    keywords: string,
    countryCode: string,
    maxPages: number,
    maxResults: number
) {
    const googleSerpActorOutput = await fetchGoogleSerpData(
        keywords,
        countryCode,
        maxPages,
        maxResults
    );
    const googleSerpTaskId = googleSerpActorOutput.defaultDatasetId;
    log.info(`Fetching data for task ID: ${googleSerpTaskId}`);
    const serpData = await fetchDataFromApify(googleSerpTaskId);

    for (const query of serpData) {
        const organicResultsArray = query.organicResults;
        const searchQueryObj = query.searchQuery;
        const apifyPositionData = filterUrlByTerm(organicResultsArray, 'apify');

        // Assuming you have already opened the dataset somewhere in your code
        await Dataset.pushData({
            configuration: {
                country: searchQueryObj.countryCode,
                page: searchQueryObj.page,
                resultsPerPage: searchQueryObj.resultsPerPage,
            },
            keyword: searchQueryObj.term,
            paidResults: query.paidResults,
            firstPosition: organicResultsArray[0],
            secondPosition: organicResultsArray[1],
            thirdPosition: organicResultsArray[2],
            apifyPosition:
                apifyPositionData.length > 0
                    ? apifyPositionData[0]
                    : 'Not listed',
        });
    }
}
