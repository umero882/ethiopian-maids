/**
 * WhatsApp AI Assistant Landing Page
 * Public-facing page showcasing the WhatsApp booking assistant
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/card';
import {
  MessageSquare,
  Bot,
  Calendar,
  Clock,
  CheckCircle,
  Globe,
  Zap,
  Shield,
  ArrowRight,
  Phone,
  Users,
  Star,
} from 'lucide-react';

export default function WhatsAppAssistant() {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: 'Instant Replies',
      description: '24/7 AI-powered responses to sponsor inquiries via WhatsApp',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Users,
      title: 'Maid Matching',
      description: 'Intelligent matching based on skills, experience, and location preferences',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Calendar,
      title: 'Interview Scheduling',
      description: 'Automated booking system for interviews and consultations',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Globe,
      title: 'Multi-Language Support',
      description: 'Seamless communication in English and Arabic',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Shield,
      title: 'Verified Profiles',
      description: 'Access to authenticated and verified maid profiles',
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant responses powered by Claude AI technology',
      gradient: 'from-yellow-500 to-orange-500',
    },
  ];

  const stats = [
    { value: '24/7', label: 'Availability', icon: Clock },
    { value: '< 1 min', label: 'Response Time', icon: Zap },
    { value: '500+', label: 'Maids Available', icon: Users },
    { value: '95%', label: 'Satisfaction Rate', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 mb-8">
              <Bot className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Powered by Claude AI
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Your AI Maid Receptionist
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-4">
              Available 24/7 on WhatsApp
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12">
              Connect with qualified Ethiopian domestic workers instantly through Lucy, your intelligent WhatsApp assistant. Get matched, schedule interviews, and hire with confidence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate('/admin/whatsapp')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Open Dashboard
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <a
                href="https://wa.me/your_number"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-6 text-lg rounded-xl border-2 border-green-600 text-green-700 hover:bg-green-50 transition-all"
              >
                <Phone className="mr-2 h-5 w-5" />
                Try on WhatsApp
              </a>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to find and hire the perfect domestic worker
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent overflow-hidden"
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                  <div className="relative z-10">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  step: '01',
                  title: 'Send a Message',
                  description: 'Simply message our WhatsApp number and tell Lucy what you need',
                  icon: MessageSquare,
                  color: 'blue',
                },
                {
                  step: '02',
                  title: 'Get Matched',
                  description: 'Lucy will find the best maids matching your requirements and location',
                  icon: Users,
                  color: 'purple',
                },
                {
                  step: '03',
                  title: 'Schedule & Hire',
                  description: 'Book interviews, review profiles, and make your hire decision',
                  icon: CheckCircle,
                  color: 'green',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex gap-6 items-start bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 flex items-center justify-center text-white text-2xl font-bold`}>
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                      <h3 className="text-2xl font-bold text-gray-900">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 lg:p-16 text-center text-white shadow-2xl">
            <Bot className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join hundreds of satisfied families who found their perfect domestic worker through Lucy AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/admin/whatsapp')}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-xl shadow-lg"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Open Dashboard
              </Button>
              <a
                href="https://wa.me/your_number"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-6 text-lg rounded-xl border-2 border-white text-white hover:bg-white hover:text-blue-600 transition-all"
              >
                <Phone className="mr-2 h-5 w-5" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Ethiopian Maids. Powered by Claude AI.
          </p>
        </div>
      </footer>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
