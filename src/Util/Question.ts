import {Numerish} from "fm-data-api-client/lib/Layout";
import LRUCache from "lru-cache";
import {client} from "./FileMaker";

const cacheOptions = {
    max: 10,
    maxAge: 60*15*1000 // cache length in ms
};

const question : LRUCache<string, Question[]> = new LRUCache<string, Question[]>(cacheOptions);

export type Question = {
    id : Numerish;
    number : Numerish;
    text : Numerish;
    subText : Numerish;
    type : Numerish;
    maxAcceptable ?: Numerish;
    maxValid ?: Numerish;
    minAcceptable ?: Numerish;
    minValid ?: Numerish;
};

export const getCachedQuestions = async () : Promise<Question[]> => {
    let questions = question.get('questions');

    if (questions) {
        return questions;
    }

    const layout = client.layout('Question');
    const result = await layout.find({
        ID: `*`,
    }, {
        'script': 'getCurrentQuestions',
    }, true);

    if (result.data.length) {
        questions = result.data.map(({fieldData}) => {
            const question = {
                id : fieldData.ID,
                number : fieldData.Number,
                text : fieldData.Text.toString()
                    .replace(/\r\n/gi, '\n')
                    .replace(/\r/gi, '\n'),
                subText : fieldData.SubText.toString()
                    .replace(/\r\n/gi, '\n')
                    .replace(/\r/gi, '\n'),
                type : fieldData.Type,
            } as Question;

            if (fieldData.Type === 'Number') {
                question.maxAcceptable = fieldData.Number_MaxAcceptable;
                question.maxValid = fieldData.Number_MaxValid;
                question.minAcceptable = fieldData.Number_MinAcceptable;
                question.minValid = fieldData.Number_MinValid;
            }

            return question;
        });

        question.set('questions', questions);
        questions = question.get('questions');

        return questions ? questions : [];
    }

    return [];
}