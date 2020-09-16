import * as fs from 'fs';
//this is cranky about the require below.
// eslint-disable-next-line import/order
import * as samlify from 'samlify';

//there is a issue with the package so I cant import it https://github.com/authenio/samlify-validate-with-xmllint/issues/3
// eslint-disable-next-line @typescript-eslint/no-var-requires
const validator = require('@authenio/samlify-validate-with-xmllint');

const binding = samlify.Constants.namespace.binding;

samlify.setSchemaValidator(validator);

// configure okta idp
export const idp = samlify.IdentityProvider({
    metadata: fs.readFileSync(__dirname + '/../../saml/idp.xml'),
    wantLogoutRequestSigned: true
});

// configure our service provider (your application)
export const sp = samlify.ServiceProvider({
    entityID: process.env.SAML_NODE_URL + '/v1/login/sp/metadata',
    authnRequestsSigned: false,
    wantAssertionsSigned: true,
    wantMessageSigned: true,
    wantLogoutResponseSigned: true,
    wantLogoutRequestSigned: true,
    privateKey: fs.readFileSync(__dirname + '/../../saml/privkey.pem'),
    isAssertionEncrypted: false,
    signatureConfig: {},
    assertionConsumerService: [{
        Binding: binding.post,
        Location: process.env.SAML_NODE_URL + '/v1/login/sp/acs',
    }]
});