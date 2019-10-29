var usbDetect = require('usb-detection'),
    WebSocket = require('ws'),
    Hidstream = require('node-hid-stream').Hidstream;

// -----------------------------------------------------------------------------
// Configuration

const scaleVid = 3768;  // Mettler Toledo
const scalePid = 61440; // PS60

var scale = { weight: null, unit: null, status: null },
    socket = null,
    address = '127.0.0.1',
    port = 8789
    ;

// -----------------------------------------------------------------------------
// Websocket Server

const wss = new WebSocket.Server({ address: address, port: port });

wss.on('connection', function(ws) {
    socket = ws; // assign socket globally for access via scale updates
    scale.status = 'booting';
    // console.log('websocket connected');
});
wss.on('error', function(ws){
    // console.log(arguments);
});


// -----------------------------------------------------------------------------
// USB Device Detection

usbDetect.startMonitoring();

usbDetect.on('add:'+scaleVid+':'+scalePid, enableScale);
usbDetect.on('remove:'+scaleVid+':'+scalePid, disableScale);
usbDetect.find(scaleVid, scalePid)
    .then(function(devices) {
        if (devices.length > 0) {
            enableScale();
            // console.log('Scale Found');
        }
    })
    .catch(function(err) {
        // console.log('Scale Not Found');
    });

// -----------------------------------------------------------------------------
// Enable/Disabling of Scale

const CMD_STATUS = 0x04;
const CMD_WEIGHT = 0x03;

var scaleStream,
    ScaleStatuses = {0x04: 'weighed', 0x03: 'weighing', 0x02: 'empty', 0x05: 'error', 0x08: 'booting'},
    ScaleUnits    = {0x0c: 'lbs', 0x03: 'kgs'}
    ;

function enableScale(device) {
    // console.log(device);
    try {
        scaleStream = new Hidstream({ vendorId: scaleVid, productId: scalePid });
        scaleStream.on('data', function(data) {
            var cmd    = data[0],
                status = data[1],
                unit   = data[2],
                weight = (data[4] + (256*data[5])) / 100;

            if (cmd == CMD_WEIGHT) {
                scale = { weight: weight, unit: ScaleUnits[unit], status: ScaleStatuses[status]};
                if(socket) socket.send(JSON.stringify(scale));
                // console.clear(); console.log(scale.status+': '+scale.weight+' '+scale.unit);
            }
        });
        scaleStream.on('error', function(err){
            scale.status = 'error';
        });
        // console.log('Scale Connected');
    } catch (e) {
        setTimeout(enableScale, 250); // retry until scale is ready, stream unable to connect while scale boots
        // console.log('Scale Retrying');
    }
}

function disableScale() {
    scale.weight = null; scale.status = 'disconnected'; scale.unit = null;
    if(socket) socket.send(JSON.stringify(scale));
    scaleStream.close();
    // console.log('Scale Disconnected');
}

// -----------------------------------------------------------------------------
