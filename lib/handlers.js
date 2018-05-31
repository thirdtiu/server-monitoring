/*
    Request Handlers
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

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
    const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // make user doesnt exist
        _data.read('users', phone, (err, data) => {
            if (err) {
                // hash the password
                const hashedPassword = helpers.hash(password);

                // create user object
                if (hashedPassword) {
                    const userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    }

                    // store the user 
                    _data.create('users', phone, userObject, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, { 'Error': 'Could not create new user' });
                        }
                    });
                } else {
                    callback(500, { 'Error': 'Could not hash the user password' });
                }
            } else {
                // user already exist
                callback(400, { 'Error': 'A user with that phone number already exists' });
            }
        })

    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
};

// Users GET
// required data: phone
// optional data: none;
handlers._users.get = (data, callback) => {
    // check that the phone number is valid
    const phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // get the token from the headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        // verfify that the given token is valid for the number
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                // lookup user
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        // remove the hash password from user object before returning
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404)
                    }
                });

            } else {
                callback(403, { 'Error': 'Missing required token in header, or token is invalid' })
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

// Users PUT
// required data: phone
// optional data: firstname, lastname, password (at least one must be specified)
handlers._users.put = (data, callback) => {
    // check for the required field
    const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // check for the optional fields
    const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if phone is invalid
    if (phone) {
        // if nothing is sent to update
        if (firstName || lastName || password) {

            // get the token from the headers
            const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

            // verfify that the given token is valid for the number
            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if (tokenIsValid) {
                    // lookup user
                    _data.read('users', phone, (err, userData) => {
                        if (!err && userData) {
                            // update fields necessary
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }

                            //store the new updates
                            _data.update('users', phone, userData, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, { 'Error': 'Could not update the user' });
                                }
                            })
                        } else {
                            callback(400, { 'Error': 'Specified user does not exit' });
                        }
                    });
                } else {
                    callback(403, { 'Error': 'Missing required token in header, or token is invalid' })
                }
            });
        } else {
            callback(400, { 'Error': 'Missing fields to update' });
        }

    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

// Users DELETE
// required field: phone
// @todo only let an authenticated user delete their object.
handlers._users.delete = (data, callback) => {
    // check that the phone number is valid
    const phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // get the token from the headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        // verfify that the given token is valid for the number
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                // lookup user
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        _data.delete('users', phone, (err) => {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, { 'Error': 'Could not delete specified user' });
                            }
                        })
                    } else {
                        callback(400, { 'Error': 'Could not find specified user' })
                    }
                });
            } else {
                callback(403, { 'Error': 'Missing required token in header, or token is invalid' })
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field' });
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
    const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone && password) {
        // lookup user who matches that phone number
        _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
                // hash the sent password, and compare it to the password stored
                const hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    // if valid create new token with a random name. Set expiration date 1 hour in the future
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60; // 1 hour in the future
                    const tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    }
                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, { 'Error': 'Could not create token' });
                        }
                    });
                } else {
                    callback('400', { 'Error': 'Password did not match' });
                }
            } else {
                callback('400', { 'Error': 'Could not find the specified user' });
            }
        })
    } else {
        callback('400', { 'Error': 'Missing required fields' });
    }
};

// tokens - get
// required data is ID
// optional data is none
handlers._tokens.get = (data, callback) => {
    //check id if valid
    const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    console.log(id);
    if (id) {
        // lookup user
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404)
            }
        })

    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

// tokens - put
// required data: id, extend
// optional data: none
handlers._tokens.put = (data, callback) => {
    //check id if valid
    const id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

    if (id && extend) {
        // lookup the token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                // check to make sure the token has not yet expired
                if (tokenData.expires > Date.now()) {
                    //extend expiry to an hour
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    //store new updates
                    _data.update('tokens', id, tokenData, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { 'Error': 'Could not update the token\'s expiration ' });
                        }
                    })
                } else {
                    callback(400, { 'Error': 'Token has already expired' });
                }
            } else {
                callback(400, { 'Error': 'Specified token does not exist' })
            }
        })
    } else {
        callback((400, { 'Error': 'Missing required field(s) or field(s) are invalid' }));
    }
};

// tokens - delete
// required data: id
// optional data: none
handlers._tokens.delete = (data, callback) => {
    // check if id is valid
    const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    console.log(id);
    if (id) {
        // lookup user
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'Error': 'Could not delete specified token' });
                    }
                })
            } else {
                callback(400, { 'Error': 'Could not find specified token' })
            }
        })

    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

// verify if given token id is currently valid for given user
handlers._tokens.verifyToken = (id, phone, callback) => {
    //lookup the token
    _data.read('tokens', id, (err, tokeData) => {
        if (!err && tokeData) {
            // check that the token is for the given user and has not yet expired
            if (tokeData.phone == phone && tokeData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// checks
handlers.checks = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};

//  container for all check methods
handlers._checks = {};

// checks - post
// required data: protocol, url, method, success codes , timeoutseconds
// optional data: none
handlers._checks.post = (data, callback) => {
    const protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        // get the token from the header
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        //lookup the user by reading the token
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                const userPhone = tokenData.phone;

                // lookup the user data
                _data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                        const userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        // verify that the user has less than the number of max-checks-per-user
                        if (userChecks.length < config.maxChecks) {
                            // create a randomid for the check
                            const checkId = helpers.createRandomString(20);

                            // create the check object and include the user phone
                            const checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            };

                            //save the object
                            _data.create('checks', checkId, checkObject, (err) => {
                                if (!err) {
                                    // add the checkid to the user's object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    //save the new user data
                                    _data.update('users', userPhone, userData, (err) => {
                                        if (!err) {
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, { 'Error': 'Could not update the user with the new check' });
                                        }
                                    })
                                } else {
                                    callback(500, { 'Error': 'Could not create the new check' });
                                }
                            })
                        } else {
                            callback(400, { 'Error': 'The user already has the maximum number of allowed checks (' + config.maxChecks + ')' });
                        }
                    } else {
                        callback(403);
                    }
                })
            } else {
                callback(403)
            }
        })

    } else {
        callback(400, { 'Error': 'Missing required inputs or inputs are invalid' });
    }
};

// checks - get
// required data: id
// optional data: none
handlers._checks.get = (data, callback) => {
    // check that the phone number is valid
    const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {

        //lookup the chgeck
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                // get the token from the headers
                const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                // verfify that the given token is valid and belongs to the user who created the check
                handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        // return the checkdata
                        callback(200, checkData);
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
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