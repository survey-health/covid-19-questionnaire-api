import Koa from 'koa';
import {ValidationError} from 'yup';
import {bearerStrategy} from './Util/Authentication';
import bodyParser from 'koa-bodyparser';
import compositeRouter from './Route';
import compress from 'koa-compress';
import cors from '@koa/cors';
import dotenv from 'dotenv';
import {getStatusText} from 'http-status-codes';
dotenv.config();

(async () => {
    const app = new Koa();

    app.use(async (context, next) => {
        try {
            await next();

            if (context.status === 404 || context.status === 405) {
                context.throw(context.status);
            }
        } catch (error) {
            if (error instanceof ValidationError) {
                context.status = 422;
                context.body = {
                    status: 422,
                    message: getStatusText(422),
                    hint: 'validation-error',
                    errors: error.errors,
                };
                return;
            }

            if (error.expose && typeof error.status === 'number') {
                try {
                    context.status = error.status;
                    context.body = {
                        status: error.status,
                        message: getStatusText(error.status),
                        hint: error.message,
                    };
                    return;
                } catch (e) {
                }
            }

            context.status = 500;
            context.body = {
                status: 500,
                message: 'Internal Server Error',
            };
            console.error(error);
        }
    });

    app.use(bodyParser());
    app.use(cors());
    app.use(compress());

    app.use(async (context, next) => {
        if (
            typeof context.request.header.authorization === "string"
            && context.request.header.authorization.indexOf(" ") > 0
        ) {
            context.request.user = bearerStrategy(context.request.header.authorization);
        } else {
            context.request.user = null;
        }

        if ( context.request.user === null
            && context.request.URL.pathname.toLowerCase().indexOf('/v1/login/') !== 0 ) {
            context.status = 401;
            return;
        }
        return next();
    });

    const router = await compositeRouter();
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(process.env.PORT || 3000);
})();
