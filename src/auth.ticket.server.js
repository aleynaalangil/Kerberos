"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_1 = __importDefault(require("mongoose"));
const crypto = __importStar(require("crypto"));
// Connect to MongoDB
mongoose_1.default.connect("mongodb+srv://aleynaalangil:aleynaalangil@cluster0.ycjkwii.mongodb.net/?retryWrites=true&w=majority");
// MongoDB models (simplified)
const User = mongoose_1.default.model('User', new mongoose_1.default.Schema({
    username: String,
    role: String,
    userId: mongoose_1.default.Types.ObjectId,
    passwordHash: String,
    salt: String
}));
const Ticket = mongoose_1.default.model('Ticket', new mongoose_1.default.Schema({
    userId: mongoose_1.default.Types.ObjectId,
    token: String,
    expiresAt: Date
}));
const Key = mongoose_1.default.model('Key', new mongoose_1.default.Schema({
    keyType: String, // 'client' or 'server'
    keyValue: String,
    userId: mongoose_1.default.Types.ObjectId
}));
class AuthServer {
    constructor(port) {
        this.port = port;
        this.app = (0, express_1.default)();
        this.app.use(express_1.default.json());
        this.setupRoutes();
    }
    start() {
        this.app.listen(this.port, () => {
            console.log(`AuthServer listening on port ${this.port}`);
        });
    }
    setupRoutes() {
        this.app.post('/authenticate', this.handleAuthenticate.bind(this));
        this.app.post('/signup', this.handleSignUp.bind(this)); // New sign-up endpoint
        this.app.post('/updateServerKey', this.handleUpdateServerKey.bind(this));
        this.app.post('/updateClientKey', this.handleUpdateClientKey.bind(this));
        this.app.get('/getUserToken', this.handleGetUserToken.bind(this));
        this.app.get('/getUserKey', this.handleGetUserKey.bind(this));
    }
    // private async handleAuthenticate(req: express.Request, res: express.Response): Promise<void> {
    //     const { username, password } = req.body;
    //     const secretKey: any = process.env.SECRET_KEY || '46FFA653';
    //
    //     try {
    //         const user = await this.getUserByUsername(username);
    //
    //         if (!user) {
    //             res.status(401).json({ error: 'Authentication failed' });
    //             return;
    //         }
    //
    //         const match = await bcrypt.compare(password, user.passwordHash);
    //
    //         if (match) {
    //             const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
    //             await Ticket.updateOne({ userId: user._id }, { token, expiresAt: new Date(Date.now() + 3600000) });
    //
    //             res.json({ ticket: token });
    //         } else {
    //             res.status(401).json({ error: 'Authentication failed' });
    //         }
    //     } catch (error) {
    //         res.status(500).json({ error: 'Internal server error' });
    //     }
    // }
    // private async handleAuthenticate(req: express.Request, res: express.Response): Promise<void> {
    //     const { username, password } = req.body;
    //     const secretKey:any = process.env.SECRET_KEY
    //
    //     try {
    //         // Replace with your method to get the user details (e.g., from a database)
    //         const user = await this.getUserByUsername(username);
    //         const userId = user.userId;
    //
    //         if (!user) {
    //             return res.status(401).json({ error: 'Authentication failed' });
    //         }
    //
    //         // Verify the password with bcrypt
    //         const match = await bcrypt.compare(password, user.passwordHash);
    //
    //         if (match) {
    //             // Create a JWT token
    //             const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
    //             Ticket.updateOne({
    //                 userId:userId
    //                 },{
    //                 ticket:token
    //                 })
    //             // Send the token as the ticket
    //             res.json({ ticket: token });
    //         } else {
    //             res.status(401).json({ error: 'Authentication failed' });
    //         }
    //     } catch (error) {
    //         res.status(500).json({ error: 'Internal server error' });
    //     }
    // }
    // private async handleSignUp(req: express.Request, res: express.Response): Promise<void> {
    //     const {username, password} = req.body;
    //
    //     try {
    //         // Check if the user already exists
    //         const existingUser = await User.findOne({username}).exec();
    //         if (existingUser) {
    //             res.status(400).json({error: 'Username already exists'});
    //             return;
    //         }
    //
    //         // Hash the password
    //         const salt = await bcrypt.genSalt(10);
    //         const passwordHash = await bcrypt.hash(password, salt);
    //
    //         // Create a new user and save to the database
    //         const newUser = new User({username, passwordHash, salt});
    //         await newUser.save();
    //
    //         res.status(201).json({message: 'User successfully created'});
    //     } catch (error) {
    //         res.status(500).json({error: 'Internal server error'});
    //     }
    // }
    handleGetUserToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Authenticate the user request
            // Retrieve the JWT token for the user from MongoDB
            // Send the JWT token in the response
        });
    }
    handleSignUp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            console.log('Signing up user:', username); // Debug
            const secretKey = process.env.SECRET_KEY || '46FFA653';
            try {
                console.log('Checking if user already exists'); // Debug
                const existingUser = yield User.findOne({ username }).exec();
                if (existingUser) {
                    console.log('User already exists'); // Debug
                    res.status(400).json({ error: 'Username already exists' });
                    return;
                }
                console.log('Hashing password'); // Debug
                const salt = yield bcrypt_1.default.genSalt(10);
                const passwordHash = yield bcrypt_1.default.hash(password, salt);
                console.log('Creating new user'); // Debug
                const newUser = new User({ username, passwordHash, salt });
                const savedUser = yield newUser.save();
                const clientKey = crypto.randomBytes(32).toString('hex'); // Generate a 256-bit key
                yield Key.create({ keyType: 'client', keyValue: clientKey, userId: savedUser._id });
                console.log('Generating JWT token'); // Debug
                const token = jsonwebtoken_1.default.sign({ userId: savedUser._id }, secretKey, { expiresIn: '1h' });
                console.log('Saving ticket'); // Debug
                const newTicket = new Ticket({ userId: savedUser._id, token, expiresAt: new Date(Date.now() + 3600000) });
                yield newTicket.save();
                console.log('User signed up successfully'); // Debug
                res.status(201).json({ message: 'User successfully created', ticket: token });
            }
            catch (error) {
                console.error('Error in handleSignUp:', error); // Debug
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    handleAuthenticate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            console.log('Authenticating user:', username); // Debug
            const secretKey = process.env.SECRET_KEY || '46FFA653';
            try {
                console.log('Retrieving user from database'); // Debug
                const user = yield this.getUserByUsername(username);
                if (!user) {
                    console.log('User not found'); // Debug
                    res.status(401).json({ error: 'User not found' });
                    return;
                }
                const userKey = yield Key.findOne({ userId: user._id, keyType: 'client' });
                if (!userKey) {
                    // Generate and store key if not already present
                    const clientKey = crypto.randomBytes(32).toString('hex');
                    yield Key.create({ keyType: 'client', keyValue: clientKey, userId: user._id });
                }
                console.log('Comparing password'); // Debug
                const match = yield bcrypt_1.default.compare(password, user.passwordHash);
                if (match) {
                    console.log('Password matched, generating token'); // Debug
                    const token = jsonwebtoken_1.default.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
                    console.log('Updating ticket information'); // Debug
                    yield Ticket.updateOne({ userId: user._id }, { token, expiresAt: new Date(Date.now() + 3600000) });
                    console.log('Authentication successful'); // Debug
                    res.json({ ticket: token });
                }
                else {
                    console.log('Password did not match'); // Debug
                    res.status(401).json({ error: 'Incorrect password' });
                }
            }
            catch (error) {
                console.error('Error in handleAuthenticate:', error); // Debug
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    handleUpdateServerKey(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
            if (!token) {
                res.status(401).json({ error: 'No token provided' });
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY || 'default_secret');
                const userId = decoded.userId;
                const user = yield User.findById(userId);
                if (!user || user.role !== 'admin') {
                    res.status(403).json({ error: 'Unauthorized' });
                }
                const newServerKey = crypto.randomBytes(64).toString('hex');
                yield Key.create({ keyType: 'server', keyValue: newServerKey, userId });
                res.json({ message: 'Server key updated successfully', newServerKey });
            }
            catch (error) {
                console.error('Error in handleUpdateServerKey:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    handleUpdateClientKey(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
            if (!token) {
                res.status(401).json({ error: 'No token provided' });
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY || 'default_secret');
                const userId = decoded.userId;
                const user = yield User.findById(userId);
                if (!user) {
                    res.status(403).json({ error: 'Unauthorized' });
                }
                const newClientKey = crypto.randomBytes(64).toString('hex');
                yield Key.create({ keyType: 'client', keyValue: newClientKey, userId });
                res.json({ message: 'Client key updated successfully', newClientKey });
            }
            catch (error) {
                console.error('Error in handleUpdateClientKey:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    getUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = User.findOne({ username });
            if (!user) {
                return 'user not found!';
            }
            return user;
        });
    }
    handleGetUserKey(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
            const secretKey = process.env.SECRET_KEY || '46FFA653';
            if (!token) {
                res.status(401).json({ error: 'No token provided' });
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, secretKey);
                const userKey = yield Key.findOne({ userId: decoded.userId, keyType: 'client' });
                if (userKey) {
                    res.json({ clientKey: userKey.keyValue });
                }
                else {
                    res.status(404).json({ error: 'Key not found' });
                }
            }
            catch (error) {
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
}
const authServer = new AuthServer(12347);
authServer.start();
