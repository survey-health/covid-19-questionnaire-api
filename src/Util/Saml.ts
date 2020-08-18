import * as fs from 'fs';
import * as validator from '@authenio/samlify-node-xmllint';
import * as samlify from 'samlify';

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