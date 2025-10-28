import React, { useMemo } from 'react';
import HeroSection from '@/components/home/HeroSection';
import TrustedBySection from '@/components/home/TrustedBySection';
import FeaturedMaidsSection from '@/components/home/FeaturedMaidsSection';
import StatsSection from '@/components/home/StatsSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import WhatsAppAssistantSection from '@/components/home/WhatsAppAssistantSection';
import SEO from '@/components/global/SEO';
import FindJobsCTA from '@/components/home/FindJobsCTA';
import FloatingWhatsAppButton from '@/components/common/FloatingWhatsAppButton';

const Home = () => {
  const seo = useMemo(
    () => ({
      title: 'Home | Ethiopian Maids',
      description:
        'Connect Ethiopian domestic workers with families and agencies across GCC countries. Browse profiles, find jobs, and manage your hiring process.',
      canonical:
        typeof window !== 'undefined'
          ? `${window.location.origin}/`
          : undefined,
      openGraph: {
        title: 'Home | Ethiopian Maids',
        description:
          'Find Ethiopian maids and jobs across the GCC. Explore verified profiles, pricing, and seamless onboarding.',
        url:
          typeof window !== 'undefined'
            ? `${window.location.origin}/`
            : undefined,
        image: '/images/og-default.png',
      },
    }),
    []
  );

  const seoJsonLd = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Ethiopian Maids',
        url:
          typeof window !== 'undefined'
            ? window.location.origin
            : 'https://ethiopian-maids.example',
        logo: '/images/new-ethiopian-maids-logo.svg',
        areaServed: [
          'United Arab Emirates',
          'Saudi Arabia',
          'Qatar',
          'Bahrain',
          'Kuwait',
          'Oman',
        ],
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: '+00000000000',
            contactType: 'customer support',
            areaServed: [
              'United Arab Emirates',
              'Saudi Arabia',
              'Qatar',
              'Bahrain',
              'Kuwait',
              'Oman',
            ],
            availableLanguage: ['English', 'Amharic', 'Arabic'],
          },
        ],
        sameAs: [
          'https://www.facebook.com/',
          'https://www.instagram.com/',
          'https://www.linkedin.com/',
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Ethiopian Maids',
        url:
          typeof window !== 'undefined'
            ? window.location.origin
            : 'https://ethiopian-maids.example',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${typeof window !== 'undefined' ? window.location.origin : 'https://ethiopian-maids.example'}/maids?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
    []
  );

  return (
    <div className='min-h-screen'>
      <SEO {...seo} jsonLd={seoJsonLd} />
      <HeroSection />
      <TrustedBySection />
      <FeaturedMaidsSection />
      <StatsSection />
      <FeaturesSection />
      <WhatsAppAssistantSection />
      <FindJobsCTA />
      <HowItWorksSection />
      <TestimonialsSection />
      <FloatingWhatsAppButton />
    </div>
  );
};

export default Home;
