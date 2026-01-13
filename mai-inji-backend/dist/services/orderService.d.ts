import { Order, OrderStatus, FulfillmentType } from '../types';
import { ActorType } from '../types';
export declare function createOrder(userId: string, items: Array<{
    menuItemId: string;
    quantity: number;
}>, fulfillmentType: FulfillmentType, deliveryAddress?: string): Promise<Order>;
export declare function getOrderById(orderId: string): Promise<Order | null>;
export declare function updateOrderStatus(orderId: string, newStatus: OrderStatus, actorId: string, actorType: ActorType, reason?: string): Promise<Order>;
//# sourceMappingURL=orderService.d.ts.map