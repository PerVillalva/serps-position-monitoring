import axios from 'axios';
import { Dataset, log } from 'apify';

const { APIFY_TOKEN, ACTOR_TASK_ID } = process.env;

export async function fetchPreviousDatasetItems() {
    try {
        const actorLastRun = await axios.get(
            `https://api.apify.com/v2/actor-tasks/${ACTOR_TASK_ID}/runs/last?token=${APIFY_TOKEN}&status=SUCCEEDED`
        );

        const lastRunID = actorLastRun.data.data.defaultDatasetId;

        const previousDataset = await axios.get(
            `https://api.apify.com/v2/datasets/${lastRunID}/items/?token=${APIFY_TOKEN}`
        );

        return previousDataset.data;
    } catch (error: any) {
        log.error('Error fetching previous dataset items:', error);
        throw error; // or return a default value or handle the error appropriately
    }
}

export async function fetchCurrentDatasetItems() {
    try {
        const newDataset = await Dataset.open();
        const newDatasetItems = await newDataset.getData();
        return newDatasetItems.items;
    } catch (error: any) {
        log.error('Error fetching current dataset items:', error.message);
        throw error;
    }
}

export async function checkTaskRunNumber() {
    const task = await axios.get(
        `https://api.apify.com/v2/actor-tasks/${ACTOR_TASK_ID}/runs?token=${APIFY_TOKEN}&status=SUCCEEDED`
    );
    const taskData = task.data.data;
    const taskRuns = taskData.total;
    return taskRuns;
}
