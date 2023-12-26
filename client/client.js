"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const readline_1 = __importDefault(require("readline"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const net_1 = __importDefault(require("net"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
let token = '';
const secretKey = process.env.SECRET_KEY || '46FFA653';
let userKey = ''; // To store the user-specific key
const SERVER_URL = 'http://localhost:12347'; // Change this to your server's URL
const TIME_SERVER_URL = 'http://localhost:12345';
// Use the token
function authenticate(username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post(`${SERVER_URL}/authenticate`, { username, password });
            return response.data;
        }
        catch (error) {
            console.error('Authentication failed:', error.response.data);
            return null;
        }
    });
}
function signUp(username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post(`${SERVER_URL}/signup`, { username, password });
            console.log('Sign up successful:', response.data.message);
            return true;
        }
        catch (error) {
            console.error('Sign up failed:', error.response.data);
            return false;
        }
    });
}
//TODO:Security: When dealing with keys, ensure all communication is encrypted and secure. Use HTTPS for all server-client communications.
// Key Generation: Use a strong cryptographic library to generate keys. They should be of adequate length and complexity to ensure security.
// Logging: Implement logging on the server side to track key update activities. This should include who performed the update, when, and what changes were made.
// Notifications: Depending on your requirements, you may want to notify administrators or users when keys are updated. This could be done via email, logging, or another mechanism.
// Error Handling and Validation: Robust error handling and validation are crucial, especially when dealing with authentication and authorization.
function getUserIdFromToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secretKey);
        console.log("decoded: ", decoded);
        //@ts-ignore
        return decoded.userId; // Replace 'userId' with the actual key used in your JWT payload
    }
    catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}
function updateServerKey() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            console.log('No JWT token found. Please authenticate first.');
            return;
        }
        try {
            const userId = getUserIdFromToken(token);
            const response = yield axios_1.default.post(`${SERVER_URL}/updateServerKey`, { userId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Server key updated:', response.data);
        }
        catch (error) {
            console.error('Error updating server key:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
    });
}
function updateClientKey() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            console.log('No JWT token found. Please authenticate first.');
            return;
        }
        try {
            const userId = getUserIdFromToken(token);
            const response = yield axios_1.default.post(`${SERVER_URL}/updateClientKey`, { userId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Client key updated:', response.data);
        }
        catch (error) {
            console.error('Error updating client key:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
    });
}
function getCurrentTime() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(`${TIME_SERVER_URL}/time`); // Replace with your actual time server URL
            console.log('Current time:', response.data);
        }
        catch (error) {
            console.error('Failed to get current time:', error.message);
        }
    });
}
function keyUpdateOptions() {
    rl.question('Update server key or client key? (server/client): ', answer => {
        switch (answer) {
            case 'client':
                updateClientKey();
                break;
            case 'server':
                updateServerKey();
                break;
            case 'time':
                getCurrentTime();
                break;
            default:
                console.log('Invalid option');
                keyUpdateOptions();
                break;
        }
    });
}
function main() {
    rl.question('Do you want to login or sign up? (login/signup): ', choice => {
        switch (choice) {
            case 'signup':
                promptSignUp();
                break;
            case 'login':
                promptLogin(); // This will lead to the integrated menu after successful login
                break;
            default:
                console.log('Invalid choice, please type login or signup');
                main();
                break;
        }
    });
}
let timeServerClient = null; // Global variable to keep track of the time server connection
const sessionKey = '46FFA653';
function connectToTimeServer() {
    timeServerClient = new net_1.default.Socket();
    timeServerClient.connect(12345, '127.0.0.1', () => {
        console.log('Connected to Time Server');
        waitForTimeServerCommand();
    });
    timeServerClient.on('data', (data) => {
        console.log('Received encrypted data:', data.toString()); // Log encrypted data
        const decrypted = crypto_js_1.default.AES.decrypt(data.toString(), sessionKey).toString(crypto_js_1.default.enc.Utf8);
        console.log('Received decrypted: ', decrypted);
        waitForTimeServerCommand();
    });
    timeServerClient.on('close', () => {
        console.log('Connection closed');
        timeServerClient = null;
        main(); // Return to the main menu
    });
}
function waitForTimeServerCommand() {
    rl.question('Enter command for Time Server (time/exit): ', command => {
        if (command === 'time') {
            const encrypted = crypto_js_1.default.AES.encrypt('time', userKey).toString();
            timeServerClient.write(encrypted);
        }
        else if (command === 'exit') {
            timeServerClient.destroy();
            console.log('Returning to main menu...');
            main();
        }
        else {
            console.log('Invalid command');
            waitForTimeServerCommand();
        }
    });
}
function getUserKey() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(`${SERVER_URL}/getUserKey`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            userKey = response.data.clientKey; // Store the user key
        }
        catch (error) {
            console.error('Error fetching user key:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
    });
}
function promptLogin() {
    rl.question('Username: ', username => {
        rl.question('Password: ', (password) => __awaiter(this, void 0, void 0, function* () {
            const authResponse = yield authenticate(username, password);
            if (authResponse && authResponse.ticket) {
                console.log('Authentication Successful. Your ticket:', authResponse.ticket);
                token = authResponse.ticket; // Store the token
                yield getUserKey();
                showIntegratedMenu();
            }
            else {
                console.log('Authentication Failed');
                main();
            }
        }));
    });
}
function promptSignUp() {
    return __awaiter(this, void 0, void 0, function* () {
        rl.question('Choose a Username: ', username => {
            rl.question('Choose a Password: ', (password) => __awaiter(this, void 0, void 0, function* () {
                const success = yield signUp(username, password);
                if (success) {
                    promptLogin();
                }
                else {
                    rl.close();
                }
            }));
        });
    });
}
function showIntegratedMenu() {
    console.log("\nMenu Options:");
    console.log("1: Update Server Key");
    console.log("2: Update Client Key");
    console.log("3: Connect to Time Server");
    console.log("4: Exit");
    rl.question('Choose an option: ', choice => {
        switch (choice) {
            case '1':
                updateServerKey();
                break;
            case '2':
                updateClientKey();
                break;
            case '3':
                connectToTimeServer(); // Connect to Time Server and handle time server commands
                break;
            case '4':
                console.log('Exiting...');
                rl.close();
                break;
            default:
                console.log('Invalid choice, please enter a valid option');
                showIntegratedMenu();
                break;
        }
    });
}
main();
