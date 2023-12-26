import axios from 'axios';
import readline from 'readline';
import CryptoJS from 'crypto-js';
import net from 'net';
import jwt from "jsonwebtoken";


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
let token = '';
const secretKey: any = process.env.SECRET_KEY || '46FFA653';
let userKey = ''; // To store the user-specific key


const SERVER_URL = 'http://localhost:12347';// Change this to your server's URL
const TIME_SERVER_URL = 'http://localhost:12345';


async function authenticate(username: string, password: string) {
    try {
        const response = await axios.post(`${SERVER_URL}/authenticate`, {username, password});
        return response.data;
    } catch (error: any) {
        console.error('Authentication failed:', error.response.data);
        return null;
    }
}

async function signUp(username: string, password: string) {
    try {
        const response = await axios.post(`${SERVER_URL}/signup`, {username, password});
        console.log('Sign up successful:', response.data.message);
        return true;
    } catch (error: any) {
        console.error('Sign up failed:', error.response.data);
        return false;
    }
}
function getUserIdFromToken(token:any) {
    try {
        const decoded = jwt.verify(token, secretKey);
        console.log("decoded: ", decoded)
        //@ts-ignore
        return decoded.userId; // Replace 'userId' with the actual key used in your JWT payload
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

async function updateServerKey() {
    if (!token) {
        console.log('No JWT token found. Please authenticate first.');
        return;
    }
    try {
        const userId = getUserIdFromToken(token);
        const response = await axios.post(`${SERVER_URL}/updateServerKey`, { userId }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Server key updated:', response.data);
    } catch (error:any) {
        console.error('Error updating server key:', error.response?.data || error.message);
    }
}

async function updateClientKey() {
    if (!token) {
        console.log('No JWT token found. Please authenticate first.');
        return;
    }
    try {
        const userId = getUserIdFromToken(token);
        const response = await axios.post(`${SERVER_URL}/updateClientKey`, { userId }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Client key updated:', response.data);
    } catch (error:any) {
        console.error('Error updating client key:', error.response?.data || error.message);
    }
}
async function getCurrentTime() {
    try {
        const response = await axios.get(`${TIME_SERVER_URL}/time`); // Replace with your actual time server URL
        console.log('Current time:', response.data);
    } catch (error:any) {
        console.error('Failed to get current time:', error.message);
    }
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


let timeServerClient : any = null;
const sessionKey = '46FFA653';

function connectToTimeServer() {
    timeServerClient = new net.Socket();
    timeServerClient.connect(12345, '127.0.0.1', () => {
        console.log('Connected to Time Server');
        waitForTimeServerCommand();
    });

    timeServerClient.on('data', (data: any) => {
        console.log('Received encrypted data:', data.toString()); // Log encrypted data
        const decrypted = CryptoJS.AES.decrypt(data.toString(), sessionKey).toString(CryptoJS.enc.Utf8);
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
            const encrypted = CryptoJS.AES.encrypt('time', userKey).toString();
            timeServerClient.write(encrypted);
        } else if (command === 'exit') {
            timeServerClient.destroy();
            console.log('Returning to main menu...');
            main();
        } else {
            console.log('Invalid command');
            waitForTimeServerCommand();
        }
    });
}

async function getUserKey() {
    try {
        const response = await axios.get(`${SERVER_URL}/getUserKey`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        userKey = response.data.clientKey; // Store the user key
    } catch (error: any) {
        console.error('Error fetching user key:', error.response?.data || error.message);
    }
}


function promptLogin() {
    rl.question('Username: ', username => {
        rl.question('Password: ', async password => {
            const authResponse = await authenticate(username, password);
            if (authResponse && authResponse.ticket) {
                console.log('Authentication Successful. Your ticket:', authResponse.ticket);
                token = authResponse.ticket; // Store the token
                await getUserKey();
                showIntegratedMenu();
            } else {
                console.log('Authentication Failed');
                main();
            }
        });
    });
}


async function promptSignUp() {
    rl.question('Choose a Username: ', username => {
        rl.question('Choose a Password: ', async password => {
            const success = await signUp(username, password);
            if (success) {
                promptLogin();
            } else {
                rl.close();
            }
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
                connectToTimeServer();
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
