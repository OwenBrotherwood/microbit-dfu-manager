#!/usr/bin/env node

var baseRequest = require('./rp_config.js');
const noble = require('noble');

const fs = require('fs'),
    fsp = require('fs-promise');

const nrfUpdate = require('nrf5x-dfu-updater')

var MICROBIT_DFU_SERVICE_UUID = 'e95d93b0251d470aa062fa1922dfa9a8'

var baseRequest = baseRequest.defaults({
    baseUrl: "http://192.168.0.42:8080/DEFAULT/controller/v1/",
    method: 'GET',
    auth: null
})

var cproc    = require('child_process');

var resumeBLEScanning = function() {
    noble.startScanning([], true, function(error) {
        if (!error) {
            console.log("Scanning for bluetooth le devices…")
        } else {
            console.log("Problems during scanning for bluetooth le devices: " + error)
        }
    });
}

noble.on('stateChange', function(state) {
    console.log("Bluetooth state: [" + state + "]")

    if (state === "poweredOn") {
        resumeBLEScanning();
    } else {
        noble.stopScanning();
    }
})


var dfu = false;

noble.on('discover', function(p) {
    // we found a peripheral, stop scanning
    noble.stopScanning();

    p.once('disconnect', function() {
        console.log("Peripheral " + p.advertisement.localName + " -> disconnected")
        if (dfu) {
            console.log("trigger update")




//	                nrfUpdate(p, '/tmp/xxxx.bin')

	setTimeout(() => {

        child = cproc.fork('/home/pi/Repositories/nrf5x-dfu-updater/update.js', [ "-f", "/tmp/xxx.bin", "-a", "ec:b4:ec:cc:7c:c3" ], { stdio: 'inherit' } )  ;

child.on('exit',function(code) {
	console.log("FINISHED - resume BLE scanning in main process");
        resumeBLEScanning();
	dfu = false;
});

}, 2000);

        } else {
		resumeBLEScanning();
}
    });


    var deviceName = p.advertisement.localName;

    console.log("Found " + deviceName + " " + p.address)

if (dfu) {
console.log('dfu already in progress');
return;
}

    console.log("Trying to connect to " + deviceName + "[" + p.address + "]")

    p.connect(function() {
        console.log("Connected to " + deviceName + ". Now checking available services");

        p.discoverAllServicesAndCharacteristics(function(error, services, characteristics) {
            if (!error) {
                var dfuControlCharacteristic;


                services.forEach(function(s, serviceId) {
                    if (s.uuid == MICROBIT_DFU_SERVICE_UUID) {
                        console.log(deviceName + " - micro:bit with DFU support enabled");

                        // Write 0x01 to the MICROBIT_DFU_CONTROL characteristic so 
                        // as to switch to the Nordic DFU bootloader
                        s.characteristics.forEach(function(ch, charId) {
                            if (ch.uuid == 'e95d93b1251d470aa062fa1922dfa9a8') {
                                dfuControlCharacteristic = ch
                            }
                        })

                        var deploymentBaseUrl;
                        var deploymentId;
                        var artifactUrl;

                        console.log("Querying Eclipse hawkBit server for information regarding " + p.address)
                        baseRequest(p.address)
                            .then(response => {
                                if (response._links.deploymentBase) {
                                    deploymentBaseUrl = response._links.deploymentBase.href
                                    return baseRequest({
                                        baseUrl: null,
                                        uri: deploymentBaseUrl
                                    })
                                } else {
                                    return Promise.reject(deviceName + " - This device doesn't have pending updates.")
                                }
                            })
                            .then(response => {
                                var deployment = response.deployment;
                                deploymentId = response.id;
                                var chunks = deployment.chunks;

                                artifactUrl = chunks[0].artifacts[0]._links['download-http'].href;

                                return baseRequest({
                                    baseUrl: null,
                                    uri: artifactUrl,
                                    json: false,
                                    encoding: null // binary
                                })

                            })
                            .then(response => {
                                return fsp.writeFile('/tmp/xxxx.bin', response)
                            })
                            .then(() => {
                                console.log("Binary properly downloaded for updating " + deviceName);

                                // report about this successful download
                                return baseRequest({
                                    baseUrl: deploymentBaseUrl.split("?")[0], // remove the ?c=329048320948 stuff at the end of the base url
                                    uri: "/feedback",
                                    method: 'POST',
                                    body: {
                                        id: deploymentId,
                                        status: {
                                            execution: "proceeding",
                                            result: {
                                                finished: "success",
                                                progress: {
                                                    cnt: 1,
                                                    of: 5
                                                }
                                            },
                                            details: [
                                                "Download completed by microbit-dfu-manager"
                                            ]
                                        }
                                    }

                                });
                            })
                            .then(response => {
                                // console.log("Update fully complete… maybe 😀")

                                dfuControlCharacteristic.write(new Buffer([0x01]), false, function(err) {
                                    if (err) {
                                        console.log("Error when enabling DFU for " + deviceName);
                                        console.log(err);
                                    } else {
                                        console.log("Discovering DFU hopefully")
                                        p.discoverAllServicesAndCharacteristics(function(error, services, characteristics) {
                                            //console.log(error)
                                            //console.log(services)
                                            services.map((e) => {
                                                console.log(e.uuid)
                                            })
                                        })
                                    }
                                });
                            })
                            .catch(err => {
                                if (err.message) {
                                    console.log("ERROR: ", err.message)
                                } else {
                                    console.log("ERROR: ", err)
                                }

                                if (deploymentId) {
                                    // If we had started a deployment, report back that it failed
                                    // return baseRequest({
                                    // baseUrl: deploymentBaseUrl.split("?")[0], // remove the ?c=329048320948 stuff at the end of the base url
                                    // uri: "/feedback",
                                    // method: 'POST',
                                    // body: {
                                    //     id: deploymentId,
                                    //     status: {
                                    //         execution: "closed",
                                    //         result: {
                                    //             finished: "failure"
                                    //         },
                                    //         details: [
                                    //             err.message | err.toString()
                                    //         ]
                                    //     }
                                    // }
                                    // });
                                }

                                //resumeBLEScanning();


                            })
                        dfu = true;
                    }
                })

                if (!dfu) {
                    console.log(deviceName + " - this device does not support DFU or is not a micro:bit");
                    resumeBLEScanning();

                }
            } else {
                console.log(error)
            }
        })

    })
})
