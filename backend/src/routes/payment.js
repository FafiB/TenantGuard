const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const router = express.Router();

// VULNERABILITY: Insecure payment processing
router.post('/process', auth, async (req, res) => {
    try {
        const { 
            cardNumber, 
            expiryDate, 
            cvv, 
            cardholderName, 
            amount, 
            plan,
            billingAddress 
        } = req.body;

        // VULNERABILITY: No input validation
        // VULNERABILITY: Store payment data in plain text
        const paymentData = {
            cardNumber,
            expiryDate,
            cvv,
            cardholderName,
            amount,
            billingAddress,
            processedAt: new Date(),
            // VULNERABILITY: Predictable transaction ID
            transactionId: `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            status: 'completed'
        };

        // VULNERABILITY: Store sensitive payment info without encryption
        const user = await User.findById(req.user._id);
        if (!user.paymentHistory) {
            user.paymentHistory = [];
        }
        user.paymentHistory.push(paymentData);
        await user.save();

        // VULNERABILITY: Update tenant with payment info in plain text
        const tenant = await Tenant.findById(req.user.tenantId);
        if (tenant) {
            tenant.paymentInfo = {
                cardNumber,
                expiryDate,
                cvv,
                cardholderName,
                billingAddress
            };
            tenant.plan = plan || 'premium';
            tenant.lastPayment = paymentData;
            await tenant.save();
        }

        // VULNERABILITY: Return sensitive payment data in response
        res.json({
            success: true,
            message: 'Payment processed successfully',
            transactionId: paymentData.transactionId,
            // VULNERABILITY: Expose payment details
            paymentDetails: paymentData,
            newPlan: plan || 'premium'
        });

    } catch (error) {
        // VULNERABILITY: Expose internal error details
        res.status(500).json({ 
            error: 'Payment processing failed',
            details: error.message,
            stack: error.stack
        });
    }
});

// VULNERABILITY: Expose payment history without proper authorization
router.get('/history', auth, async (req, res) => {
    try {
        // VULNERABILITY: Can access any user's payment history via query
        const userId = req.query.userId || req.user._id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // VULNERABILITY: Return full payment history including sensitive data
        res.json({
            paymentHistory: user.paymentHistory || [],
            totalSpent: (user.paymentHistory || []).reduce((sum, payment) => sum + (payment.amount || 0), 0)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// VULNERABILITY: Insecure refund processing
router.post('/refund', auth, async (req, res) => {
    try {
        const { transactionId, amount, reason } = req.body;

        // VULNERABILITY: No verification of transaction ownership
        // VULNERABILITY: No amount validation
        const refundData = {
            originalTransactionId: transactionId,
            refundAmount: amount,
            reason,
            processedAt: new Date(),
            refundId: `REF_${Date.now()}`,
            // VULNERABILITY: Auto-approve all refunds
            status: 'approved'
        };

        const user = await User.findById(req.user._id);
        if (!user.refundHistory) {
            user.refundHistory = [];
        }
        user.refundHistory.push(refundData);
        await user.save();

        res.json({
            success: true,
            message: 'Refund processed successfully',
            refundDetails: refundData
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// VULNERABILITY: Expose all payment data for admin
router.get('/admin/all-payments', auth, async (req, res) => {
    try {
        // VULNERABILITY: Weak admin check
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // VULNERABILITY: Return all payment data including sensitive info
        const users = await User.find({}).select('email paymentHistory refundHistory');
        const tenants = await Tenant.find({}).select('name paymentInfo lastPayment');

        res.json({
            userPayments: users,
            tenantPayments: tenants,
            totalRevenue: users.reduce((sum, user) => {
                return sum + (user.paymentHistory || []).reduce((userSum, payment) => userSum + (payment.amount || 0), 0);
            }, 0)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;