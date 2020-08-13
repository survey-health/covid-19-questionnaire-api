import dotenv from 'dotenv';
import {Client, utils} from 'fm-data-api-client';

dotenv.config();

export const client = new Client(
    process.env.FM_SERVER !== undefined ? process.env.FM_SERVER : '',
    process.env.FM_DATABASE !== undefined ? process.env.FM_DATABASE : '',
    process.env.FM_USERNAME !== undefined ? process.env.FM_USERNAME : '',
    process.env.FM_PASSWORD !== undefined ? process.env.FM_PASSWORD : ''
);

export const escapeFindString = (input : string) : string => {
    return input.replace(/[.@*#?!=<>≥≤|[\]\\]/g, '\\$&');
}

export const dateUtil = new utils.DateUtil();

