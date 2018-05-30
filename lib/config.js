/*
Create and export configuration variables
*/

// container for all the environments
var environments = {};

//staging (default) environment

environments.staging = {
    'httpPort' : 8888,
    'httpsPort' : 8889,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsASecret',
    'maxChecks': 5
};

//production environemnt
environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'thisIsAlsoASecret',
    'maxChecks': 5
};

//determine which environment was passed as a commandline argument
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// check that the current environment is on of the environments specified
const environemntToExport =  typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] :  environments.staging;

// export the module

module.exports = environemntToExport;