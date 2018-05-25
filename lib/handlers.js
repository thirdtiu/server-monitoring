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
// required data: phone
// optional data: none;
// @todo only let an authenticated user access their object, don't let them access anyone else's
handlers._users.get = (data, callback) => {
    // check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // lookup user
        _data.read('users', phone, (err, data) => {
            if(!err && data) {
                // remove the hash password from user object before returning
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404)
            }
        })

    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Users PUT
// required data: phone
// optional data: firstname, lastname, password (at least one must be specified)
// @TODO only let an authenticated user  update their own object, DOn't let them update anyone else's
handlers._users.put = (data, callback) => {
    // check for the required field
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // check for the optional fields
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if phone is invalid
    if (phone){
        // if nothing is sent to update
        if (firstName || lastName || password) {
            // lookup user
            _data.read('users', phone, (err, userData) => {
                if(!err && userData) {
                    // update fields necessary
                    if(firstName){
                        userData.firstName = firstName;
                    }
                    if(lastName){
                        userData.lastName = lastName;
                    }
                    if(password){
                        userData.hashedPassword = helpers.hash(password);
                    }

                    //store the new updates
                    _data.update('users', phone, userData, (err) => {
                        if(!err){
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error' : 'Could not update the user'});
                        }
                    })
                } else {
                    callback(400,{'Error' : 'Specified user does not exit'});
                }
            });
        } else {
            callback(400, {'Error' : 'Missing fields to update'});
        }

    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Users DELETE
// required field: phone
// @todo only let an authenticated user delete their object.
// @todo cleanup {delete} any other data files associated with this user
handlers._users.delete = (data, callback) => {
  // check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    // lookup user
    _data.read('users', phone, (err, data) => {
        if(!err && data) {
            _data.delete('users', phone, (err) => {
                if (!err) {
                    callback(200);
                } else {
                    callback(500, {'Error' : 'Could not delete specified user'});
                }
            })
        } else {
            callback(400, {'Error' : 'Could not find specified user'})
        }
    })

} else {
    callback(400, {'Error' : 'Missing required field'});
}
};

// tokens 
handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for all tokens sub methods
handlers._tokens = {};


// tokens - post
// required data: phone, password
// optional data: none
handlers._tokens.post = (data, callback) => {
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone && password) {
        // lookup user who matches that phone number
        _data.read('users', phone, (err, userData) => {
            if(!err &&  userData) {
                // hash the sent password, and compare it to the password stored
                const hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    // if valid create new token with a random name. Set expiration date 1 hour in the future
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() * 1000 * 60 * 60; // 1 hour in the future
                    const tokenObject = {
                        'phone' : phone,
                        'id' : tokenId,
                        'expires' : expires
                    }
                    _data.create('tokens', tokenId, tokenObject, (err) => {
                      if(!err) {
                          callback(200, tokenObject);
                      } else {
                          callback(500, {'Error' : 'Could not create token'});
                      }
                    });
                } else {
                    callback('400', {'Error' : 'Password did not match'});
                }
            } else {
                callback('400', {'Error' : 'Could not find the specified user'});
            }
        })
    } else {
        callback('400', {'Error': 'Missing required fields'});
    }
};

// tokens - get
handlers._tokens.get = (data, callback) => {

};

// tokens - put
handlers._tokens.put = (data, callback) => {

};

// tokens - delete
handlers._tokens.delete = (data, callback) => {

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