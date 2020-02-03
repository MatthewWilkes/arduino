(function() {
  'use strict';

  hterm.defaultStorage = new lib.Storage.Local();

  var port;

  let textEncoder = new TextEncoder();

  
  
  
  let t = new hterm.Terminal();
  t.onTerminalReady = () => {
    console.log('Terminal ready.');
    let io = t.io.push();

    io.onVTKeystroke = str => {
      if (port !== undefined) {
        port.send(textEncoder.encode(str)).catch(error => {
          t.io.println('Send error: ' + error);
        });
      }
    };

    io.callback = io.print,
    
    io.sendString = str => {
      if (port !== undefined) {
        port.send(textEncoder.encode(str)).catch(error => {
          t.io.println('Send error: ' + error);
        });
      }
    };
  };

  document.addEventListener('DOMContentLoaded', event => {
    let connectButton = document.querySelector('#connect');
    let runButton = document.querySelector('#run');
    let saveButton = document.querySelector('#save');
    let loadButton = document.querySelector('#load');

    t.decorate(document.querySelector('#terminal'));
    t.setWidth(80);
    t.setHeight(24);
    t.installKeyboard();

    function connect() {
      t.io.println('Connecting to ' + port.device_.productName + '...');
      port.connect().then(() => {
        console.log(port);
        t.io.println('Connected.');
        connectButton.textContent = 'Disconnect';
        port.onReceive = data => {
          let textDecoder = new TextDecoder();
          t.io.callback(textDecoder.decode(data));
        }
        port.onReceiveError = error => {
          t.io.println('Receive error: ' + error);
        };
      }, error => {
        t.io.println('Connection error: ' + error);
      });
    };

    connectButton.addEventListener('click', function() {
      if (port) {
        port.disconnect();
        connectButton.textContent = 'Connect';
        port = null;
      } else {
        serial.requestPort().then(selectedPort => {
          port = selectedPort;
          connect();
        }).catch(error => {
          t.io.println('Connection error: ' + error);
        });
      }
    });

    runButton.addEventListener('click', function() {
      t.io.println('Running app');
      var cmd = {"cmd": "exec_app", app: document.getElementById("appname").value};
      t.io.sendString(JSON.stringify(cmd)+"\r\n");
    });

    
    saveButton.addEventListener('click', function() {
      t.io.println('Saving file');
      var cmd = {"cmd": "write", path: document.getElementById("filename").value, data: document.getElementById("filecontents").value};
      t.io.sendString(JSON.stringify(cmd)+"\r\n");
    });

    loadButton.addEventListener('click', function() {
      t.io.println('Loading file');
      var cmd = {"cmd": "read", path: document.getElementById("filename").value};
      window.data = "";
      t.io.callback = str => {
        window.data += str;
        console.log("received: " + str);
        console.log("to process: " + window.data);
        try{
          var strLines = window.data.split("\n");
          for (var i in strLines) {
            //alert(strLines[i]);
            var obj = JSON.parse(strLines[i]);
            if (obj.ok) {
              document.getElementById("filecontents").value = obj.result;
              t.io.callback = t.io.print;
            }
          }
          
        } catch(e) {
          console.log(e);
        }
      };
      t.io.sendString(JSON.stringify(cmd)+"\r\n");
    });

    
    serial.getPorts().then(ports => {
      if (ports.length == 0) {
        t.io.println('No devices found.');
      } else {
        port = ports[0];
        connect();
      }
    });
  });
})();
