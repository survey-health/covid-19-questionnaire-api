# COVID-19 Questionnaire
This is the node API application for the COVID-19 Questionnaire. This application has been developed and tested using Node 12.

## About

This open source application is free to use or modify, however, it does not include detailed documentation or instructions.

This COVID-19 Questionnaire solution is a public preview of parts of a custom solution which was purpose-built for Glenbrook High School District 225 in Northfield Township, Cook County, Illinois.

This public previvew release has been modified to make it more suitable for use by other districts by removing features and integrations which are Glenbrook-specific. The application is being provided as-is free of charge for any school district with the development and infrastructure resources to customize and deploy it for their own use.

If you are interested in a turnkey solution, visit https://www.soliantconsulting.com/school-covid-questionnaire/ for more information.

## Setup
* Copy .env.dist to .env.
* Change the settings to what are appropriate for your environment.  
* AUTH_MODE should be set to DOB, AD, or SAML.
* USER_MODE should be set to STUDENT or PARENT.
* Make sure you set JWT_KEY to a random value as it is used to ensure integrity of the logged in user. 

### LDAP/AD

If you want to use ldaps with a custom root certificate you will need to run node with the environment variable NODE_EXTRA_CA_CERTS.  For when you use npm start it will automatically add root.crt.

### DOB

Using this mode all the LDAP_ settings are ignored and.

### SAML

You will need to set `SAML_ATTRIBUTE` to the exact name of the attribute that you will send with the saml assertion.
`SAML_REACT_URL` must be set to the frontend so the backend knows where to redirect the user after saml is done.
`SAML_NODE_URL` needs to be set to the url for this service.  If NODE_ENV is set to anything other then development both urls must be https.

### STUDENT

When USER_MODE is set to STUDENT, students and faculty will be allowed to log into the application.

### PARENT

When USER_MODE is set to PARENT, parents and faculty will be allowed to log into the application. Parents/Guardians will see a list of students and be allowed to fill out the questionnaire for each student.

## Running the API

### Development
To run a developmental copy of the api run
* `npm start`

The api will be running at [http://localhost:3000](http://localhost:3000)

### Production
First you will want to build a production copy by using
* `npm run build`

Next you will need some way to run the node application like pm2/systemd using the build/index.js output from the build.

Finally you will want to setup a reverse proxy like nginx to add https.

## Web Server Minimum Requirements

* AWS cloud hosting option
  * T3 small

* On premise hosting option
  * RAM: 2GB
  * CPU: Dual Core
  * Storage: 50GB
  * OS: Ubuntu server 18.0.4 or 20.0.4
