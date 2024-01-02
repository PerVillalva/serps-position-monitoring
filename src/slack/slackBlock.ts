const { ACTOR_RUN_ID } = process.env;

const reportURL = `https://console.apify.com/view/runs/${ACTOR_RUN_ID}`;

export function generateHeaderBlock(headerMessage: string) {
    const headerBlock = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: '🔍 SERPs Keyword Monitoring\n',
                emoji: true,
            },
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `${headerMessage}`,
            },
            accessory: {
                type: 'image',
                image_url:
                    'https://cdn-icons-png.flaticon.com/512/2783/2783630.png?ga=GA1.1.388033810.1695616173&',
                alt_text: 'keyword_icon',
            },
        },
        {
            type: 'actions',
            elements: [
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: 'See full report',
                        emoji: true,
                    },
                    style: 'primary',
                    value: `See full report`,
                    url: `${reportURL}`,
                    action_id: 'button-action',
                },
            ],
        },
    ];

    return headerBlock;
}

export function generateKeywordBlock(message: string) {
    const keywordBlock = [
        {
            type: 'divider',
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `${message}`,
            },
        },
    ];

    return keywordBlock;
}
