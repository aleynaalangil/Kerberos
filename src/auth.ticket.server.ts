import express from 'express';
import jwt, {JwtPayload} from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import * as crypto from "crypto";

// Connect to MongoDB
mongoose.connect("mongodb+srv://aleynaalangil:aleynaalangil@cluster0.ycjkwii.mongodb.net/?retryWrites=true&w=majority");


const User = mongoose.model(
    'User',
    new mongoose.Schema({
        username: String,
        role: String,
        userId: mongoose.Types.ObjectId,
        passwordHash: String,
        salt: String
    }));
const Ticket = mongoose.model(
    'Ticket',
    new mongoose.Schema({
        userId: mongoose.Types.ObjectId,
        token: String,
        expiresAt: Date
    }));

const Key = mongoose.model(
    'Key',
    new mongoose.Schema(
        {
            keyType: String,
            keyValue: String,
            userId: mongoose.Types.ObjectId
        }
    )
)

class AuthServer {
    private app: express.Application;

    constructor(private port: number) {
        this.app = express();
        this.app.use(express.json());
        this.setupRoutes();
    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`AuthServer listening on port ${this.port}`);
        });
    }

    private setupRoutes(): void {
        this.app.post('/authenticate', this.handleAuthenticate.bind(this));
        this.app.post('/signup', this.handleSignUp.bind(this)); // New sign-up endpoint
        this.app.post('/updateServerKey', this.handleUpdateServerKey.bind(this));
        this.app.post('/updateClientKey', this.handleUpdateClientKey.bind(this));
        this.app.get('/getUserKey', this.handleGetUserKey.bind(this));


    }

    private async handleSignUp(req: express.Request, res: express.Response): Promise<void> {
        const {username, password} = req.body;

        console.log('Signing up user:', username); // Debug

        const secretKey: any = process.env.SECRET_KEY || '46FFA653';

        try {
            console.log('Checking if user already exists'); // Debug
            const existingUser = await User.findOne({username}).exec();
            if (existingUser) {
                console.log('User already exists'); // Debug
                res.status(400).json({error: 'Username already exists'});
                return;
            }

            console.log('Hashing password'); // Debug
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            console.log('Creating new user'); // Debug
            const newUser = new User({username, passwordHash, salt});
            const savedUser = await newUser.save();
            const clientKey = crypto.randomBytes(32).toString('hex'); // Generate a 256-bit key
            await Key.create({ keyType: 'client', keyValue: clientKey, userId: savedUser._id });

            console.log('Generating JWT token'); // Debug
            const token = jwt.sign({userId: savedUser._id}, secretKey, {expiresIn: '1h'});

            console.log('Saving ticket'); // Debug
            const newTicket = new Ticket({userId: savedUser._id, token, expiresAt: new Date(Date.now() + 3600000)});
            await newTicket.save();

            console.log('User signed up successfully'); // Debug
            res.status(201).json({message: 'User successfully created', ticket: token});
        } catch (error) {
            console.error('Error in handleSignUp:', error); // Debug
            res.status(500).json({error: 'Internal server error'});
        }
    }

    private async handleAuthenticate(req: express.Request, res: express.Response): Promise<void> {
        const {username, password} = req.body;
        console.log('Authenticating user:', username); // Debug


        const secretKey: any = process.env.SECRET_KEY || '46FFA653';

        try {
            console.log('Retrieving user from database'); // Debug
            const user = await this.getUserByUsername(username);
            if (!user) {
                console.log('User not found'); // Debug
                res.status(401).json({error: 'User not found'});
                return;
            }
            const userKey = await Key.findOne({ userId: user._id, keyType: 'client' });
            if (!userKey) {
                // Generate and store key if not already present
                const clientKey = crypto.randomBytes(32).toString('hex');
                await Key.create({ keyType: 'client', keyValue: clientKey, userId: user._id });
            }



            console.log('Comparing password'); // Debug
            const match = await bcrypt.compare(password, user.passwordHash);

            if (match) {
                console.log('Password matched, generating token'); // Debug
                const token = jwt.sign({userId: user._id}, secretKey, {expiresIn: '1h'});

                console.log('Updating ticket information'); // Debug
                await Ticket.updateOne({userId: user._id}, {token, expiresAt: new Date(Date.now() + 3600000)});

                console.log('Authentication successful'); // Debug
                res.json({ticket: token});
            } else {
                console.log('Password did not match'); // Debug
                res.status(401).json({error: 'Incorrect password'});
            }
        } catch (error) {
            console.error('Error in handleAuthenticate:', error); // Debug
            res.status(500).json({error: 'Internal server error'});
        }
    }

    private async handleUpdateServerKey(req: express.Request, res: express.Response): Promise<void> {
        const token:any = req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(401).json({ error: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY || 'default_secret') as JwtPayload;
            const userId = decoded.userId;

            const user = await User.findById(userId);
            if (!user || user.role !== 'admin') {
                res.status(403).json({ error: 'Unauthorized' });
            }

            const newServerKey = crypto.randomBytes(64).toString('hex');
            await Key.create({ keyType: 'server', keyValue: newServerKey, userId });

            res.json({ message: 'Server key updated successfully', newServerKey });
        } catch (error) {
            console.error('Error in handleUpdateServerKey:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    private async handleUpdateClientKey(req: express.Request, res: express.Response): Promise<void> {
        const token: any = req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(401).json({ error: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY || 'default_secret') as JwtPayload;
            const userId = decoded.userId;

            const user = await User.findById(userId);
            if (!user) {
                res.status(403).json({ error: 'Unauthorized' });
            }

            const newClientKey = crypto.randomBytes(64).toString('hex');
            await Key.create({ keyType: 'client', keyValue: newClientKey, userId });

            res.json({ message: 'Client key updated successfully', newClientKey });
        } catch (error) {
            console.error('Error in handleUpdateClientKey:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }


    private async getUserByUsername(username: string): Promise<any> {
        const user = User.findOne({username});
        if (!user) {
            return 'user not found!'
        }
        return user;
    }
    private async handleGetUserKey(req: express.Request, res: express.Response): Promise<void> {
        const token:any = req.headers.authorization?.split(' ')[1];
        const secretKey: any = process.env.SECRET_KEY || '46FFA653';

        if (!token) {
            res.status(401).json({ error: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, secretKey) as JwtPayload;
            const userKey = await Key.findOne({ userId: decoded.userId, keyType: 'client' });
            if (userKey) {
                res.json({ clientKey: userKey.keyValue });
            } else {
                res.status(404).json({ error: 'Key not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

const authServer = new AuthServer(12347);
authServer.start();
