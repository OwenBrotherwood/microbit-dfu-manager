#!/usr/bin/env node

var baseRequest = require('./rp_config.js');
var noble = require('noble');

var MICROBIT_DFU_SERVICE_UUID = 'e95d93b0251d470aa062fa1922dfa9a8'

noble.on('stateChange', function(state) {
    console.log("Bluetooth state: [" + state + "]")

    if (state === "poweredOn") {
        noble.startScanning([], true, function(error) {
            if (!error) {
                console.log("Scanning for bluetooth le devices…")
            } else {
                console.log("Problems during scanning for bluetooth le devices: " + error)
            }
        })
    }
})

noble.on('discover', function(p) {
    perif = p
    var deviceName  = p.advertisement.localName;

    console.log("Found " + deviceName + " " + p.address)
    console.log("Trying to connect to " + p.advertisement.localName + "[" + p.address + "]")

    p.connect(function() {
        p.discoverAllServicesAndCharacteristics(function(error, services, characteristics) {
            if (!error) {
                var dfu = false;
                var dfuControlCharacteristic;


                services.forEach(function(s, serviceId) {
                    if (s.uuid == MICROBIT_DFU_SERVICE_UUID) {
                        console.log(deviceName + " - micro:bit with DFU support enabled");

                        // Write 0x01 to the MICROBIT_DFU_CONTROL characteristic so 
                        // as to switch to the Nordic DFU bootloader
                        s.characteristics.forEach(function(ch, charId) {
                        	if(ch.uuid == 'e95d93b1251d470aa062fa1922dfa9a8') {
                        		dfuControlCharacteristic = ch
                        	}
                        })

                        console.log(dfuControlCharacteristic)

                        console.log("Switching " +deviceName+" to DFU bootloader")
                        dfuControlCharacteristic.write(new Buffer([0x01]), false, function(err){
                        	console.log("Error when enabling DFU for " + deviceName);
                        	console.log(err);


        p.discoverAllServicesAndCharacteristics(function(error, services, characteristics) {
        	console.log(error)
        	console.log(services)
        })

console.log('bla');

                        });


                        // TODO hawkbit stuff

                        dfu = true;
                    }
                })

                if (!dfu) {
                    console.log(deviceName + " - this device does not support DFU or is not a micro:bit");
                }
            } else {
                console.log(error)
            }
        })

    })
})