import React, { Suspense } from 'react';
import './Landing.css';

// Eager load above the fold
import NavBar from './sections/NavBar';
import Hero from './sections/Hero';
import LogoStrip from './sections/LogoStrip';

// Lazy load below the fold
const ProductPreview = React.lazy(() => import('./sections/ProductPreview'));
const FeaturesGrid = React.lazy(() => import('./sections/FeaturesGrid'));
const HowItWorks = React.lazy(() => import('./sections/HowItWorks'));
const VoiceSpotlight = React.lazy(() => import('./sections/VoiceSpotlight'));
const DashboardShowcase = React.lazy(() => import('./sections/DashboardShowcase'));
const Stats = React.lazy(() => import('./sections/Stats'));
const FAQ = React.lazy(() => import('./sections/FAQ'));
const FinalCTA = React.lazy(() => import('./sections/FinalCTA'));
const Footer = React.lazy(() => import('./sections/Footer'));

export default function Landing() {
  return (
    <div className="landing-page-root">
      <NavBar />
      <main>
        <Hero />
        <LogoStrip />
        <Suspense fallback={<div style={{height: '100vh'}} />}>
          <ProductPreview />
          <FeaturesGrid />
          <HowItWorks />
          <VoiceSpotlight />
          <DashboardShowcase />
          <Stats />
          <FAQ />
          <FinalCTA />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
