import dotenv from 'dotenv';
import {Client, utils} from 'fm-data-api-client';

dotenv.config();

export const client = new Client(
    process.env.FM_SERVER!,
    process.env.FM_DATABASE!,
    process.env.FM_USERNAME!,
    process.env.FM_PASSWORD!
);

export const dateUtil = new utils.DateUtil();
