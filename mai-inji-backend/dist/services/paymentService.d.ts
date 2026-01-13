import { PaymentStatus } from '../types';
export declare function initializePayment(orderId: string, amount: number, email: string): Promise<{
    paymentId: string;
    authorizationUrl: string;
    reference: string;
}>;
export declare function verifyPayment(reference: string): Promise<{
    orderId: any;
    paymentId: any;
    status: PaymentStatus;
    isSuccessful: boolean;
} | null>;
export declare function refundPayment(paymentId: string, reason?: string): Promise<any>;
//# sourceMappingURL=paymentService.d.ts.map