import MainTemplate from '@/components/layout/main-template/MainTemplate';
import Banner from '@/components/home/banner/Banner';
import Spares from '@/components/home/spares/Spares';
import PopularBrands from '@/components/home/popular-brands/PopularBrands';
import PopularProducts from '@/components/home/popular-products/PopularProducts';

export default function Home() {
  return (
    <MainTemplate>
      <Banner />
      <Spares />
      <PopularBrands />
      <PopularProducts />
    </MainTemplate>
  );
}
