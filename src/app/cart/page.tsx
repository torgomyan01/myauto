import MainTemplate from '@/components/layout/main-template/MainTemplate';
import Cart from '@/components/cart/Cart';

export default function CartPage() {
  return (
    <MainTemplate>
      <div className="wrapper py-10 max-w-3xl mx-auto">
        <Cart />
      </div>
    </MainTemplate>
  );
}
