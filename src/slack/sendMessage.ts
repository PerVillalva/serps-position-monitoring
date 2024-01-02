// eslint-disable-next-line import/no-extraneous-dependencies
import Slack from '@slack/bolt';
import { log } from 'apify';
import { generateHeaderBlock, generateKeywordBlock } from './slackBlock.js';
import { Block, KnownBlock } from '@slack/types';

export async function postSlackMessage(
    headerMessage: string,
    keywordMessages: string[],
    slackSignInSecret: string,
    slackBotToken: string,
    slackChannel: string
) {
    const keywordMessagesArr = [];

    const headerMessageBlock = generateHeaderBlock(headerMessage);

    keywordMessagesArr.push(...headerMessageBlock);

    // Iterate over messages and add a section block for each message
    keywordMessages.forEach((message: string) => {
        const keywordBlock = generateKeywordBlock(message);
        keywordMessagesArr.push(...keywordBlock);
    });

    // Send Slack Message
    const app = new Slack.App({
        signingSecret: slackSignInSecret,
        token: slackBotToken,
    });

    // Split keywordMessagesArr into chunks of 50 or less
    const chunkSize = 50;
    for (let i = 0; i < keywordMessagesArr.length; i += chunkSize) {
        const chunk = keywordMessagesArr.slice(i, i + chunkSize);
        await app.client.chat.postMessage({
            token: slackBotToken,
            channel: slackChannel,
            text: 'SERPs keyword monitoring report',
            blocks: chunk as (Block | KnownBlock)[],
        });
    }

    log.info('📤 SERPs position report sent to Slack.');
}
