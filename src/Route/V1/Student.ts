import Router from '@koa/router';
import * as yup from 'yup';
import {client, escapeFindString} from '../../Util/FileMaker';

const router = new Router({prefix: '/student'});

export type StudentFieldData = {
    Web_DisplayName_c : string;
    Web_ID_c : string;
    Web_DOB_c : string;
    Web_DisplaySchool_c : string;
    Web_SchoolID_c : string;
    Web_CurDateStatus_c : string;
    Web_GuardianIDList_c : string;
};

const getParamsSchema = yup.object({
    studentId: yup.string(),
});

router.get('/getCurrentQuestionnaire/:studentId', async context => {
    const employeeID = context.request.user?.employeeID;
    const params = await getParamsSchema.validate(context.params);

    if (typeof employeeID !== "string") {
        return context.status = 401;
    }

    const layout = client.layout('Student');

    const result = await layout.find({
        Web_ID_c: `==${escapeFindString(process.env.USER_MODE === 'STUDENT' ? employeeID : params.studentId)}`,
    }, {
        'script.prerequest': 'getCurrentQuestionnaire',
        'script.prerequest.param': JSON.stringify({
            studentID:  escapeFindString(process.env.USER_MODE === 'STUDENT' ? employeeID : params.studentId)
        }),
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

const putParamsSchema = yup.object({
    studentId: yup.string(),
});

router.put('/updateCurrentQuestionnaire/:studentId', async context => {
    const employeeID = context.request.user?.employeeID;
    const params = await putParamsSchema.validate(context.params);

    if (typeof employeeID !== "string") {
        return context.status = 401;
    }

    const layout = client.layout('Student');
    const input = await patchSchema.validate(context.request.body);

    const scriptParam = {
        "studentID": escapeFindString(process.env.USER_MODE === 'STUDENT' ? employeeID : params.studentId),
        answers: input.answers.map((answer) => {
            return {
                ID_Question : answer.questionId,
                Answer_yn : answer.yes ? 'Yes' : 'No',
                Answer_Number : answer.number,
            }
        })
    }

    const result = await layout.find({
        Web_ID_c : `==${escapeFindString(process.env.USER_MODE === 'STUDENT' ? employeeID : params.studentId)}`,
    }, {
        script : 'putQuestionnaireAnswers',
        'script.param': JSON.stringify(scriptParam)
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