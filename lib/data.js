/*
Library for storing and editing data
*/
const fs = require('fs');
const path =  require('path');

// cotnainer for the module
const lib = {};

// base dir of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

//write data to a file
lib.create = (dir, file, data, callback) => {
    // open file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', (err, fileDescriptor) => {
        if(!err && fileDescriptor){
            // convert data to string
            const stringData = JSON.stringify(data);

            // write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if(!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    })
                }else {
                    callback('Error writing to new file');
                }
            })
        } else {
            callback("Could not create new file, it may already exist");
        }
    })
};

// read data from file
lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf8', (err, data) => {
        callback(err, data);
    })
}

// update data inside a file
lib.update = (dir, file, data, callback) => {
    // open file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+', (err, fileDescriptor) =>{
        if(!err && fileDescriptor) {
            const stringData = JSON.stringify(data);

            //truncate the file
            fs.truncate(fileDescriptor, (err) => {
                if(!err) {
                    // write to file and close 
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if (!err) {
                            fs.close(fileDescriptor, (err) => {
                                if(!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing the file');
                                }
                            })
                        } else {
                            callback('Error writing to existing file');
                        }
                    })
                } else {
                    callback('Error truncating file');
                }
            })
        } else {
            callback('Could not open the file for updating, it may not exist yet');
        }
    })
}

// delete a file
lib.delete = (dir, file, callback) => {
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', (err) => {
        if (!err) {
            callback(false);
        } else {
            callback('Error deleting file');
        }
    })
}

module.exports = lib;