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
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
const SERVER_URL = 'http://localhost:12347'; // Change this to your server's URL
function authenticate(username, password) {
    return axios_1.default.post(`${SERVER_URL}/authenticate`, { username, password })
        .then(response => response.data)
        .catch(error => {
        console.error('Authentication failed:', error.message);
        return null;
    });
}
function updateServerKey() {
    console.log('Server key update logic not implemented yet.');
    // Implement server key update logic here
}
function updateClientKey() {
    console.log('Client key update logic not implemented yet.');
    // Implement client key update logic here
}
function main() {
    rl.question('Username: ', username => {
        rl.question('Password: ', (password) => __awaiter(this, void 0, void 0, function* () {
            const authResponse = yield authenticate(username, password);
            if (authResponse && authResponse.ticket) {
                console.log('Authentication Successful:', authResponse);
                rl.question('Update server key or client key? (server/client): ', answer => {
                    if (answer === 'server') {
                        updateServerKey();
                    }
                    else if (answer === 'client') {
                        updateClientKey();
                    }
                    else {
                        console.log('Invalid option');
                    }
                    rl.close();
                });
            }
            else {
                console.log('Authentication Failed');
                rl.close();
            }
        }));
    });
}
main();
