import Router from '@koa/router';
import {getCachedQuestions} from "../../Util/Question";

const router = new Router({prefix: '/health'});

router.get('/', async context => {
    const questions = await getCachedQuestions();
    if (questions.length > 0) {
        context.response.status = 200;
        return context.body = {
            status: 1,
            health: questions.length
        }
    }

    context.status = 503;
    context.body = {
        status: -1,
        health: questions.length
    };
});

export default router;