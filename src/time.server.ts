// TimeServer
import net from 'net';
import CryptoJS from 'crypto-js';
import moment from "moment";

const SESSION_KEY = '46FFA653'; // Same key used in client

class TimeServer {
    private server: net.Server;

    constructor(private port: number) {
        this.server = net.createServer(this.handleConnection.bind(this));
    }

    public start(): void {
        this.server.listen(this.port, () => {
            console.log(`TimeServer listening on port ${this.port}`);
        });
    }

    private handleConnection(socket: net.Socket): void {
        socket.on('data', data => {
            try {
                console.log('Received raw data:', data.toString()); // Log raw data
                const decrypted = CryptoJS.AES.decrypt(data.toString(), SESSION_KEY).toString(CryptoJS.enc.Utf8);
                console.log('Decrypted command:', decrypted); // Log decrypted command


                if (decrypted === 'time') {
                    const currentTime = moment().format();
                    console.info('currentTime before encryption: ', currentTime)
                    const encryptedTime = CryptoJS.AES.encrypt(currentTime, SESSION_KEY).toString();
                    socket.write(encryptedTime);
                } else {
                    const encryptedResponse = CryptoJS.AES.encrypt('Invalid request', SESSION_KEY).toString();
                    socket.write(encryptedResponse);
                }
            } catch (error:any) {
                console.error('Decryption error:', error.message);
                console.error('Raw data:', data.toString());            }
        });

        socket.on('error', err => {
            console.error('Connection error:', err);
        });
    }
}

const timeServer = new TimeServer(12345);
timeServer.start();
