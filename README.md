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
* AUTH_MODE should be set to either DOB or AD.
* Make sure you set JWT_KEY to a random value as it is used to ensure integrity of the logged in user. 

### LDAP/AD

If you want to use ldaps with a custom root certificate you will need to run node with the environment variable NODE_EXTRA_CA_CERTS.  For when you use npm start it will automatically add root.crt.

### DOB

Using this mode all the LDAP_ settings are ignored and.

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
