import Router from '@koa/router';
import {InvalidCredentialsError} from "ldapjs";
import {BindingContext, PostBindingContext} from "samlify/types/src/entity";
import * as yup from 'yup';
import {login, dobLogin, samlLogin} from "../../Util/Authentication";
import {sp, idp} from "../../Util/Saml"

const router = new Router({prefix: '/login'});

const samlCookieName = 'saml'

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

router.get('/sp/token', async context => {
    const referrerUrl = new URL(context.request.headers['referer'])
    const reactUrl = new URL(process.env.SAML_REACT_URL ?? "");

    if (referrerUrl.origin !== reactUrl.origin) {
        context.status = 500
        return context.body = {
            error: 'Invalid header'
        }
    }

    const cookie = context.cookies.get(samlCookieName);
    if (cookie === undefined || cookie.length < 10) {
        context.status = 401
        return context.body = {
            error: 'Missing cookie'
        }
    }

    context.cookies.set(
        samlCookieName,
        '',
        {
            maxAge: 0,//ms not seconds
            sameSite: 'lax',
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            path: "/v1/login/"
        }
    );
    context.status = 200;
    return context.body = cookie;
});

const isPostBinding = (contex : BindingContext | PostBindingContext) : contex is PostBindingContext => {
    return (contex as PostBindingContext).entityEndpoint !== undefined;
}

router.get('/sp/redirect', async context => {
    try {
        if (process.env.SAML_SP_MODE === "POST") {
            const saml = await sp.createLoginRequest(idp, 'post');
            if (isPostBinding(saml)) {
                return context.body = `<html><body><form method="post" action="${saml.entityEndpoint}" autocomplete="off">
<input type="hidden" name="SAMLRequest" value="${saml.context}" />
</form><script type="text/javascript">(function(){document.forms[0].submit();})();</script></html></body>`
            }
        } else {
            const {context: redirectUrl} = await sp.createLoginRequest(idp, 'redirect');
            context.response.redirect(redirectUrl + process.env.SAML_SP_REDIRECT_APPEND ?? '');
        }
    } catch (e) {
        console.error('[FATAL] generating saml redirect', e);
    }
});


router.get('/sp/metadata', async context => {
    context.response.body = sp.getMetadata();
    context.response.type = 'text/xml';
});

router.post('/sp/acs', async context => {
    try {
        const {extract} = await sp.parseLoginResponse(idp, 'post', context.request);
        context.response.body = login;
        context.response.status = 200;
        const username = extract.attributes[process.env.SAML_ATTRIBUTE
            ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
        const authResult = await samlLogin(username)
        context.cookies.set(
            samlCookieName,
            authResult.jwt,
            {
                maxAge: 300*1000,//ms not seconds
                sameSite: 'lax',
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                path: "/v1/login/"
            }
        )
        return context.response.redirect((process.env.SAML_REACT_URL ?? '') + "/#saml-success");
    } catch (e) {
        console.error('[FATAL] when parsing login response', e);
        return context.response.redirect((process.env.SAML_REACT_URL ?? '') + "/#saml-error");
    }
});


export default router;