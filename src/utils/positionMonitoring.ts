import {
    fetchCurrentDatasetItems,
    fetchPreviousDatasetItems,
} from './fetchData.js';

export async function monitorSerpPositionChange() {
    const previousDataset = await fetchPreviousDatasetItems();
    const currentDataset = await fetchCurrentDatasetItems();
    const runConfiguration = currentDataset[0].configuration;

    const headerMessage: string = `⚙️ *Actor configuration*\n*Page:* \`${runConfiguration.page}\`\n*Results/page:* \`${runConfiguration.resultsPerPage}\`\n*Country:* \`${runConfiguration.country}\``;
    const keywordMessages: string[] = [];

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
                    keywordMessages.push(
                        `😔 Apify is not ranking for the keyword \`${keyword}\``
                    );
                } else {
                    let positionChangeText: string;

                    if (typeof previousApifySerpPosition !== 'number') {
                        positionChangeText = `🚀 Started ranking at position \`${currentApifySerpPosition}\``;
                    } else if (typeof currentApifySerpPosition !== 'number') {
                        positionChangeText = `🛑 Stopped ranking at position \`${previousApifySerpPosition}\``;
                    } else {
                        const positionChange: number =
                            Number(previousApifySerpPosition) -
                            Number(currentApifySerpPosition);
                        positionChangeText =
                            positionChange > 0
                                ? `:green_arrow_up:\`${positionChange}\``
                                : positionChange < 0
                                ? `:red_arrow_down:\`${-positionChange}\``
                                : `🛡️ Maintained its number \`${previousApifySerpPosition}\` position`;
                    }

                    keywordMessages.push(
                        `*Keyword:* \`${keyword}\`\n*Paid Results:* \`${currPaidAdsData.length}\`\n*Apify Position Change:* ${positionChangeText}\n*Apify Previous Position:* \`${previousApifySerpPosition}\`\n*Apify Current Position:* \`${currentApifySerpPosition}\`\n*Total Apify Results:* \`${totalApifyResults.length}\``
                    );
                }
            }
        }
    );

    return { headerMessage, keywordMessages };
}
