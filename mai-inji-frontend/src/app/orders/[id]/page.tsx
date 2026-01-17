import { OrderStatusDisplay } from '@/components/OrderStatusDisplay';

export const metadata = {
  title: 'Order Status - Mai Inji',
  description: 'Track your order',
};

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  return <OrderStatusDisplay orderId={id} />;
}
