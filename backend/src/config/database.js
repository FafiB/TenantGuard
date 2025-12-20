const mongoose=require('mongoose');
require('dotenv').config();
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tenantguard', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected successfully');
    } catch (err) {
        console.error('connection failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB; 
