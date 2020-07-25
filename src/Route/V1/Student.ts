import * as yup from 'yup';

import { Numerish } from 'fm-data-api-client/lib/Layout'
import Router from '@koa/router';
import { client } from '../../Util/FileMaker';

const router = new Router({ prefix: '/student' });

export  type StudentFieldData = {
    Web_DisplayName_c: string;
    Web_ID_c: string;
    Web_DOB_c: string;
    Web_DisplaySchool_c: string;
    Web_SchoolID_c: string;
};

type QuestionnaireFieldData = {
    Q01_Fever: Numerish;
    Q02_Sore: Numerish;
    Q03_Nausea: Numerish;
    Q04_Shortness: Numerish;
    Q05_CloseContact: Numerish;
    Q06_Temperature: Numerish;
};

router.get('/getCurrentQuestionnaire', async context => {
    const employeeID = context.request.user?.employeeID;
    const layout = client.layout('Student');

    const result = await layout.find({
        Web_ID_c: `==${employeeID}`,
    }, {
        'script.prerequest': 'getCurrentQuestionnaire',
        'script.prerequest.param': "{\"studentID\" : \"" + employeeID + "\"}",
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
    Q01: yup.string().required(),
    Q02: yup.string().required(),
    Q03: yup.string().required(),
    Q04: yup.string().required(),
    Q05: yup.string().required(),
    Q06: yup.number().required(),
});

router.patch('/updateCurrentQuestionnaire', async context => {
    const employeeID = context.request.user?.employeeID;
    const layout = client.layout('Student');

    const result = await layout.find({
        Web_ID_c: `==${employeeID}`,
    }, {
        'script.prerequest': 'getCurrentQuestionnaire',
        'script.prerequest.param': "{\"studentID\" : \"" + employeeID + "\"}",
    }, true);

    if (result.data.length === 0) {
        return context.status = 204;
    }

    if (undefined === result['scriptResult.prerequest']) {
        return context.status = 400; // what should this return
    }

    const json = JSON.parse(result['scriptResult.prerequest']);

    const input = await patchSchema.validate(context.request.body);
    const questionnaireLayout = client.layout<QuestionnaireFieldData>('Questionnaire');
    
    await questionnaireLayout.update(json.recid, {
        "Q01_Fever": input.Q01,
        "Q02_Sore": input.Q02,
        "Q03_Nausea": input.Q03,
        "Q04_Shortness": input.Q04,
        "Q05_CloseContact": input.Q05,
        "Q06_Temperature": input.Q06
    });

    context.status = 204;
});

export default router;
