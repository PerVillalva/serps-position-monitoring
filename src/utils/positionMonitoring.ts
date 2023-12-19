import {
    fetchCurrentDatasetItems,
    fetchPreviousDatasetItems,
} from './fetchData.js';

const { ACTOR_RUN_ID } = process.env;

export async function monitorSerpPositionChange(): Promise<string[]> {
    const previousDataset = await fetchPreviousDatasetItems();
    const currentDataset = await fetchCurrentDatasetItems();
    const runConfiguration = currentDataset[0].configuration;

    const messages: string[] = [
        `📑 Report results for page *${runConfiguration.page}*, including *${runConfiguration.resultsPerPage}* results per page for the country *${runConfiguration.country}*\nView Actor Run: https://console.apify.com/view/runs/${ACTOR_RUN_ID}`,
    ];

    const keywordMap: Record<string, any[]> = {};

    for (const currObj of currentDataset) {
        const keyword: string = currObj.keyword;
        if (!keywordMap[keyword]) {
            keywordMap[keyword] = [];
        }
        keywordMap[keyword].push(currObj);
    }

    previousDataset.forEach(
        (previousData: {
            apifyPosition?: any;
            keyword?: any;
            country?: any;
        }) => {
            const matchingKeywordObjs = keywordMap[previousData.keyword];

            if (matchingKeywordObjs && matchingKeywordObjs.length > 0) {
                const { keyword } = previousData;
                const prevApifySerpData = previousData.apifyPosition;
                const currApifySerpData = matchingKeywordObjs[0].apifyPosition;
                const totalApifyResults = matchingKeywordObjs[0].apifyResults;
                const currPaidAdsData = matchingKeywordObjs[0].paidResults;

                let previousApifySerpPosition: number | string;
                let currentApifySerpPosition: number | string;

                if (typeof prevApifySerpData === 'string') {
                    previousApifySerpPosition = prevApifySerpData;
                } else {
                    previousApifySerpPosition = prevApifySerpData?.position;
                }

                if (typeof currApifySerpData === 'string') {
                    currentApifySerpPosition = currApifySerpData;
                } else {
                    currentApifySerpPosition = currApifySerpData?.position;
                }

                if (
                    (typeof previousApifySerpPosition !== 'number' &&
                        typeof currentApifySerpPosition !== 'number') ||
                    (isNaN(Number(previousApifySerpPosition)) &&
                        isNaN(Number(currentApifySerpPosition)))
                ) {
                    messages.push(
                        `Apify is not ranking for the keyword *${keyword}*`
                    );
                } else {
                    let positionChangeText: string;

                    if (typeof previousApifySerpPosition !== 'number') {
                        positionChangeText = `started ranking at position *${currentApifySerpPosition}*`;
                    } else if (typeof currentApifySerpPosition !== 'number') {
                        positionChangeText = `stopped ranking at position *${previousApifySerpPosition}*`;
                    } else {
                        const positionChange: number =
                            Number(previousApifySerpPosition) -
                            Number(currentApifySerpPosition);
                        positionChangeText =
                            positionChange > 0
                                ? `gained ${positionChange} position(s)`
                                : positionChange < 0
                                ? `lost ${-positionChange} position(s)`
                                : `maintained its number *${previousApifySerpPosition}* position`;
                    }

                    messages.push(
                        `Keyword: *${keyword}*\nPaid Results: *${currPaidAdsData.length}*\nApify Position Change: ${positionChangeText}\nApify Previous Position: *${previousApifySerpPosition}*\nApify Current Position: *${currentApifySerpPosition}*\nTotal Apify Results: *${totalApifyResults.length}*`
                    );
                }
            }
        }
    );

    return messages;
}
