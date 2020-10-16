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

export const getCachedQuestions = async (language : string) : Promise<Question[]> => {
    const cacheKey = `questions-${language}`;
    let questions = question.get(cacheKey);

    if (questions) {
        return questions;
    }

    const layout = client.layout('Question');
    const result = await layout.find({
        ID: `*`,
    }, {
        'script': 'getCurrentQuestions',
        'script.param': JSON.stringify({language}),
    }, true);

    if (result.data.length) {
        questions = result.data.map(({fieldData}) => {
            const text = fieldData.Web_Text_c ?? fieldData.Text;
            const subText = fieldData.Web_SubText_c ?? fieldData.SubText;
            const question = {
                id : fieldData.ID,
                number : fieldData.Number,
                text : text.toString()
                    .replace(/\r\n/gi, '\n')
                    .replace(/\r/gi, '\n'),
                subText : subText.toString()
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

        question.set(cacheKey, questions);
        questions = question.get(cacheKey);

        return questions ? questions : [];
    }

    return [];
}
