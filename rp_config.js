var rp = require('request-promise-native');

var HAWKBIT_BASE_URL = "http://localhost:8080/rest/v1"
var LOGIN = "admin"
var PASSWORD = "admin"

var baseRequest = rp.defaults({
    baseUrl: HAWKBIT_BASE_URL,
    method: 'POST',
    auth: {
        user: LOGIN,
        password: PASSWORD
    },
    json: true // Automatically stringifies the body to JSON
})

module.exports = baseRequest;