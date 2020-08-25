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

    if (typeof employeeID !== "string") {
        return context.status = 401;
    }

    try {
        let userFound = false;

        if (process.env.USER_MODE === 'STUDENT') {
            const studentResult = await client.layout<StudentFieldData>('Student').find({Web_ID_c: `==${employeeID}`}, {}, true);
            
            if (studentResult.data.length) {
                context.body = studentResult.data.map(({fieldData}) => ({
                    id: fieldData.Web_ID_c,
                    name: fieldData.Web_DisplayName_c,
                    type: 'student',
                    schoolName: fieldData.Web_DisplaySchool_c,
                    schoolId: fieldData.Web_SchoolID_c,
                }));
    
                userFound = true;
            }
        }

        if (!userFound && process.env.USER_MODE === 'PARENT') {
            const guardianResult = await client.layout<GuardianFieldData>('Guardian').find({Web_ID_c: `==${employeeID}`}, {}, true);

            if (guardianResult.data.length) {
                context.body = guardianResult.data.map(({fieldData}) => ({
                    id: fieldData.Web_ID_c,
                    name: fieldData.Web_DisplayName_c,
                    type: 'guardian',
                    schoolName: 'schoolName',
                    schoolId: 'schoolId',
                }));
    
                userFound = true;
            }
        }

        if (!userFound) {
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

router.get('/getStudents', async context => {
    const employeeID = context.request.user?.employeeID;    
    
    try {
        const studentResult = await client.layout<StudentFieldData>('Student').find({Web_GuardianIDList_c: `|${employeeID}|`}, {}, true);

        context.body = studentResult.data.map(({fieldData}) => ({
            id: fieldData.Web_ID_c,
            name: fieldData.Web_DisplayName_c,
            type: 'student',
            schoolName: fieldData.Web_DisplaySchool_c,
            schoolId: fieldData.Web_SchoolID_c,
            status: fieldData.Web_CurDateStatus_c ?? '' ,
        }));

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
        context.body = await getCachedQuestions();
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
