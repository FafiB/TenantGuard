const jwt=require('jsonwebtoken');
require('dotenv').config();
const User=require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const auth=async(req,res,next)=>{
    try{
        const token=req.header('Authorization').replace('Bearer ','');
    if (!token) {
            return res.status(401).json({ error: 'No token available' });
    }
            const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
         if (!user) {
            return res.status(401).json({ error: 'Invalid token. User not found.' });
        }
        req.user = user;
        req.token = token;
        next();
    } catch(err){
        res.status(401).json({ error: 'authentication failed.' });
    }
}
        
   module.exports = auth;