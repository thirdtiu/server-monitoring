/*
    Request Handlers
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// define handlers
var handlers = {};

// users 
handlers.users = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the users sub method
handlers._users = {};

// Users POST
// required data: firstName, lastName, phone, password, tosAgreement
handlers._users.post = (data, callback) => {
    // check that all required fields are filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement) {
        // make user doesnt exist
        _data.read('users',phone, (err, data) => {
            if(err) {
                // hash the password
                const hashedPassword = helpers.hash(password);

                // create user object
                if(hashedPassword) {
                    const userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : true
                    }
    
                    // store the user 
                    _data.create('users', phone, userObject, (err) => {
                        if(!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error' : 'Could not create new user'});
                        }
                    });
                } else {
                    callback(500, {'Error' : 'Could not hash the user password'});
                }
            } else {
                // user already exist
                callback(400, {'Error' : 'A user with that phone number already exists'});
            }
        })

    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// Users GET
handlers._users.get = (data, callback) => {
    
};

// Users PUT
handlers._users.put = (data, callback) => {
    
};

// Users DELETE
handlers._users.delete = (data, callback) => {
    
};

// ping handler
handlers.ping = (data, callback) => {
    callback(200)
}

handlers.notFound = (data, callback) => {
    callback(404);
};

// Export the module
module.exports = handlers;