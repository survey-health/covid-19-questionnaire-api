import dotenv from 'dotenv';
import {KJUR} from "jsrsasign";
import {Client, IClientConfig} from "ldap-ts-client";
import {InvalidCredentialsError} from "ldapjs";
import {FacultyFieldData} from "../Route/V1/Faculty";
import {StudentFieldData} from "../Route/V1/Student";
import {client, escapeFindString} from "./FileMaker";

dotenv.config();

type AuthenticationResponse = {
    jwt : string;
    displayName : string;
};

export type User = {
    employeeID : string;
    type : "student" | "guardian" | "faculty";
};

export const dobLogin = async (id : string, dob : Date) : Promise<AuthenticationResponse> => {
    try {
        const filteredID = escapeFindString(id);
        const studentResult = await client
            .layout<StudentFieldData>("Student")
            .find(
                {
                    Web_ID_c: `==${filteredID}`,
                    Web_DOB_c: `==${dob.toLocaleDateString("en-US")}`
                },
                {limit: 1},
                true
            );

        if (studentResult.data.length) {
            return {
                jwt: generateJWT({
                    employeeID : studentResult.data[0].fieldData.Web_ID_c,
                    type : "student"
                }),
                displayName : studentResult.data[0].fieldData.Web_DisplayName_c,
            };
        } else {
            const facultyResult = await client
                .layout<FacultyFieldData>("Faculty")
                .find(
                    {
                        Web_ID_c: `==${filteredID}`,
                        Web_DOB_c: `==${dob.toLocaleDateString("en-US")}`
                    },
                    {limit: 1},
                    true
                );

            if (facultyResult.data.length) {
                return {
                    jwt: generateJWT({
                        employeeID: facultyResult.data[0].fieldData.Web_ID_c,
                        type: "faculty"
                    }),
                    displayName: facultyResult.data[0].fieldData.Web_DisplayName_c,
                };
            }
        }
    } catch (e) {
        if (e.code === '952') {
            await client.clearToken();
        }
        throw e;
    }

    throw new InvalidCredentialsError('Could not find a user for these credentials.');
}

export const login = async (username : string, password : string) : Promise<AuthenticationResponse> => {
    let bindUsername = username;

    if (bindUsername.indexOf('\\') === -1 && bindUsername.indexOf('@') === -1) {
        bindUsername = (process.env.LDAP_PREFIX ?? "") + username;
    }

    const config : IClientConfig = {
        ldapServerUrl: process.env.LDAP_URL ?? "",
        user: bindUsername,
        pass: password
    };

    const client = new Client(config);
    await client.bind();

    const users = await client.queryAttributes({
        attributes: ["displayName", "employeeid"],
        options: {
            filter: ldapFilter(username),
            scope: "sub",
            paged: true,
        },
        base: process.env.LDAP_BASEDN ?? ""
    });

    let displayName = users[0].displayName;
    
    if (typeof displayName === "object") {
        displayName = displayName[0];
    }

    let employeeID = users[0].employeeID;
    
    if (typeof employeeID === "object") {
        employeeID = employeeID[0];
    }

    client.unbind();

    return {
        jwt: generateJWT({
            employeeID,
            type: "student"
        }),
        displayName: displayName
    };
};

export const samlLogin = async (username : string) : Promise<AuthenticationResponse> => {
    const filteredUsername = escapeFindString(username);
    const studentResult = await client
        .layout("Student")
        .find(
            {
                'Web_ID_c': '*'
            },
            {
                'script.prerequest' : 'getIDFromUsername',
                'script.prerequest.param' : JSON.stringify({
                    username : filteredUsername
                }),
                limit: 1
            },
            true
        );

    if (studentResult['scriptResult.prerequest'] === undefined) {
        throw new Error("no script result for user: " + username);
    }

    const scriptResult = JSON.parse(studentResult['scriptResult.prerequest']);

    return {
        jwt: generateJWT({
            employeeID: scriptResult.id,
            type: scriptResult.type
        }),
        displayName: username
    };
}

const ldapFilter = (username : string) : string => {
    const person = "(&(ObjectCategory=Person)(ObjectClass=User)";
    let filterUsername = username.replace('\\', '\\\\')
        .replace(')', '\\)')
        .replace('(', '\\(');

    if (username.indexOf('@') > 0) {
        return person + "(userprincipalname=" + filterUsername + "))";
    }

    if (filterUsername.indexOf('\\\\') > 0) {
        filterUsername = filterUsername.split('\\\\', 2)[1];
    }

    return person + "(samaccountname=" + filterUsername + "))";
}

export const generateJWT = (subject : User) : string => {
    const oPayload = {
        iat: KJUR.jws.IntDate.get('now'),
        exp: KJUR.jws.IntDate.get('now + 1hour'),
        sub: subject
    };

    return KJUR.jws.JWS.sign(
        "HS256",
        {alg: 'HS256'},
        oPayload,
        process.env.JWT_KEY
    )
};

export const validateJWT = (jwt : string) : boolean => {
    return KJUR.jws.JWS.verifyJWT(
        jwt,
        process.env.JWT_KEY ?? "",
        // @ts-ignore the other attributes are not needed
        {alg: ['HS256']}
    )
}

export const bearerStrategy = (bearer : string) : User|null => {
    const bearerParts = bearer.split(" ");
    
    if (bearerParts.length === 2 && validateJWT(bearerParts[1])) {
        const payload = KJUR.jws.JWS.parse(bearerParts[1]);

        // @ts-ignore sub is going to be there trust me
        if (typeof payload?.payloadObj?.sub !== "undefined") {
            return {
                // @ts-ignore sub is going to be there trust me
                ...payload.payloadObj.sub
            };
        }
    }

    return null;
}