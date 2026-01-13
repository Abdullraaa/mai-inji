"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = exports.ActorType = exports.PaymentStatus = exports.PaymentProvider = exports.FulfillmentType = exports.UserRole = exports.OrderStatus = void 0;
// Order status enum
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["CREATED"] = "CREATED";
    OrderStatus["PAYMENT_PENDING"] = "PAYMENT_PENDING";
    OrderStatus["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    OrderStatus["PAID"] = "PAID";
    OrderStatus["ACCEPTED"] = "ACCEPTED";
    OrderStatus["PREPARING"] = "PREPARING";
    OrderStatus["READY"] = "READY";
    OrderStatus["READY_FOR_PICKUP"] = "READY_FOR_PICKUP";
    OrderStatus["OUT_FOR_DELIVERY"] = "OUT_FOR_DELIVERY";
    OrderStatus["COMPLETED"] = "COMPLETED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["REFUNDING"] = "REFUNDING";
    OrderStatus["REFUNDED"] = "REFUNDED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
// User role enum
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
// Fulfillment type
var FulfillmentType;
(function (FulfillmentType) {
    FulfillmentType["PICKUP"] = "PICKUP";
    FulfillmentType["DELIVERY"] = "DELIVERY";
})(FulfillmentType || (exports.FulfillmentType = FulfillmentType = {}));
// Payment provider
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["PAYSTACK"] = "PAYSTACK";
    PaymentProvider["CASH"] = "CASH";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
// Payment status
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["INITIATED"] = "INITIATED";
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
// Actor type for audit
var ActorType;
(function (ActorType) {
    ActorType["SYSTEM"] = "SYSTEM";
    ActorType["ADMIN"] = "ADMIN";
    ActorType["CUSTOMER"] = "CUSTOMER";
})(ActorType || (exports.ActorType = ActorType = {}));
// Audit action
var AuditAction;
(function (AuditAction) {
    AuditAction["STATUS_CHANGE"] = "STATUS_CHANGE";
    AuditAction["CREATE"] = "CREATE";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["REFUND"] = "REFUND";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
//# sourceMappingURL=types.js.map