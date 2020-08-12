import Router from '@koa/router';
import compositeV1Router from './V1';

export default async () : Promise<Router> => {
    const router = new Router();

    const v1Router = await compositeV1Router();
    router.use(v1Router.routes());
    router.use(v1Router.allowedMethods());

    return router;
};
