import Router from '@koa/router';
import {client} from '../../Util/FileMaker';
import {getCachedQuestions} from "../../Util/Question";
import {FacultyFieldData} from './Faculty';
import {StudentFieldData} from './Student';

const router = new Router({prefix: '/user'});

export  type GuardianFieldData = {
    Web_DisplayName_c : string;
    Web_ID_c : string;
    Web_Username_c : string;
};

router.get('/', async context => {
    const employeeID = context.request.user?.employeeID;
    const type = context.request.user?.type;

    if (typeof employeeID !== "string") {
        return context.status = 401;
    }

    try {
        if (type === 'student') {
            const studentResult = await client.layout<StudentFieldData>('Student').find({Web_ID_c: `==${employeeID}`}, {}, true);

            if (studentResult.data.length) {
                context.body = studentResult.data.map(({fieldData}) => ({
                    id: fieldData.Web_ID_c,
                    name: fieldData.Web_DisplayName_c,
                    type: 'student',
                    schoolName: fieldData.Web_DisplaySchool_c,
                    schoolId: fieldData.Web_SchoolID_c,
                }));
                return;
            }
        }

        if (type === 'guardian') {
            const guardianResult = await client.layout<GuardianFieldData>('Guardian').find({Web_ID_c: `==${employeeID}`}, {}, true);

            if (guardianResult.data.length) {
                context.body = guardianResult.data.map(({fieldData}) => ({
                    id: fieldData.Web_ID_c,
                    name: fieldData.Web_DisplayName_c,
                    type: 'guardian',
                    schoolName: 'schoolName',
                    schoolId: 'schoolId',
                }));
                return;
            }
        }

        if (type === 'guardian') {
            const facultyResult = await client.layout<FacultyFieldData>('Faculty').find({Web_ID_c: `==${employeeID}`}, {}, true);

            if (facultyResult.data.length) {
                context.body = facultyResult.data.map(({fieldData}) => ({
                    id: fieldData.Web_ID_c,
                    name: fieldData.Web_DisplayName_c,
                    type: 'faculty',
                    schoolName: fieldData.Web_DisplaySchool_c,
                    schoolId: fieldData.Web_SchoolID_c,
                }));
            }
        }
    } catch (e) {
        if (e.code === '802' || e.type == 'invalid-json') {
            context.body = {
                status: 802,
                message: "Unable to reach the database. Please try again later"
            }
            context.status = 503
        } else {
            throw e;
        }
    }
});

router.get('/get-students', async context => {
    const employeeID = context.request.user?.employeeID;

    try {
        const layout = client.layout('GuardianStudentJoin');

        const studentResult = await layout.find({
            Web_GuardianID_c: `==${employeeID}`,
        }, {
            'script': 'goToRelatedStudentsFromJoin',
            'layout.response': 'Student'
        }, true);

        if (studentResult.data.length) {
            context.body = studentResult.data.map(({fieldData}) => {
                return {
                    id: fieldData.Web_ID_c,
                    name: fieldData.Web_DisplayName_c,
                    type: 'student',
                    schoolName: fieldData.Web_DisplaySchool_c,
                    schoolId: fieldData.Web_SchoolID_c,
                    status: fieldData.Web_CurDateStatus_c ?? '' ,
                }
            });
        }

        return [];
    } catch (e) {
        if (e.code === '802' || e.type == 'invalid-json') {
            context.body = {
                status: 802,
                message: "Unable to reach the database. Please try again later"
            }
            context.status = 503
        } else {
            throw e;
        }
    }
});

router.get('/questions', async context => {
    try {
        context.body = await getCachedQuestions(context.state.language);
    } catch (e) {
        if (e.code === '802' || e.type == 'invalid-json') {
            context.body = {
                status : 401,
                message : "Unable to reach the database. Please try again later"
            }
            context.status = 503
        } else {
            throw e;
        }
    }
});

export default router;
