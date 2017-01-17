#!/usr/bin/env node

var rp = require('request-promise');

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


// create tags:
var createTagsQuery = {
    uri: '/targettags',
    body: [{
        "name": "blue",
        "description": "Blue micro:bits",
        "colour": "rgb(56, 70, 255)"
    }, {
        "name": "pink",
        "description": "Blue micro:bits",
        "colour": "rgb(243, 0, 255)"
    }, ]
};

var createDistributionSetTypeQuery = {
    uri: '/distributionsettypes',
    body: [{
        "name": "microbit_app",
        "description": "A packaged micro:bit application",
        "key": "microbit_app",
        "mandatorymodules": [{
            "id": 1
        }]
    }]
}

var createDistributionSetQuery = {
    uri: '/distributionsets',
    body: [{
        "name": "space_invaders",
        "description": "A micro:bit application for playing Space Invaders",
        "version": "1.0.0",
        "type": "microbit_app"
    }, {
        "name": "hello_world",
        "description": "A micro:bit application that displays 'Hello World!'",
        "version": "1.0.0",
        "type": "microbit_app"
    }]
}

baseRequest(createTagsQuery)
    .then(response => {
        console.log(response.length + " Tag(s) successfuly created")

        return baseRequest(createDistributionSetTypeQuery);
    })
    .then(response => {
        console.log(response.length + "Distribution Set Type(s) successfuly created")

        return baseRequest(createDistributionSetQuery);
    })
    .then(response => {
        console.log(response.length + "Distribution Set(s) successfuly created")
    })
    .catch(err => {
        console.log(err.message)
    })