import {Request} from 'koa';
import {User} from './Util/Authentication';

declare module "koa"
{
    interface Request {
        user : User|null;
    }
}
