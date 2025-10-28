import React from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Shield,
  Lock,
  CheckCircle,
  Award,
  Globe,
  Star,
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Footer sections based on the reference design
  const forEmployers = [
    { name: 'Find a Maid', path: '/maids' },
    { name: 'Post a Job', path: '/jobs' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Success Stories', path: '/success-stories' },
    { name: 'Safety Guide', path: '/safety-guide' },
  ];

  const forMaids = [
    { name: 'Create Profile', path: '/register' },
    { name: 'Find Jobs', path: '/jobs' },
    { name: 'Career Resources', path: '/career-resources' },
    { name: 'Training Programs', path: '/training-programs' },
    { name: 'Support Center', path: '/support' },
  ];

  const forAgencies = [
    { name: 'Join Platform', path: '/register' },
    { name: 'Manage Portfolio', path: '/dashboard' },
    { name: 'Commission Structure', path: '/commission-structure' },
    { name: 'Partner Benefits', path: '/partner-benefits' },
    { name: 'API Documentation', path: '/api-docs' },
  ];

  const support = [
    { name: 'Help Center', path: '/help' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'Live Chat', path: '/chat' },
    { name: 'Emergency Support', path: '/emergency-support' },
    { name: 'Report Issue', path: '/report-issue' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, path: 'https://facebook.com' },
    { name: 'Twitter', icon: Twitter, path: 'https://twitter.com' },
    { name: 'Instagram', icon: Instagram, path: 'https://instagram.com' },
    { name: 'LinkedIn', icon: Linkedin, path: 'https://linkedin.com' },
  ];

  return (
    <footer className='bg-slate-900 text-white mt-auto'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8'>
          {/* Brand Section */}
          <div className='lg:col-span-1'>
            <div className='flex items-center mb-4'>
              <img
                className='h-10 w-auto mr-3'
                src='/images/logo/ethiopian-maids-logo.png'
                alt='Ethiopian Maids Logo'
              />
              <span className='text-xl font-bold text-white'>Ethiopian Maids</span>
            </div>
            <p className='text-gray-300 text-sm mb-6 leading-relaxed'>
              The GCC's most trusted platform connecting Ethiopian domestic
              helpers with quality families and employers.
            </p>
            <div className='flex items-center space-x-4 mb-4'>
              <div className='flex items-center text-sm text-gray-300'>
                <span className='mr-2'>✓</span>
                <span>Verified</span>
              </div>
              <div className='flex items-center text-sm text-gray-300'>
                <span className='mr-2'>⭐</span>
                <span>4.9</span>
              </div>
              <div className='flex items-center text-sm text-gray-300'>
                <span className='mr-2'>🏆</span>
                <span>Licensed</span>
              </div>
            </div>
            <div className='flex space-x-3'>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.path}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-gray-400 hover:text-white transition-colors duration-300'
                >
                  <social.icon className='h-5 w-5' />
                  <span className='sr-only'>{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* For Employers */}
          <div>
            <h3 className='text-white font-semibold mb-4'>For Employers</h3>
            <ul className='space-y-3'>
              {forEmployers.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className='text-gray-300 hover:text-white transition-colors duration-300 text-sm'
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Maids */}
          <div>
            <h3 className='text-white font-semibold mb-4'>For Maids</h3>
            <ul className='space-y-3'>
              {forMaids.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className='text-gray-300 hover:text-white transition-colors duration-300 text-sm'
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Agencies */}
          <div>
            <h3 className='text-white font-semibold mb-4'>For Agencies</h3>
            <ul className='space-y-3'>
              {forAgencies.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className='text-gray-300 hover:text-white transition-colors duration-300 text-sm'
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className='text-white font-semibold mb-4'>Support</h3>
            <ul className='space-y-3'>
              {support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className='text-gray-300 hover:text-white transition-colors duration-300 text-sm'
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust Badges Section */}
        <div className='mt-12 pt-8 border-t border-gray-700'>
          <div className='flex flex-col lg:flex-row justify-between items-center gap-8'>
            {/* Trust Badges */}
            <div className='flex flex-col sm:flex-row items-center gap-6'>
              {/* SSL Secured Badge */}
              <div className='flex items-center gap-3 px-4 py-3 bg-green-900/30 border border-green-700/50 rounded-lg hover:bg-green-900/40 transition-colors duration-300'>
                <div className='flex items-center justify-center w-10 h-10 bg-green-600 rounded-full'>
                  <Lock className='w-5 h-5 text-white' />
                </div>
                <div>
                  <div className='text-green-400 font-semibold text-sm'>
                    SSL Secured
                  </div>
                  <div className='text-green-300 text-xs'>
                    256-bit Encryption
                  </div>
                </div>
              </div>

              {/* Verified Platform Badge */}
              <div className='flex items-center gap-3 px-4 py-3 bg-blue-900/30 border border-blue-700/50 rounded-lg hover:bg-blue-900/40 transition-colors duration-300'>
                <div className='flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full'>
                  <Shield className='w-5 h-5 text-white' />
                </div>
                <div>
                  <div className='text-blue-400 font-semibold text-sm'>
                    Verified Platform
                  </div>
                  <div className='text-blue-300 text-xs'>
                    Government Licensed
                  </div>
                </div>
              </div>

              {/* Trusted by Thousands Badge */}
              <div className='flex items-center gap-3 px-4 py-3 bg-purple-900/30 border border-purple-700/50 rounded-lg hover:bg-purple-900/40 transition-colors duration-300'>
                <div className='flex items-center justify-center w-10 h-10 bg-purple-600 rounded-full'>
                  <CheckCircle className='w-5 h-5 text-white' />
                </div>
                <div>
                  <div className='text-purple-400 font-semibold text-sm'>
                    Trusted Platform
                  </div>
                  <div className='text-purple-300 text-xs'>
                    4,200+ Active Users
                  </div>
                </div>
              </div>

              {/* Award Badge */}
              <div className='flex items-center gap-3 px-4 py-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg hover:bg-yellow-900/40 transition-colors duration-300'>
                <div className='flex items-center justify-center w-10 h-10 bg-yellow-600 rounded-full'>
                  <Award className='w-5 h-5 text-white' />
                </div>
                <div>
                  <div className='text-yellow-400 font-semibold text-sm'>
                    Excellence Award
                  </div>
                  <div className='text-yellow-300 text-xs'>
                    97% Success Rate
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Trust Indicators */}
            <div className='flex flex-col items-center lg:items-end gap-4'>
              <div className='flex items-center gap-4 text-sm'>
                <div className='flex items-center gap-2 text-gray-300'>
                  <Globe className='w-4 h-4 text-green-400' />
                  <span>6 GCC Countries</span>
                </div>
                <div className='flex items-center gap-2 text-gray-300'>
                  <Star className='w-4 h-4 text-yellow-400' />
                  <span>4.8/5 Rating</span>
                </div>
              </div>
              <div className='text-xs text-gray-400 text-center lg:text-right'>
                <div>Licensed by Ethiopian Ministry of Labor</div>
                <div>Certified by GCC Regulatory Authorities</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='mt-8 pt-8 border-t border-gray-700'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <p className='text-sm text-gray-400 mb-4 md:mb-0'>
              Ethiopian Maids &copy; {currentYear}. All rights reserved, designed by Ethio-Maids Team.
            </p>
            <div className='flex space-x-6 text-sm'>
              <Link
                to='/terms'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Terms of Service
              </Link>
              <Link
                to='/privacy'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Privacy Policy
              </Link>
              <Link
                to='/cookies'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

