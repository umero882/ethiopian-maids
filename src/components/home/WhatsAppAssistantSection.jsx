/**
 * WhatsApp Assistant Section
 * Showcases the WhatsApp AI booking assistant on the home page
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Bot,
  Calendar,
  UserCheck,
  Clock,
  Phone,
  Zap,
  Shield,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const WhatsAppAssistantSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user is admin by checking their profile or role
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.user_metadata?.user_type === 'admin';

  const features = [
    {
      icon: Zap,
      title: 'Instant Replies',
      description: 'Get immediate responses to your inquiries, 24/7. Lucy never sleeps!',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: UserCheck,
      title: 'Maid Matching',
      description: 'Find the perfect maid based on your specific requirements and preferences.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Calendar,
      title: 'Easy Scheduling',
      description: 'Book interviews and appointments directly through WhatsApp chat.',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: Shield,
      title: 'Verified Profiles',
      description: 'Access verified maid profiles with complete documentation and background checks.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  const handleGetStarted = () => {
    if (isAdmin) {
      navigate('/admin/whatsapp');
    } else {
      // For non-admin users, open WhatsApp chat with Twilio Sandbox number
      window.open('https://wa.me/14155238886', '_blank');
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-green-500 hover:bg-green-600">
            <Bot className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Your AI Maid Receptionist
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Meet Lucy, your 24/7 WhatsApp assistant for finding and hiring domestic workers
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Phone className="h-5 w-5 text-green-500" />
            <span className="text-sm">Available on WhatsApp</span>
          </div>
        </div>

        {/* Hero Card */}
        <div className="max-w-5xl mx-auto mb-16">
          <Card className="overflow-hidden shadow-2xl border-2 border-green-500/20">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Left Side - Chat Preview */}
                <div className="bg-gradient-to-br from-green-600 to-blue-600 p-8 text-white">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Lucy AI</h3>
                      <p className="text-sm text-white/80">Always Online</p>
                    </div>
                  </div>

                  {/* Sample Messages */}
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
                      <p className="text-sm">
                        Hi! I'm looking for an experienced maid for a family of 4 in Dubai.
                      </p>
                      <span className="text-xs text-white/60 mt-1 block">User</span>
                    </div>

                    <div className="bg-white rounded-lg p-3 text-gray-800 ml-4">
                      <p className="text-sm">
                        Hello! I'd be happy to help you find the perfect maid. I have 5 experienced maids available in Dubai. Would you like to see their profiles?
                      </p>
                      <span className="text-xs text-gray-500 mt-1 block">Lucy AI</span>
                    </div>

                    <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
                      <p className="text-sm">Yes, please! Can we schedule interviews?</p>
                      <span className="text-xs text-white/60 mt-1 block">User</span>
                    </div>

                    <div className="bg-white rounded-lg p-3 text-gray-800 ml-4">
                      <p className="text-sm">
                        Absolutely! I'll arrange interviews for you. What dates work best?
                      </p>
                      <span className="text-xs text-gray-500 mt-1 block">Lucy AI</span>
                    </div>
                  </div>
                </div>

                {/* Right Side - CTA */}
                <div className="p-8 bg-white flex flex-col justify-center">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-3">Get Started Today</h3>
                    <p className="text-gray-600 mb-6">
                      Start chatting with Lucy on WhatsApp and find your perfect domestic worker in minutes, not days.
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-700">24/7 availability</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-700">Instant responses</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-700">Smart recommendations</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleGetStarted}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    {isAdmin ? 'Open Dashboard' : 'Chat on WhatsApp'}
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-green-500/20"
              >
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-green-600 to-blue-600 border-0">
            <CardContent className="p-8 text-white">
              <Bot className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">
                Ready to Experience the Future of Hiring?
              </h3>
              <p className="mb-6 text-white/90">
                Join hundreds of satisfied families who've found their perfect domestic workers through Lucy
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-green-600 hover:bg-gray-100"
                onClick={handleGetStarted}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Start Chatting Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppAssistantSection;
