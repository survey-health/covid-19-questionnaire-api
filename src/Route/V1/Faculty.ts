import Router from '@koa/router';
import * as yup from 'yup';
import {client} from '../../Util/FileMaker';

const router = new Router({prefix: '/faculty'});

export type FacultyFieldData = {
    Web_DisplayName_c : string;
    Web_ID_c : string;
    Web_DOB_c : string;
    Web_DisplaySchool_c : string;
    Web_SchoolID_c : string;
};

router.get('/getCurrentQuestionnaire', async context => {
    const employeeID = context.request.user?.employeeID;

    const layout = client.layout('Faculty');

    const result = await layout.find({
        Web_ID_c: `==${employeeID}`,
    }, {
        'script.prerequest': 'getCurrentQuestionnaire',
        'script.prerequest.param': "{\"facultyID\" : \"" + employeeID + "\"}",
    }, true);

    if (result.data.length === 0) {
        return context.status = 204;
    }

    if (undefined === result['scriptResult.prerequest']) {
        return context.status = 400; // what should this return
    }

    const json = JSON.parse(result['scriptResult.prerequest']);

    context.status = 201;
    context.body = json;
});

const patchSchema = yup.object({
    answers : yup.array().of(yup.object({
        questionId : yup.string().required(),
        yes : yup.boolean().required(),
        number : yup.number()
    }))
});

router.put('/updateCurrentQuestionnaire', async context => {
    const employeeID = context.request.user?.employeeID;
    const layout = client.layout('Faculty');

    const input = await patchSchema.validate(context.request.body);

    const scriptParam = {
        "facultyID" : employeeID,
        answers : input.answers.map((answer) => {
            return {
                ID_Question : answer.questionId,
                Answer_yn : answer.yes ? 'Yes' : 'No',
                Answer_Number : answer.number,
            }
        })
    }

    const result = await layout.find({
        Web_ID_c : `==${employeeID}`,
    }, {
        script : 'putQuestionnaireAnswers',
        'script.param' : JSON.stringify(scriptParam)
    }, true);

    if (result.data.length === 0) {
        return context.status = 503;
    }

    if (undefined === result['scriptResult']) {
        return context.status = 503;
    }

    JSON.parse(result['scriptResult']);

    context.status = 204;
});

export default router;
