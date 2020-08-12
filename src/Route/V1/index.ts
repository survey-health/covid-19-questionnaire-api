import Router from '@koa/router';
import {compositeRouter} from '../../Util/Koa';

export default async () : Promise<Router> => {
    const router = await compositeRouter(__dirname, {prefix: '/v1'})();

    return router;
};
