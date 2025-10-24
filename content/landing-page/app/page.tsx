import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { CodeExample } from "@/components/code-example";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div>
      <Header />
      <main>
        <Hero />
        <Features />
        <CodeExample />
      </main>
      <Footer />
    </div>
  );
}
