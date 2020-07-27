import * as yup from 'yup';

import { InvalidCredentialsError } from "ldapjs";
import Router from '@koa/router';
import { login, dobLogin } from "../../Util/Authentication";

const router = new Router({ prefix: '/login' });

const loginSchema = yup.object({
    username: yup.string().ensure().trim(),
    password: yup.string().ensure(),
});

const dobLoginSchema = yup.object({
    id: yup.string().ensure().trim(),
    dob: yup.date(),
});

router.post('/authenticate', async context => {
    try {
        if (process.env.AUTH_MODE === 'DOB') {
            const input = await dobLoginSchema.validate(context.request.body);
            context.body = await dobLogin(input.id, input.dob);
        } else {
            const input = await loginSchema.validate(context.request.body);
            context.body = await login(input.username, input.password);
        }
        
        return context.status = 200;
    } catch (e) {
        if (e.code === '802' || e.type == 'invalid-json') {
            context.body = {
                status: 802,
                message: "Unable to reach the database. Please try again later"
            }
            return context.status = 503
        }

        if (e instanceof InvalidCredentialsError) {
            return context.status = 401;
        }

        return context.status = 501;
    }
});

export default router;