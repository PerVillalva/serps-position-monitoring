// eslint-disable-next-line import/no-extraneous-dependencies
import Slack from '@slack/bolt';
import { log } from 'apify';

export async function postSlackMessage(
    messages: string[],
    slackSignInSecret: string,
    slackBotToken: string,
    slackChannel: string
) {
    const sectionSeparator = '============================================\n';

    // Send Slack Message
    const app = new Slack.App({
        signingSecret: slackSignInSecret,
        token: slackBotToken,
    });

    let fMessage = ``;

    // Iterate over messages and add a section block for each message
    messages.forEach((message: string) => {
        fMessage += `${message}\n${sectionSeparator}`;
    });

    await app.client.chat.postMessage({
        token: slackBotToken,
        channel: slackChannel,
        text: fMessage,
    });

    log.info('📤 SERPs position report sent to Slack.');
}
