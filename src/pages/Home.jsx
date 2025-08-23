// src/pages/Home.jsx - Landing page component
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tractor, 
  ShoppingCart, 
  Users, 
  Globe, 
  Leaf, 
  Wallet 
} from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[80vh] bg-gradient-to-r from-green-600 to-green-400 text-white flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Fresh from Farm to Your Table
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Connect directly with local farmers, support sustainable agriculture, and enjoy fresh produce with blockchain transparency.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                Get Started as Customer
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                Join as Farmer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose Farm Direct?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Tractor className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <CardTitle>Direct from Farmers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Buy fresh, seasonal produce straight from local farms. No middlemen, better prices.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <ShoppingCart className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <CardTitle>Easy Ordering & Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Browse products, add to cart, track orders with QR codes and real-time updates.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Users className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <CardTitle>Community Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Chat with farmers, leave reviews, and participate in crowdfunding campaigns.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Globe className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <CardTitle>Map-Based Discovery</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Find nearby farmers and products with interactive maps and location search.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Leaf className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <CardTitle>Sustainable Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Support eco-friendly farms with verified certifications and transparent supply chains.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Wallet className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <CardTitle>Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Pay with crypto wallets or traditional methods, backed by blockchain security.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xl mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
              <p className="text-gray-600">Create an account as a customer or farmer.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xl mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Discover</h3>
              <p className="text-gray-600">Browse products, farmers, and campaigns on the map.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xl mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Order/Support</h3>
              <p className="text-gray-600">Place orders or contribute to farm projects.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xl mb-4">4</div>
              <h3 className="text-xl font-semibold mb-2">Enjoy</h3>
              <p className="text-gray-600">Track delivery and enjoy fresh produce.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-green-600 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to Connect with Local Farms?</h2>
          <p className="text-xl mb-8">Join Farm Direct today and support sustainable agriculture.</p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-gray-800 text-white text-center">
        <p>&copy; 2025 Farm Direct. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;