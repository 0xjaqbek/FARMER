// src/pages/campaigns/AboutCampaigns.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Users, 
  Heart, 
  Leaf, 
  Shield, 
  Star,
  DollarSign,
  Clock,
  Award,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Eye,
  Handshake,
  Zap,
  Lock,
  Wallet,
  Smartphone,
  Package,
  TrendingUp
} from 'lucide-react';

const AboutCampaigns = () => {

  const campaignTypes = [
    {
      icon: Package,
      type: "Pre-Order Campaigns",
      title: "Get Your Harvest Before Anyone Else",
      description: "Support farmers by buying their produce before it's even harvested. Perfect for seasonal items, specialty crops, or trying something new.",
      example: "Pre-order organic tomatoes for summer delivery and save 20% off market price",
      benefits: ["Lower prices", "Guaranteed fresh produce", "Support planning", "Exclusive varieties"],
      color: "blue"
    },
    {
      icon: Target,
      type: "Equipment & Infrastructure",
      title: "Help Farms Upgrade and Grow",
      description: "Fund new equipment, greenhouses, irrigation systems, or processing facilities that help farmers increase quality and efficiency.",
      example: "Help a small farm buy a new tractor to expand their vegetable production",
      benefits: ["Better quality produce", "Increased farm capacity", "Job creation", "Modern farming methods"],
      color: "green"
    },
    {
      icon: Leaf,
      type: "Farm Expansion",
      title: "Support Growing Operations",
      description: "Help farmers expand their land, add new crops, or scale their operations to serve more customers in your community.",
      example: "Fund expansion of an organic berry farm to include pick-your-own experiences",
      benefits: ["More local food options", "Economic growth", "Community experiences", "Environmental benefits"],
      color: "purple"
    },
    {
      icon: AlertCircle,
      type: "Emergency Support",
      title: "Help Farmers in Crisis",
      description: "Sometimes farms face unexpected challenges like weather damage, equipment failure, or economic hardship. Your support can help them recover.",
      example: "Help a family farm recover from storm damage to their greenhouse",
      benefits: ["Preserve local food sources", "Support families", "Community resilience", "Food security"],
      color: "red"
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Discover Projects",
      description: "Browse campaigns from local farmers in your area. Each campaign tells the farmer's story and explains exactly how your money will be used.",
      icon: Eye
    },
    {
      step: 2,
      title: "Choose Your Support Level",
      description: "Pick a reward tier that fits your budget. Rewards can include produce, farm visits, cooking classes, or just the satisfaction of helping.",
      icon: Heart
    },
    {
      step: 3,
      title: "Make a Secure Contribution",
      description: "Contribute safely using your digital wallet. Your payment is protected by blockchain security and only released when project milestones are met.",
      icon: Shield
    },
    {
      step: 4,
      title: "Track Progress",
      description: "Watch your supported projects grow! Farmers share updates, photos, and progress reports so you can see exactly how your money is being used.",
      icon: TrendingUp
    },
    {
      step: 5,
      title: "Get Your Rewards",
      description: "Receive your chosen rewards when they're ready. This could be fresh produce, invites to farm events, or updates on the project's impact.",
      icon: Award
    }
  ];

  const safetyFeatures = [
    {
      icon: Shield,
      title: "Secure Technology",
      description: "Your contributions are protected by advanced blockchain technology that ensures transparency and security without requiring any technical knowledge."
    },
    {
      icon: Eye,
      title: "Full Transparency",
      description: "See exactly where every dollar goes. Our system automatically tracks fund usage and milestone completion, so there are no surprises."
    },
    {
      icon: CheckCircle,
      title: "Verified Farmers",
      description: "All farmers are verified by our team. We check their identity, farm operations, and project plans before campaigns go live."
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Join a community of supporters who care about local food. Share updates, ask questions, and connect with like-minded people."
    }
  ];

  const faqs = [
    {
      question: "What is crowdfunding for farms?",
      answer: "It's a way for community members to pool money together to support local farming projects. Instead of farmers borrowing from banks, they raise funds directly from people who care about local food and agriculture."
    },
    {
      question: "Do I need to understand blockchain or cryptocurrency?",
      answer: "You don't need to understand the technical details, but you will need a cryptocurrency wallet to contribute. Don't worry—we provide step-by-step guides to help you set up a wallet, and most people find it easier than expected. You only need to set it up once!"
    },
    {
      question: "What if the farmer doesn't deliver what they promised?",
      answer: "Our system includes built-in protections. Farmers must hit specific milestones to access funds, and we have a dispute resolution process. Most farmers go above and beyond because their reputation depends on it."
    },
    {
      question: "How do I know my money is being used properly?",
      answer: "Every campaign includes milestone tracking where farmers must prove they've completed specific steps before accessing more funds. You'll receive regular updates with photos and progress reports."
    },
    {
      question: "What kinds of rewards can I expect?",
      answer: "Rewards vary by campaign but often include fresh produce, farm visits, cooking classes, early access to new products, or even naming rights for farm animals or plots!"
    },
    {
      question: "Can I visit the farms I support?",
      answer: "Many campaigns include farm visit rewards! It's a great way to see your contribution in action and learn more about where your food comes from."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-green-400 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Farm Crowdfunding Made Simple</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-95">
            Support local farmers, get amazing rewards, and help build a stronger food system in your community. 
            No technical knowledge required—just click, contribute, and watch farms grow!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/campaigns">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 px-8 py-4 text-lg font-semibold">
                <Target className="mr-2 h-6 w-6" />
                Browse Campaigns
              </Button>
            </a>
            <a href="/register">
              <Button size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg font-semibold">
                <Users className="mr-2 h-6 w-6" />
                Start Supporting
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* What is Farm Crowdfunding */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">What is Farm Crowdfunding?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              It's like a community investment in your local food system. Instead of farmers going to banks for loans, 
              they come directly to you—their future customers—for support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>Community Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Many people contribute small amounts to fund farmer projects, creating a strong community around local food.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Handshake className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle>Win-Win Partnership</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Farmers get funding without debt, supporters get fresh food and experiences, communities get stronger local food systems.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle>Simple & Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Advanced technology handles all the complex stuff behind the scenes. You just pick projects you like and contribute safely.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Types of Campaigns */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Types of Farm Projects You Can Support</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every campaign is different, but they generally fall into these categories. Each type offers unique rewards and benefits.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {campaignTypes.map((type, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 bg-${type.color}-100 rounded-lg flex items-center justify-center mr-4`}>
                      <type.icon className={`w-6 h-6 text-${type.color}-600`} />
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">{type.type}</Badge>
                      <CardTitle className="text-xl">{type.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{type.description}</p>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm font-medium text-gray-800">Example:</p>
                    <p className="text-sm text-gray-600">{type.example}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 mb-2">Benefits for supporters:</p>
                    <div className="flex flex-wrap gap-2">
                      {type.benefits.map((benefit, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{benefit}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">How Does It Work?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Supporting farm projects is as easy as online shopping. Here's how the process works from start to finish.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {howItWorks.map((step, index) => (
              <div key={index} className="flex items-start mb-8 last:mb-0">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-6">
                  <span className="text-green-600 font-bold">{step.step}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <step.icon className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety & Security */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Your Money is Safe & Secure</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We use advanced technology to protect your contributions and ensure farmers use funds responsibly. 
              Here's what keeps your money safe.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {safetyFeatures.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-12 max-w-4xl mx-auto">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Easy Crypto Contributions</h3>
                <p className="text-blue-800">
                  Contributions are made using cryptocurrency, but don't worry—it's much easier than it sounds! 
                  You'll need a digital wallet (we'll help you set it up), and the process is secure and straightforward. 
                  Most people learn it in just a few minutes, and you only need to set it up once.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Common questions from people new to farm crowdfunding. Don't see your question? Contact us anytime!
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <HelpCircle className="w-5 h-5 text-green-600 mr-3" />
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 pl-8">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-400 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">Ready to Support Your Local Farmers?</h2>
          <p className="text-2xl mb-8 max-w-3xl mx-auto opacity-95">
            Join thousands of people who are already building stronger local food systems, one campaign at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="/campaigns">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 px-8 py-4 text-lg font-semibold">
                <Target className="mr-2 h-6 w-6" />
                Browse Active Campaigns
              </Button>
            </a>
            <a href="/register">
              <Button size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg font-semibold">
                <Users className="mr-2 h-6 w-6" />
                Create Account
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutCampaigns;