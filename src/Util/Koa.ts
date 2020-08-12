import {promises as fs} from 'fs';
import path from 'path';
import Router from '@koa/router';

export const compositeRouter = (directory : string, routerOptions ?: Router.RouterOptions) => async () : Promise<Router> => {
    const router = new Router(routerOptions);
    const files = await fs.readdir(directory);

    for (const file of files) {
        if ((file.endsWith('.js') || file.endsWith('.ts')) && !file.startsWith('index')) {
            const module = await import(path.join(directory, file));

            if (module.default && module.default instanceof Router) {
                router.use(module.default.routes());
                router.use(module.default.allowedMethods());
            }
        }
    }

    return router;
};
