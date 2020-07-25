import {compositeRouter} from '../../Util/Koa';

export default async () => {
    const router = await compositeRouter(__dirname, {prefix: '/v1'})();

    return router;
};
