#!/usr/bin/env node

var fs = require('fs');
var baseRequest = require('./rp_config.js');

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

var getSoftwareModuleType = {
    uri: '/softwaremoduletypes',
    method: 'GET',
    qs: {
        "q": "name==application"
    }
}

var createDistributionSetTypeQuery = {
    uri: '/distributionsettypes',
    body: [{
        "name": "Micro:bit app",
        "description": "A packaged micro:bit application",
        "key": "microbit_app",
        "mandatorymodules": [{
            "id": 0 // is fetched later on
        }]
    }]
}

var sw_modules = {
    "space_invaders": "/Users/kartben/Google Drive/microbitapps/microbit-invaders-dfu.bin",
    "hello_world": "/Users/kartben/Google Drive/microbitapps/microbit-helloworld-dfu.bin"
}

var createDistributionSetQuery = {
    uri: '/distributionsets',
    body: [{
        "name": "XXX",
        "description": "A micro:bit application package that contains a XXX",
        "version": "1.0.0",
        "type": "microbit_app",
        "modules": []
    }]
}

var createSoftwareModuleQuery = {
    uri: '/softwaremodules',
    body: [{
        "vendor": "eclipseiot",
        "name": "XXX",
        "description": "A XXX for the micro:bit",
        "type": "application",
        "version": "1.0.0"
    }]
}

var uploadBinaryArtifactQuery = {
    formData: {
        //        file: fs.createReadStream('/tmp/bla')
    }
}

var createTargetsQuery = {
    uri: '/targets',
    body: [{
        "controllerId": "cf:ac:73:e6:8d:fc",
        "name": "vevut"
    }, {
        "controllerId": "c9:95:ed:8a:1d:a6",
        "name": "vetop"
    }, {
        "controllerId": "ec:b4:ec:cc:7c:c3",
        "name": "vavog"
    }]
}


var uploadArtifact = function(softwaremodule) {
    var id = softwaremodule.id;
    uploadBinaryArtifactQuery.uri = '/softwaremodules/' + id + '/artifacts'
    uploadBinaryArtifactQuery.formData.file = fs.createReadStream(sw_modules[softwaremodule.name])

    return baseRequest(uploadBinaryArtifactQuery);
}

var uploadArtifactsAndCreateDistributionSets = function(softwaremodule) {
    createSoftwareModuleQuery.body[0].name = softwaremodule;
    var sw_module_id;

    return baseRequest(createSoftwareModuleQuery)
        .then(response => {
            console.log(response.length + " Software Module(s) successfully created [" + softwaremodule + "]")
            sw_module_id = response[0].id
            return uploadArtifact(response[0]);
        })
        .then(response => {
            console.log("'" + softwaremodule + "' Artifact successfully uploaded")

            createDistributionSetQuery.body[0].name = softwaremodule;
            createDistributionSetQuery.body[0].description =
                "A micro:bit application package that contains a '" + softwaremodule + "' app.";

            createDistributionSetQuery.body[0].modules = Array.of({
                "id": sw_module_id
            })

            return baseRequest(createDistributionSetQuery);
        });
}

baseRequest(createTagsQuery)
    .then(response => {
        console.log(response.length + " Tag(s) successfully created")

        return baseRequest(getSoftwareModuleType);
    })
    .then(response => {
        var appTypeId = response.content[0].id
        createDistributionSetTypeQuery.body[0].mandatorymodules[0].id = appTypeId;

        return baseRequest(createDistributionSetTypeQuery);
    })
    .then(response => {
        console.log(response.length + " Distribution Set Type(s) successfully created")

        return Promise.all(Object.keys(sw_modules).map(uploadArtifactsAndCreateDistributionSets));
    })
    .then(response => {
        console.log(response.length + " Distribution Set(s) fully created")

        // NOTE we do this for convenience only, since hawkBit supports plug&play and devices 
        // don't necessarily _have to_ be provisioned
        return baseRequest(createTargetsQuery);
    })
    .then(response => {
        console.log(response.length + " Target(s) successfully created")
    })
    .catch(err => {
        console.log(err.message)
    })