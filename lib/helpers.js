/*
helpers for various tasks
*/
// dependencies
const crypto = require('crypto');
const config = require('./config');

// container for all the helpers

const helpers = {};

//create a SHA256 hash
helpers.hash = (str) => {
    if (typeof(str) == 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};


// parse a json string to an object in all cases without throwing
helpers.parseJsonToObject = (str) => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch(e) {
        return {};
    }
}

// create a string of random alphanumeric characters, of a given length
helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;

    if (strLength) {
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        // start the final string
        let str = '';
        for (i=1; i <= strLength; i++) {
            //get a random character from the possibleCharatcter string
            let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // append this character to the final string
            str += randomCharacter;
        }

        return str;
    } else {
        return false;
    }
}

//export module
module.exports = helpers;