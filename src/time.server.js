"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// TimeServer
const net_1 = __importDefault(require("net"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const moment_1 = __importDefault(require("moment"));
const SESSION_KEY = '46FFA653'; // Same key used in client
class TimeServer {
    constructor(port) {
        this.port = port;
        this.server = net_1.default.createServer(this.handleConnection.bind(this));
    }
    start() {
        this.server.listen(this.port, () => {
            console.log(`TimeServer listening on port ${this.port}`);
        });
    }
    handleConnection(socket) {
        socket.on('data', data => {
            try {
                console.log('Received raw data:', data.toString()); // Log raw data
                const decrypted = crypto_js_1.default.AES.decrypt(data.toString(), SESSION_KEY).toString(crypto_js_1.default.enc.Utf8);
                console.log('Decrypted command:', decrypted); // Log decrypted command
                if (decrypted === 'time') {
                    const currentTime = (0, moment_1.default)().format();
                    console.info('currentTime before encryption: ', currentTime);
                    const encryptedTime = crypto_js_1.default.AES.encrypt(currentTime, SESSION_KEY).toString();
                    socket.write(encryptedTime);
                }
                else {
                    const encryptedResponse = crypto_js_1.default.AES.encrypt('Invalid request', SESSION_KEY).toString();
                    socket.write(encryptedResponse);
                }
            }
            catch (error) {
                console.error('Decryption error:', error.message);
                console.error('Raw data:', data.toString());
            }
        });
        socket.on('error', err => {
            console.error('Connection error:', err);
        });
    }
}
const timeServer = new TimeServer(12345);
timeServer.start();
