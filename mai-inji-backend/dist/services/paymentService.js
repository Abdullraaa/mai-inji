"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePayment = initializePayment;
exports.verifyPayment = verifyPayment;
exports.refundPayment = refundPayment;
const axios_1 = __importDefault(require("axios"));
const connection_1 = __importDefault(require("../db/connection"));
const types_1 = require("../types");
const uuid_1 = require("uuid");
const audit_1 = require("../middleware/audit");
const types_2 = require("../types");
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
async function initializePayment(orderId, amount, email) {
    try {
        const paymentId = (0, uuid_1.v4)();
        // Store payment record as INITIATED
        await connection_1.default.query(`INSERT INTO payments (id, order_id, provider, provider_reference, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6)`, [paymentId, orderId, types_1.PaymentProvider.PAYSTACK, null, amount, types_1.PaymentStatus.INITIATED]);
        // Call Paystack API
        const response = await axios_1.default.post(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
            email,
            amount,
            reference: `MAI-${orderId}-${Date.now()}`,
            metadata: {
                order_id: orderId,
                payment_id: paymentId,
            },
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
            },
        });
        if (!response.data.status) {
            throw new Error(response.data.message);
        }
        // Update payment with Paystack reference
        await connection_1.default.query('UPDATE payments SET provider_reference = $1 WHERE id = $2', [response.data.data.reference, paymentId]);
        await (0, audit_1.logAudit)('PAYMENT', paymentId, types_2.AuditAction.CREATE, null, types_1.PaymentStatus.INITIATED, types_2.ActorType.SYSTEM, undefined, 'Payment initialized with Paystack');
        return {
            paymentId,
            authorizationUrl: response.data.data.authorization_url,
            reference: response.data.data.reference,
        };
    }
    catch (error) {
        console.error('Paystack initialization error:', error);
        throw error;
    }
}
async function verifyPayment(reference) {
    try {
        const response = await axios_1.default.get(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
            },
        });
        if (!response.data.status) {
            throw new Error(response.data.message);
        }
        const paymentData = response.data.data;
        const isSuccessful = paymentData.status === 'success';
        // Find and update payment record
        const paymentResult = await connection_1.default.query('SELECT * FROM payments WHERE provider_reference = $1', [reference]);
        if (!paymentResult.rows.length) {
            console.error('Payment record not found:', reference);
            return null;
        }
        const payment = paymentResult.rows[0];
        const newStatus = isSuccessful ? types_1.PaymentStatus.SUCCESS : types_1.PaymentStatus.FAILED;
        await connection_1.default.query(`UPDATE payments 
       SET status = $1, raw_payload = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`, [newStatus, JSON.stringify(paymentData), payment.id]);
        await (0, audit_1.logAudit)('PAYMENT', payment.id, types_2.AuditAction.UPDATE, types_1.PaymentStatus.INITIATED, newStatus, types_2.ActorType.SYSTEM, undefined, `Paystack verification: ${paymentData.status}`);
        return {
            orderId: payment.order_id,
            paymentId: payment.id,
            status: newStatus,
            isSuccessful,
        };
    }
    catch (error) {
        console.error('Paystack verification error:', error);
        throw error;
    }
}
async function refundPayment(paymentId, reason) {
    try {
        const paymentResult = await connection_1.default.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
        if (!paymentResult.rows.length) {
            throw new Error('Payment not found');
        }
        const payment = paymentResult.rows[0];
        if (payment.provider !== types_1.PaymentProvider.PAYSTACK) {
            // Handle cash refunds differently (manual process)
            await connection_1.default.query('UPDATE payments SET status = $1 WHERE id = $2', [types_1.PaymentStatus.REFUNDED, paymentId]);
            return;
        }
        // Call Paystack refund API
        const response = await axios_1.default.post(`${PAYSTACK_BASE_URL}/refund`, {
            transaction: payment.provider_reference,
            amount: payment.amount,
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
            },
        });
        // Update payment status
        await connection_1.default.query('UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [types_1.PaymentStatus.REFUNDED, paymentId]);
        await (0, audit_1.logAudit)('PAYMENT', paymentId, types_2.AuditAction.REFUND, types_1.PaymentStatus.SUCCESS, types_1.PaymentStatus.REFUNDED, types_2.ActorType.ADMIN, undefined, reason || 'Payment refunded');
        return response.data;
    }
    catch (error) {
        console.error('Refund error:', error);
        throw error;
    }
}
//# sourceMappingURL=paymentService.js.map