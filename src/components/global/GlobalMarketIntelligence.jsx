/**
 * 🌍 Global Market Intelligence Dashboard
 * AI-powered market analysis and expansion strategy for worldwide domination
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  BarChart3,
  Map,
  Zap,
  Brain,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import userAnalytics from '@/utils/userAnalytics';
import productionMonitor from '@/utils/productionMonitoring';

const GlobalMarketIntelligence = () => {
  const [marketData, setMarketData] = useState({});
  const [expansionOpportunities, setExpansionOpportunities] = useState([]);
  const [competitorAnalysis, setCompetitorAnalysis] = useState([]);
  const [marketTrends, setMarketTrends] = useState([]);
  const [revenueProjections, setRevenueProjections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('global');

  // =============================================
  // DATA LOADING & PROCESSING
  // =============================================

  useEffect(() => {
    loadMarketIntelligence();
    analyzeExpansionOpportunities();
    analyzeCompetitors();
    analyzeTrends();
    projectRevenue();
  }, [selectedRegion]);

  const loadMarketIntelligence = async () => {
    setIsLoading(true);

    try {
      const data = {
        globalMetrics: await getGlobalMetrics(),
        regionalData: await getRegionalData(),
        marketSize: await getMarketSizeData(),
        growthRates: await getGrowthRates(),
        penetrationRates: await getPenetrationRates(),
      };

      setMarketData(data);
    } catch (error) {
      console.error('Failed to load market intelligence:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeExpansionOpportunities = async () => {
    const opportunities = [
      {
        id: 'uae_expansion',
        country: 'United Arab Emirates',
        flag: '🇦🇪',
        marketSize: '$2.8B',
        growthRate: 18.5,
        penetration: 12.3,
        opportunity: 'high',
        confidence: 0.89,
        timeToMarket: '3-6 months',
        investmentRequired: '$500K',
        projectedRevenue: '$2.1M',
        keyFactors: [
          'Large expat population',
          'High disposable income',
          'Growing domestic worker demand',
          'Tech-savvy population',
        ],
        challenges: [
          'Regulatory compliance',
          'Local competition',
          'Cultural adaptation',
        ],
        strategy: 'Premium positioning with AI-powered matching',
      },
      {
        id: 'qatar_expansion',
        country: 'Qatar',
        flag: '🇶🇦',
        marketSize: '$1.2B',
        growthRate: 22.1,
        penetration: 8.7,
        opportunity: 'high',
        confidence: 0.82,
        timeToMarket: '4-8 months',
        investmentRequired: '$350K',
        projectedRevenue: '$1.4M',
        keyFactors: [
          'World Cup infrastructure growth',
          'High GDP per capita',
          'Government digitization initiatives',
        ],
        challenges: [
          'Small market size',
          'Regulatory requirements',
          'Competition from established players',
        ],
        strategy: 'Government partnerships and premium services',
      },
      {
        id: 'kuwait_expansion',
        country: 'Kuwait',
        flag: '🇰🇼',
        marketSize: '$900M',
        growthRate: 15.3,
        penetration: 15.2,
        opportunity: 'medium',
        confidence: 0.75,
        timeToMarket: '6-12 months',
        investmentRequired: '$280K',
        projectedRevenue: '$950K',
        keyFactors: [
          'Established domestic worker market',
          'High smartphone penetration',
          'Growing middle class',
        ],
        challenges: [
          'Market saturation',
          'Price sensitivity',
          'Local regulations',
        ],
        strategy: 'Competitive pricing with superior technology',
      },
      {
        id: 'singapore_expansion',
        country: 'Singapore',
        flag: '🇸🇬',
        marketSize: '$1.8B',
        growthRate: 12.8,
        penetration: 25.4,
        opportunity: 'medium',
        confidence: 0.78,
        timeToMarket: '8-12 months',
        investmentRequired: '$650K',
        projectedRevenue: '$1.8M',
        keyFactors: [
          'Tech hub with high adoption',
          'Multicultural workforce demand',
          'Government support for innovation',
        ],
        challenges: [
          'High competition',
          'Strict regulations',
          'High operational costs',
        ],
        strategy: 'Technology leadership and compliance excellence',
      },
      {
        id: 'malaysia_expansion',
        country: 'Malaysia',
        flag: '🇲🇾',
        marketSize: '$1.5B',
        growthRate: 16.7,
        penetration: 18.9,
        opportunity: 'medium',
        confidence: 0.71,
        timeToMarket: '6-10 months',
        investmentRequired: '$320K',
        projectedRevenue: '$1.2M',
        keyFactors: [
          'Large domestic worker market',
          'Growing digital adoption',
          'Regional hub potential',
        ],
        challenges: [
          'Currency fluctuations',
          'Regulatory complexity',
          'Local competition',
        ],
        strategy: 'Regional hub with localized services',
      },
    ];

    setExpansionOpportunities(opportunities);
  };

  const analyzeCompetitors = async () => {
    const competitors = [
      {
        id: 'competitor_a',
        name: 'DomesticWorker.com',
        marketShare: 23.5,
        strengths: [
          'Established brand',
          'Large user base',
          'Multiple countries',
        ],
        weaknesses: [
          'Outdated technology',
          'Poor user experience',
          'No AI features',
        ],
        threat: 'medium',
        differentiators: [
          'AI-powered matching',
          'Superior UX',
          'Real-time features',
        ],
      },
      {
        id: 'competitor_b',
        name: 'MaidFinder',
        marketShare: 18.2,
        strengths: ['Strong in Saudi Arabia', 'Good local partnerships'],
        weaknesses: [
          'Limited technology',
          'Single market focus',
          'Basic features',
        ],
        threat: 'low',
        differentiators: [
          'Global expansion',
          'Advanced AI',
          'Multi-language support',
        ],
      },
      {
        id: 'competitor_c',
        name: 'HelpersHub',
        marketShare: 15.8,
        strengths: ['Modern interface', 'Mobile-first approach'],
        weaknesses: [
          'Limited AI features',
          'Small market presence',
          'Basic matching',
        ],
        threat: 'medium',
        differentiators: [
          'Superior AI matching',
          'Predictive analytics',
          'Global scale',
        ],
      },
    ];

    setCompetitorAnalysis(competitors);
  };

  const analyzeTrends = async () => {
    const trends = [
      {
        id: 'ai_adoption',
        title: 'AI Adoption in Recruitment',
        impact: 'high',
        timeline: 'current',
        description:
          'Increasing demand for AI-powered matching and recommendations',
        opportunity:
          'First-mover advantage in AI-powered domestic worker matching',
        confidence: 0.92,
      },
      {
        id: 'mobile_first',
        title: 'Mobile-First User Behavior',
        impact: 'high',
        timeline: 'current',
        description:
          '85% of users prefer mobile applications for service discovery',
        opportunity: 'Superior mobile experience drives user acquisition',
        confidence: 0.88,
      },
      {
        id: 'gig_economy',
        title: 'Gig Economy Growth',
        impact: 'medium',
        timeline: 'emerging',
        description: 'Shift towards flexible, on-demand domestic services',
        opportunity: 'Expand into flexible, short-term domestic services',
        confidence: 0.76,
      },
      {
        id: 'digital_payments',
        title: 'Digital Payment Adoption',
        impact: 'medium',
        timeline: 'current',
        description: 'Rapid adoption of digital payment methods in GCC',
        opportunity: 'Integrated payment solutions increase user retention',
        confidence: 0.84,
      },
    ];

    setMarketTrends(trends);
  };

  const projectRevenue = async () => {
    const projections = [
      {
        region: 'GCC Total',
        year1: 2.8,
        year2: 4.2,
        year3: 6.8,
        year4: 10.5,
        year5: 16.2,
        cagr: 55.2,
      },
      {
        region: 'Saudi Arabia',
        year1: 1.2,
        year2: 1.8,
        year3: 2.7,
        year4: 4.1,
        year5: 6.3,
        cagr: 51.8,
      },
      {
        region: 'UAE',
        year1: 0.8,
        year2: 1.3,
        year3: 2.1,
        year4: 3.4,
        year5: 5.5,
        cagr: 62.1,
      },
      {
        region: 'Qatar',
        year1: 0.3,
        year2: 0.5,
        year3: 0.8,
        year4: 1.3,
        year5: 2.1,
        cagr: 63.4,
      },
      {
        region: 'Kuwait',
        year1: 0.3,
        year2: 0.4,
        year3: 0.7,
        year4: 1.1,
        year5: 1.7,
        cagr: 54.2,
      },
      {
        region: 'Southeast Asia',
        year1: 0.2,
        year2: 0.6,
        year3: 1.5,
        year4: 3.2,
        year5: 6.8,
        cagr: 145.3,
      },
    ];

    setRevenueProjections(projections);
  };

  // =============================================
  // MOCK DATA FUNCTIONS
  // =============================================

  const getGlobalMetrics = async () => ({
    totalMarketSize: '$45.2B',
    addressableMarket: '$12.8B',
    currentPenetration: 0.8,
    growthRate: 18.5,
    competitorCount: 127,
    ourMarketShare: 2.3,
  });

  const getRegionalData = async () => ({
    gcc: {
      marketSize: '$8.2B',
      growthRate: 16.2,
      penetration: 12.4,
      competition: 'medium',
    },
    southeastAsia: {
      marketSize: '$15.6B',
      growthRate: 22.8,
      penetration: 3.2,
      competition: 'high',
    },
    middleEast: {
      marketSize: '$6.8B',
      growthRate: 14.7,
      penetration: 8.9,
      competition: 'low',
    },
  });

  const getMarketSizeData = async () => ({
    domesticWorkers: 12500000,
    employers: 8200000,
    agencies: 45000,
    averageTransactionValue: 2400,
    transactionsPerYear: 5200000,
  });

  const getGrowthRates = async () => ({
    userAcquisition: 24.5,
    revenueGrowth: 31.2,
    marketExpansion: 18.7,
    technologyAdoption: 42.1,
  });

  const getPenetrationRates = async () => ({
    saudi: 15.2,
    uae: 12.8,
    qatar: 8.7,
    kuwait: 11.3,
    bahrain: 9.4,
    oman: 6.8,
  });

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  const getOpportunityColor = (opportunity) => {
    const colors = {
      high: 'text-green-600',
      medium: 'text-yellow-600',
      low: 'text-red-600',
    };
    return colors[opportunity] || 'text-gray-600';
  };

  const getOpportunityBadge = (opportunity) => {
    const variants = {
      high: 'success',
      medium: 'warning',
      low: 'destructive',
    };
    return (
      <Badge variant={variants[opportunity]}>{opportunity.toUpperCase()}</Badge>
    );
  };

  const getThreatColor = (threat) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600',
    };
    return colors[threat] || 'text-gray-600';
  };

  const getImpactIcon = (impact) => {
    if (impact === 'high')
      return <ArrowUpRight className='h-4 w-4 text-green-600' />;
    if (impact === 'medium')
      return <ArrowUpRight className='h-4 w-4 text-yellow-600' />;
    return <ArrowDownRight className='h-4 w-4 text-red-600' />;
  };

  // =============================================
  // RENDER
  // =============================================

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3'>
            <Globe className='h-8 w-8 text-blue-600' />
            Global Market Intelligence
          </h1>
          <p className='text-gray-600 dark:text-gray-300'>
            AI-powered market analysis for worldwide expansion
          </p>
        </div>

        <div className='flex items-center gap-4'>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className='px-3 py-2 border rounded-lg bg-white dark:bg-gray-800'
          >
            <option value='global'>Global View</option>
            <option value='gcc'>GCC Region</option>
            <option value='southeast_asia'>Southeast Asia</option>
            <option value='middle_east'>Middle East</option>
          </select>

          <Button onClick={loadMarketIntelligence} variant='outline'>
            <Brain className='h-4 w-4 mr-2' />
            Refresh Intelligence
          </Button>
        </div>
      </div>

      {/* Global Metrics Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Total Market Size
                </p>
                <p className='text-2xl font-bold'>
                  {marketData.globalMetrics?.totalMarketSize}
                </p>
              </div>
              <DollarSign className='h-8 w-8 text-green-600' />
            </div>
            <div className='mt-2 flex items-center text-sm'>
              <TrendingUp className='h-4 w-4 text-green-600 mr-1' />
              <span className='text-green-600'>
                +{marketData.globalMetrics?.growthRate}%
              </span>
              <span className='text-gray-500 ml-1'>annual growth</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Addressable Market
                </p>
                <p className='text-2xl font-bold'>
                  {marketData.globalMetrics?.addressableMarket}
                </p>
              </div>
              <Target className='h-8 w-8 text-blue-600' />
            </div>
            <div className='mt-2 flex items-center text-sm'>
              <Percent className='h-4 w-4 text-blue-600 mr-1' />
              <span className='text-blue-600'>
                {marketData.globalMetrics?.currentPenetration}%
              </span>
              <span className='text-gray-500 ml-1'>penetrated</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Market Share
                </p>
                <p className='text-2xl font-bold'>
                  {marketData.globalMetrics?.ourMarketShare}%
                </p>
              </div>
              <Trophy className='h-8 w-8 text-purple-600' />
            </div>
            <div className='mt-2 flex items-center text-sm'>
              <Users className='h-4 w-4 text-purple-600 mr-1' />
              <span className='text-purple-600'>#{3}</span>
              <span className='text-gray-500 ml-1'>market position</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Competitors
                </p>
                <p className='text-2xl font-bold'>
                  {marketData.globalMetrics?.competitorCount}
                </p>
              </div>
              <BarChart3 className='h-8 w-8 text-orange-600' />
            </div>
            <div className='mt-2 flex items-center text-sm'>
              <AlertTriangle className='h-4 w-4 text-orange-600 mr-1' />
              <span className='text-orange-600'>Medium</span>
              <span className='text-gray-500 ml-1'>threat level</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Intelligence Tabs */}
      <Tabs defaultValue='opportunities' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='opportunities'>
            Expansion Opportunities
          </TabsTrigger>
          <TabsTrigger value='competitors'>Competitor Analysis</TabsTrigger>
          <TabsTrigger value='trends'>Market Trends</TabsTrigger>
          <TabsTrigger value='projections'>Revenue Projections</TabsTrigger>
        </TabsList>

        <TabsContent value='opportunities' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {expansionOpportunities.map((opportunity) => (
              <Card key={opportunity.id}>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <span className='text-2xl'>{opportunity.flag}</span>
                    {opportunity.country}
                    {getOpportunityBadge(opportunity.opportunity)}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='text-gray-600'>Market Size:</span>
                      <span className='font-bold ml-2'>
                        {opportunity.marketSize}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-600'>Growth Rate:</span>
                      <span className='font-bold ml-2 text-green-600'>
                        +{opportunity.growthRate}%
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-600'>Time to Market:</span>
                      <span className='font-bold ml-2'>
                        {opportunity.timeToMarket}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-600'>Investment:</span>
                      <span className='font-bold ml-2'>
                        {opportunity.investmentRequired}
                      </span>
                    </div>
                  </div>

                  <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                    <p className='text-sm font-medium text-green-800 dark:text-green-200'>
                      Projected Revenue: {opportunity.projectedRevenue} (Year 1)
                    </p>
                    <div className='flex items-center mt-1'>
                      <span className='text-xs text-green-600'>
                        Confidence: {Math.round(opportunity.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Key Factors:
                    </p>
                    <div className='flex flex-wrap gap-1'>
                      {opportunity.keyFactors.map((factor, index) => (
                        <Badge
                          key={index}
                          variant='outline'
                          className='text-xs'
                        >
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                    <p className='text-sm text-blue-800 dark:text-blue-200'>
                      <strong>Strategy:</strong> {opportunity.strategy}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='competitors' className='space-y-4'>
          <div className='space-y-4'>
            {competitorAnalysis.map((competitor) => (
              <Card key={competitor.id}>
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div>
                      <h3 className='font-semibold text-lg'>
                        {competitor.name}
                      </h3>
                      <p className='text-sm text-gray-600'>
                        Market Share: {competitor.marketShare}%
                      </p>
                    </div>
                    <Badge
                      variant={
                        competitor.threat === 'high'
                          ? 'destructive'
                          : competitor.threat === 'medium'
                            ? 'warning'
                            : 'secondary'
                      }
                    >
                      {competitor.threat.toUpperCase()} THREAT
                    </Badge>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div>
                      <h4 className='font-medium text-green-700 dark:text-green-300 mb-2'>
                        Strengths
                      </h4>
                      <ul className='text-sm space-y-1'>
                        {competitor.strengths.map((strength, index) => (
                          <li key={index} className='flex items-center gap-2'>
                            <CheckCircle2 className='h-3 w-3 text-green-600' />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className='font-medium text-red-700 dark:text-red-300 mb-2'>
                        Weaknesses
                      </h4>
                      <ul className='text-sm space-y-1'>
                        {competitor.weaknesses.map((weakness, index) => (
                          <li key={index} className='flex items-center gap-2'>
                            <AlertTriangle className='h-3 w-3 text-red-600' />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className='font-medium text-blue-700 dark:text-blue-300 mb-2'>
                        Our Advantages
                      </h4>
                      <ul className='text-sm space-y-1'>
                        {competitor.differentiators.map((diff, index) => (
                          <li key={index} className='flex items-center gap-2'>
                            <Zap className='h-3 w-3 text-blue-600' />
                            {diff}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='trends' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {marketTrends.map((trend) => (
              <Card key={trend.id}>
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between mb-3'>
                    <h3 className='font-semibold'>{trend.title}</h3>
                    <div className='flex items-center gap-2'>
                      {getImpactIcon(trend.impact)}
                      <Badge variant='outline'>{trend.timeline}</Badge>
                    </div>
                  </div>

                  <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
                    {trend.description}
                  </p>

                  <div className='p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
                    <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                      <strong>Opportunity:</strong> {trend.opportunity}
                    </p>
                    <div className='flex items-center mt-2'>
                      <span className='text-xs text-yellow-600'>
                        Confidence: {Math.round(trend.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='projections' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5' />
                5-Year Revenue Projections (USD Millions)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-left py-2'>Region</th>
                      <th className='text-right py-2'>Year 1</th>
                      <th className='text-right py-2'>Year 2</th>
                      <th className='text-right py-2'>Year 3</th>
                      <th className='text-right py-2'>Year 4</th>
                      <th className='text-right py-2'>Year 5</th>
                      <th className='text-right py-2'>CAGR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueProjections.map((projection, index) => (
                      <tr key={index} className='border-b'>
                        <td className='py-2 font-medium'>
                          {projection.region}
                        </td>
                        <td className='text-right py-2'>
                          ${projection.year1}M
                        </td>
                        <td className='text-right py-2'>
                          ${projection.year2}M
                        </td>
                        <td className='text-right py-2'>
                          ${projection.year3}M
                        </td>
                        <td className='text-right py-2'>
                          ${projection.year4}M
                        </td>
                        <td className='text-right py-2'>
                          ${projection.year5}M
                        </td>
                        <td className='text-right py-2 text-green-600 font-bold'>
                          {projection.cagr}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlobalMarketIntelligence;
