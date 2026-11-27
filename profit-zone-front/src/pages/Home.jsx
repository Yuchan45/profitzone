import HeroSection from '../components/home/HeroSection.jsx'
import HowItWorksSection from '../components/home/HowItWorksSection.jsx'
import DemoVideoSection from '../components/home/DemoVideoSection.jsx'
import DataSection from '../components/home/DataSection.jsx'
import PricingSection from '../components/home/PricingSection.jsx'
import FaqSection from '../components/home/FaqSection.jsx'
import CtaSection from '../components/home/CtaSection.jsx'

function Home() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <DemoVideoSection />
      <DataSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
    </>
  )
}

export default Home