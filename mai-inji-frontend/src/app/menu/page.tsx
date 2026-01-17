import Link from 'next/link';
import MenuBrowser from '@/components/MenuBrowser';

export const metadata = {
  title: 'Menu - Mai Inji',
  description: 'Browse our delicious menu',
};

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-transparent py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-12 tracking-tight uppercase">Our Menu</h1>
        <MenuBrowser />
      </div>
    </main>
  );
}
