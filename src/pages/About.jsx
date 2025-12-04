// src/pages/About.jsx
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tractor, 
  ShoppingCart, 
  Users, 
  Leaf, 
  MessageSquare,
  Target,
  Package,
  Heart,
  Star,
  TrendingUp,
  MapPin,
  Truck,
  CheckCircle,
  Sparkles,
  Globe,
  Network,
  Zap,
  Shield,
  Award,
  ArrowRight,
  Eye,
  Handshake
} from 'lucide-react';

const About = () => {
  const heroRef = useRef(null);

  // Parallax effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        heroRef.current.style.transform = `translate3d(0, ${rate}px, 0)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const values = [
    {
      icon: Network,
      title: "True Decentralization",
      description: "No gatekeepers, no corporate middlemen. Our peer-to-peer network connects farmers directly with their communities, ensuring fair prices and genuine relationships."
    },
    {
      icon: Shield,
      title: "Radical Transparency",
      description: "Every transaction is visible, every farmer is verified, every product is traceable. Blockchain technology ensures complete transparency from farm to fork."
    },
    {
      icon: Globe,
      title: "Universal Access",
      description: "Whether you're in downtown Manhattan or rural Montana, our platform works everywhere. We believe every community deserves access to fresh, local food."
    },
    {
      icon: Handshake,
      title: "Community First",
      description: "Built by farmers and neighbors for farmers and neighbors. Every decision we make prioritizes community benefit over corporate profit."
    }
  ];

  const timeline = [
    {
      year: "2024",
      title: "The Personal Problem",
      description: "I grew amazing vegetables but couldn't find customers. Local farmers' markets were limited, online platforms took huge cuts, and there was no way to connect directly with neighbors who wanted fresh, local food."
    },
    {
      year: "Late 2024",
      title: "The Eureka Moment",
      description: "Realized this wasn't just my problem—small farmers everywhere struggle to reach customers while communities can't find truly local producers. The solution needed to be decentralized, transparent, and work for everyone."
    },
    {
      year: "Sep 2025",
      title: "Hackathon Innovation",
      description: "Currently building the prototype at a hackathon. Developing a platform that connects farmers directly with their communities using blockchain transparency and decentralized architecture."
    },
    {
      year: "Fall 2025",
      title: "MVP Launch Ahead",
      description: "Planning to launch our Minimum Viable Product this fall, just in time for the next growing season. Ready to connect farmers directly with their communities, with complete transparency and no middlemen."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[80vh] bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 text-white overflow-hidden">
        {/* Parallax Background Elements */}
        <div ref={heroRef} className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/15 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="block">Empowering</span>
              <span className="block bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                Small Farmers
              </span>
              <span className="block">Everywhere</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-95 max-w-3xl leading-relaxed">
              We're building a decentralized food system where passionate local growers thrive, 
              communities discover hidden treasures in their own backyards, and fresh food 
              connects neighbors across every corner of the region.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/register">
                <Button size="lg" className="bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 px-8 py-4 text-lg font-semibold">
                  Join Our Community
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <a href="/farmers">
                <Button size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-700 px-8 py-4 text-lg font-semibold">
                  Meet Our Farmers
                  <Users className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-gray-900">Our Mission</h2>
            <p className="text-2xl text-gray-600 leading-relaxed mb-12">
              To create a truly decentralized food network that empowers small farmers, 
              strengthens local communities, and ensures everyone has access to fresh, 
              transparent, and fairly-priced food—no matter where they live.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Eye className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Transparency</h3>
                <p className="text-gray-600">Complete visibility into where your food comes from, how it's grown, and who grows it.</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Network className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Decentralization</h3>
                <p className="text-gray-600">Direct farmer-to-customer connections without corporate gatekeepers or middlemen.</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Community</h3>
                <p className="text-gray-600">Building stronger local food systems that benefit everyone in the community.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">What Makes Us Different</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just another marketplace. We're building the infrastructure for a more equitable food system.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <value.icon className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600 leading-relaxed">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline/Story Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Our Journey</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From identifying the problem to building the solution that's changing how communities access fresh food.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-green-200"></div>
              
              {timeline.map((item, index) => (
                <div key={index} className="relative flex items-start mb-12 last:mb-0">
                  <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center border-4 border-white shadow-lg z-10">
                    <span className="text-green-600 font-bold text-sm text-center leading-none">{item.year}</span>
                  </div>
                  <div className="ml-8">
                    <h3 className="text-2xl font-bold mb-4 text-gray-900">{item.title}</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Powered by Technology</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We use cutting-edge technology to ensure transparency, security, and accessibility for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>Blockchain Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Every transaction is recorded on the blockchain for complete transparency and traceability from farm to table.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle>Smart Location Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Advanced mapping technology connects you with the nearest farmers and shows you hidden local food sources.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle>Real-Time Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Direct messaging, real-time order tracking, and instant notifications keep farmers and customers connected.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">Ready to Join the Movement?</h2>
          <p className="text-2xl mb-8 max-w-3xl mx-auto opacity-95">
            Be part of the decentralized food revolution. Support local farmers, discover amazing produce, 
            and help build stronger communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="/register">
              <Button size="lg" className="bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 px-8 py-4 text-lg font-semibold">
                <ShoppingCart className="mr-2 h-6 w-6" />
                Start Shopping
              </Button>
            </a>
            <a href="/register">
              <Button size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-700 px-8 py-4 text-lg font-semibold">
                <Tractor className="mr-2 h-6 w-6" />
                Join as Farmer
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};

export default About;