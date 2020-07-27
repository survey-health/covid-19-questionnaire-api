import { FacultyFieldData } from './Faculty';
import Router from '@koa/router';
import { StudentFieldData } from './Student';
import { client } from '../../Util/FileMaker';

const router = new Router({ prefix: '/user' });

router.get('/', async context => {
    const employeeID = context.request.user?.employeeID;    

    try {
        const studentResult = await client.layout<StudentFieldData>('Student').find({Web_ID_c: `==${employeeID}`}, {}, true);

        if (studentResult.data.length) {
            context.body = studentResult.data.map(({fieldData}) => ({
                id: fieldData.Web_ID_c,
                name: fieldData.Web_DisplayName_c,
                type: 'student',
                schoolName: fieldData.Web_DisplaySchool_c,
                schoolId: fieldData.Web_SchoolID_c,
            }));
        } else {
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

export default router;
