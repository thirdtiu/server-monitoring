// Primary file for the API

// dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// instantiate the http server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
})
// start the http server
httpServer.listen(config.httpPort, () =>{
    console.log(`The server is listening on port ${config.httpPort} in ${config.envName} node`);
})

//instantiate the https server
const httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req,res);
})
//start the https server
httpsServer.listen(config.httpsPort, () =>{
    console.log(`The server is listening on port ${config.httpsPort} in ${config.envName} node`);
})



// all the server logic for both http and https server
const unifiedServer = (req, res) => {
    // Get the URL and parse it
    const parsedUrl = url.parse(req.url, true);
    
    // Get the path
    const path = parsedUrl.pathname;
    const trimPath = path.replace(/^\/|\/$/g, '');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    const method = req.method.toLowerCase();    

    // Get Headers as an object
    const headers = req.headers;

    // get the payload, if any
    const decoder =  new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    })
    req.on('end', () => {
        buffer += decoder.end();

        //choose the handler this request should go to, if not found, use notFound handler
        const chooseHandler = typeof(router[trimPath]) != 'undefined' ? router[trimPath] : handlers.notFound;

        // construct the data object to send to the handler
        const data = {
            'trimPath': trimPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // route the request to the handler specified in the router
        chooseHandler(data, (statusCode, payload) => {
            // use the status code called back by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // use the payload called by the handler, or default to empty object
            payload = typeof(payload) == 'object' ? payload : {};

            //convert the payload to a string
            const payloadString = JSON.stringify(payload);

            // return the response
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            // Send the response
            res.end(payloadString);

            // Log the request path
            console.log(`Returning this response:  `, statusCode, payloadString);
        });
        
    })
};


// define a request router
const router = {
    'ping' : handlers.ping,
    'users' : handlers.users
}