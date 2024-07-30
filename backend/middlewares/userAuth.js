const jwt = require("jsonwebtoken");
const User = require('../models/userModel');
require('dotenv').config();



const userAuthenticate = async (req, res, next) => {
    try {
        console.log("from Auth");
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(420).json({ message: 'Token not provided' });
        }

        const token = authHeader.split(' ')[1];
        console.log("token >>", token);

        const verifyToken = jwt.verify(token, process.env.SECRETKEY);
        const rootUser = await User.findOne({ _id: verifyToken._id, "tokens.token": token });

        if (!rootUser) {
            console.log('User not found');
            return res.status(420).json({ message: 'User not found' });
        }

        req.token = token;
        req.rootUser = rootUser;
        req.userID = rootUser._id;

        next();

    } catch (error) {
        return res.status(420).json({ message: 'Please Log In First' });
    }
}


module.exports = userAuthenticate;