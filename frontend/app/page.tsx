import { 
  Hero, 
  SupportSection,
  Features,
  Footer
} from "@/components/landing";
import { Navbar } from "@/components/landing/navbar";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar/>
      <Hero />
      <SupportSection />
      <Features/>
      <Footer />
    </div>
  );
}