import Hero from '../Hero/Hero';
import About from '../About/About';
import Testimonials from '../Testimonials/Testimonials';
import useDocumentTitle from '../../utils/useDocumentTitle';

export default function Home() {
  useDocumentTitle(
    'M Cube\'s Cafe | #1 Specialty Coffee & Gourmet Bites in Coimbatore',
    'Specialty 100% Arabica coffee, gourmet burgers, hot momos & ice mojitos served fresh near Bharathiyar University, Coimbatore.'
  );

  return (
    <>
      <Hero />
      <About />
      <Testimonials />
    </>
  );
}
