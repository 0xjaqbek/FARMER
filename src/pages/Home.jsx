// src/pages/Home.jsx - Enhanced marketing-focused landing page with advanced animations and Three.js effects
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
  DollarSign,
  Clock,
  Award,
  MapPin,
  Truck,
  CheckCircle,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

const Home = () => {
  const heroCanvasRef = useRef(null);
  const _cardCanvasRefs = useRef([]);
  const _floatingIconsRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [_hoveredCard, setHoveredCard] = useState(null);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.pageYOffset);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enhanced Three.js background with interactive elements
  useEffect(() => {
    let scene, camera, renderer, animationId, lightBeams;

    const initThreeJS = () => {
      if (!heroCanvasRef.current) return;

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => {
        const THREE = window.THREE;
        
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ 
          canvas: heroCanvasRef.current, 
          alpha: true,
          antialias: true 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Enhanced particles with multiple layers
        const createParticleLayer = (count, size, color, speed) => {
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(count * 3);
          const colors = new Float32Array(count * 3);
          const sizes = new Float32Array(count);
          const velocities = new Float32Array(count * 3);

          for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 30;
            positions[i + 1] = (Math.random() - 0.5) * 30;
            positions[i + 2] = (Math.random() - 0.5) * 30;
            
            velocities[i] = (Math.random() - 0.5) * speed;
            velocities[i + 1] = (Math.random() - 0.5) * speed;
            velocities[i + 2] = (Math.random() - 0.5) * speed;
            
            colors[i] = color.r + Math.random() * 0.2;
            colors[i + 1] = color.g + Math.random() * 0.2;
            colors[i + 2] = color.b + Math.random() * 0.2;
          }

          for (let i = 0; i < count; i++) {
            sizes[i] = Math.random() * size + size * 0.5;
          }

          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
          geometry.userData = { velocities, speed };

          return geometry;
        };

        // Create multiple particle layers
        const layer1Geo = createParticleLayer(80, 0.12, { r: 0.3, g: 0.8, b: 0.3 }, 0.002);
        const layer2Geo = createParticleLayer(60, 0.08, { r: 0.6, g: 0.9, b: 0.4 }, 0.003);
        const layer3Geo = createParticleLayer(40, 0.15, { r: 0.2, g: 0.7, b: 0.5 }, 0.001);

        const particleMaterial = new THREE.PointsMaterial({
          size: 0.1,
          sizeAttenuation: true,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });

        const particles1 = new THREE.Points(layer1Geo, particleMaterial);
        const particles2 = new THREE.Points(layer2Geo, particleMaterial);
        const particles3 = new THREE.Points(layer3Geo, particleMaterial);

        scene.add(particles1);
        scene.add(particles2);
        scene.add(particles3);

        // Add floating geometric shapes
        const createFloatingShapes = () => {
          const shapes = [];
          const geometries = [
            new THREE.RingGeometry(0.1, 0.2, 6),
            new THREE.CircleGeometry(0.15, 8),
            new THREE.PlaneGeometry(0.3, 0.3)
          ];

          for (let i = 0; i < 15; i++) {
            const geometry = geometries[Math.floor(Math.random() * geometries.length)];
            const material = new THREE.MeshBasicMaterial({
              color: new THREE.Color().setHSL(0.3 + Math.random() * 0.2, 0.7, 0.6),
              transparent: true,
              opacity: 0.3,
              side: THREE.DoubleSide
            });
            
            const shape = new THREE.Mesh(geometry, material);
            shape.position.set(
              (Math.random() - 0.5) * 25,
              (Math.random() - 0.5) * 25,
              (Math.random() - 0.5) * 15
            );
            shape.rotation.set(
              Math.random() * Math.PI,
              Math.random() * Math.PI,
              Math.random() * Math.PI
            );
            
            shapes.push(shape);
            scene.add(shape);
          }
          return shapes;
        };

        const floatingShapes = createFloatingShapes();

        // Add light beams effect
        const createLightBeams = () => {
          const beams = [];
          for (let i = 0; i < 8; i++) {
            const geometry = new THREE.PlaneGeometry(0.02, 20);
            const material = new THREE.MeshBasicMaterial({
              color: 0x90EE90,
              transparent: true,
              opacity: 0.1,
              side: THREE.DoubleSide
            });
            
            const beam = new THREE.Mesh(geometry, material);
            beam.position.set(
              (Math.random() - 0.5) * 30,
              0,
              (Math.random() - 0.5) * 20
            );
            beam.rotation.z = Math.random() * Math.PI;
            
            beams.push(beam);
            scene.add(beam);
          }
          return beams;
        };

        lightBeams = createLightBeams();

        camera.position.z = 8;

        // Enhanced animation with mouse interaction
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          
          const time = Date.now() * 0.001;
          
          // Mouse influence on camera
          const mouseInfluence = 0.0002;
          camera.rotation.x += (mousePosition.y * mouseInfluence - camera.rotation.x) * 0.1;
          camera.rotation.y += (mousePosition.x * mouseInfluence - camera.rotation.y) * 0.1;
          
          // Animate particle layers
          [particles1, particles2, particles3].forEach((particleSystem, layerIndex) => {
            const geometry = particleSystem.geometry;
            const positions = geometry.attributes.position.array;
            const velocities = geometry.userData.velocities;
            const speed = geometry.userData.speed;
            
            for (let i = 0; i < positions.length; i += 3) {
              // Organic movement with mouse influence
              positions[i] += velocities[i] + Math.sin(time + i * 0.01) * speed * 2;
              positions[i + 1] += velocities[i + 1] + Math.cos(time + i * 0.02) * speed * 2;
              positions[i + 2] += velocities[i + 2] + Math.sin(time * 0.5 + i * 0.01) * speed;
              
              // Mouse attraction effect
              const mouseInfluenceStrength = 0.001;
              const dx = (mousePosition.x / window.innerWidth - 0.5) * 20 - positions[i];
              const dy = -(mousePosition.y / window.innerHeight - 0.5) * 20 - positions[i + 1];
              
              positions[i] += dx * mouseInfluenceStrength;
              positions[i + 1] += dy * mouseInfluenceStrength;
              
              // Boundary wrapping
              if (positions[i] > 15) positions[i] = -15;
              if (positions[i] < -15) positions[i] = 15;
              if (positions[i + 1] > 15) positions[i + 1] = -15;
              if (positions[i + 1] < -15) positions[i + 1] = 15;
            }
            
            geometry.attributes.position.needsUpdate = true;
            
            // Layer rotation
            particleSystem.rotation.x += 0.0003 * (layerIndex + 1);
            particleSystem.rotation.y += 0.0005 * (layerIndex + 1);
          });
          
          // Animate floating shapes
          floatingShapes.forEach((shape, index) => {
            shape.rotation.x += 0.01 + index * 0.002;
            shape.rotation.y += 0.008 + index * 0.001;
            shape.position.y += Math.sin(time + index) * 0.01;
            
            // Pulsing effect
            const scale = 1 + Math.sin(time * 2 + index) * 0.3;
            shape.scale.setScalar(scale);
          });
          
          // Animate light beams
          lightBeams.forEach((beam, index) => {
            beam.rotation.z += 0.002;
            beam.material.opacity = 0.05 + Math.sin(time * 3 + index) * 0.1;
          });
          
          // Parallax effect based on scroll
          const scrollInfluence = scrollY * 0.0005;
          scene.rotation.y = scrollInfluence;
          
          renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      };
      
      document.head.appendChild(script);
    };

    initThreeJS();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [mousePosition, scrollY]);

  // Enhanced parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      
      // Multi-layer parallax
      const parallaxElements = document.querySelectorAll('.parallax-bg');
      parallaxElements.forEach((element, index) => {
        const speed = (index + 1) * 0.15;
        const yPos = scrolled * speed;
        element.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });
      
      // Hero content parallax
      const heroContent = document.querySelector('.hero-content');
      if (heroContent) {
        const rate = scrolled * -0.3;
        heroContent.style.transform = `translate3d(0, ${rate}px, 0)`;
      }
      
      // Floating elements
      const floatingElements = document.querySelectorAll('.floating-element');
      floatingElements.forEach((element, index) => {
        const speed = 0.1 + (index * 0.05);
        const yPos = Math.sin(scrolled * 0.002 + index) * 20 + scrolled * speed;
        element.style.transform = `translateY(${yPos}px) rotate(${scrolled * 0.1}deg)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Advanced intersection observer for staggered animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('animate-in');
          }, index * 100);
        }
      });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.scroll-animate');
    animateElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Magnetic button effect
  const handleButtonMouseMove = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
  };

  const handleButtonMouseLeave = (e) => {
    e.currentTarget.style.transform = 'translate(0, 0) scale(1)';
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Floating Icons Background */}
      <div className="floating-icons-container fixed inset-0 pointer-events-none z-0">
        {[...Array(12)].map((_, i) => {
          const icons = [Leaf, Tractor, Heart, Star, Sun, Sparkles];
          const Icon = icons[i % icons.length];
          return (
            <div
              key={i}
              className="floating-element absolute opacity-10 text-green-400"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                fontSize: `${Math.random() * 20 + 15}px`
              }}
            >
              <Icon />
            </div>
          );
        })}
      </div>

      {/* Hero Section with Enhanced Three.js Background */}
      <section className="relative h-[100vh] bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 text-white flex items-end justify-center overflow-hidden pb-16">
        <canvas 
          ref={heroCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        />
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent animate-pulse-slow" style={{ zIndex: 2 }}></div>
        
        {/* Enhanced parallax background elements */}
        <div className="parallax-bg absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="parallax-bg absolute top-40 right-20 w-24 h-24 bg-white/15 rounded-full blur-2xl animate-float-delayed"></div>
        <div className="parallax-bg absolute bottom-20 left-1/4 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-float-slow"></div>
        <div className="parallax-bg absolute top-1/2 right-10 w-20 h-20 bg-green-200/20 rounded-full blur-xl animate-bounce-slow"></div>
        
        {/* Morphing shapes */}
        <div className="absolute top-1/3 left-1/3 w-16 h-16 bg-gradient-to-r from-green-400/30 to-emerald-300/30 rounded-lg rotate-45 animate-morph"></div>
        <div className="absolute bottom-1/3 right-1/3 w-12 h-12 bg-gradient-to-r from-white/20 to-green-200/20 rounded-full animate-morph-delayed"></div>
        
        <div className="relative text-center px-4 max-w-5xl mx-auto hero-content" style={{ zIndex: 3 }}>
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight animate-fade-in-up">
            <span className="inline-block animate-text-glow">Farm Fresh,</span>
            <span className="block gradient-text-hero animate-text-shimmer">Direct to You</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-95 animate-fade-in-up max-w-3xl mx-auto leading-relaxed animate-type-writer" style={{ animationDelay: '0.2s' }}>
            Skip the grocery store. Connect with local farmers, get the freshest produce, and support your community—all while earning rewards for sustainable choices.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/register">
              <Button 
                size="lg" 
                className="magnetic-button bg-white text-green-700 hover:bg-green-50 transition-all duration-300 px-8 py-4 text-lg font-semibold"
                onMouseMove={handleButtonMouseMove}
                onMouseLeave={handleButtonMouseLeave}
              >
                <ShoppingCart className="mr-3 h-6 w-6" />
                Start Shopping Fresh
              </Button>
            </Link>
            <Link to="/register">
              <Button 
                size="lg" 
                className="magnetic-button bg-green-800 text-white hover:bg-green-900 transition-all duration-300 px-8 py-4 text-lg font-semibold border-2 border-green-700"
                onMouseMove={handleButtonMouseMove}
                onMouseLeave={handleButtonMouseLeave}
              >
                <Tractor className="mr-3 h-6 w-6" />
                List Your Farm
              </Button>
            </Link>
          </div>
          
          {/* Enhanced trust indicators with animations */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-green-100 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {[
              { icon: CheckCircle, text: "Direct Farm Connections" },
              { icon: CheckCircle, text: "Real-Time Order Tracking" },
              { icon: CheckCircle, text: "Blockchain Transparency" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2 animate-bounce-subtle" style={{ animationDelay: `${index * 0.2}s` }}>
                <item.icon className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Value Propositions */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="parallax-bg absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="parallax-bg absolute bottom-0 left-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl animate-float"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 gradient-text animate-text-reveal">Why Farm Direct Changes Everything</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
              We're not just another marketplace. We're building the future of food—fresher, fairer, and more sustainable for everyone.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Leaf,
                title: "Freshest Produce Guaranteed",
                description: "Get vegetables and fruits picked just hours before delivery. No more wilted lettuce or tasteless tomatoes—just farm-fresh quality every time.",
                color: "green"
              },
              {
                icon: Heart,
                title: "Support Your Local Community",
                description: "Every purchase directly supports local farming families. Your money stays in your community, creating jobs and preserving farmland.",
                color: "red"
              },
              {
                icon: DollarSign,
                title: "Better Prices, No Middlemen",
                description: "Cut out grocery store markups. Buy directly from farmers and save up to 30% while they earn more for their hard work.",
                color: "yellow"
              },
              {
                icon: MessageSquare,
                title: "Chat With Your Farmers",
                description: "Ask about growing methods, get cooking tips, or request specific items. Build real relationships with the people growing your food.",
                color: "blue"
              },
              {
                icon: Truck,
                title: "Convenient Delivery",
                description: "Track your orders in real-time with QR codes. Choose delivery or pickup options that fit your schedule—farm-fresh made easy.",
                color: "purple"
              },
              {
                icon: Target,
                title: "Help Farms Grow",
                description: "Support crowdfunding campaigns for new equipment, sustainable practices, or farm expansion. Be part of agriculture's future.",
                color: "indigo"
              }
            ].map((item, index) => (
              <Card 
                key={index}
                className="group hover:shadow-2xl transition-all duration-700 hover:-translate-y-4 border-2 hover:border-green-300 bg-gradient-to-br from-white to-green-50/30 scroll-animate card-hover-effect"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardHeader className="pb-4">
                  <div className="mx-auto mb-4 p-4 bg-green-100 rounded-2xl w-fit group-hover:bg-green-200 transition-all duration-500 group-hover:scale-125 group-hover:rotate-12">
                    <item.icon className={`w-10 h-10 text-${item.color}-600 group-hover:animate-pulse`} />
                  </div>
                  <CardTitle className="text-green-800 text-xl group-hover:text-green-900 transition-colors">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-700 leading-relaxed group-hover:text-gray-800 transition-colors">
                    {item.description}
                  </CardDescription>
                </CardContent>
                
                {/* Card glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/5 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg pointer-events-none"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced How it Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50/30 relative overflow-hidden">
        <div className="parallax-bg absolute -top-32 -left-32 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-60 animate-float"></div>
        <div className="parallax-bg absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-60 animate-float-delayed"></div>
        
        {/* Animated connecting lines */}
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-10">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <path d="M100,200 Q300,100 500,200 T900,200" stroke="url(#lineGradient)" strokeWidth="2" fill="none" className="animate-draw-line" />
            <path d="M200,400 Q400,300 600,400 T1000,400" stroke="url(#lineGradient)" strokeWidth="2" fill="none" className="animate-draw-line" style={{ animationDelay: '1s' }} />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 gradient-text animate-text-reveal">Getting Started is Simple</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up">
              Whether you're buying fresh produce or selling your harvest, we've made it incredibly easy
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* For Customers */}
            <div className="space-y-8 scroll-animate">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-bounce-gentle">
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-blue-800 animate-text-glow">For Food Lovers</h3>
              </div>
              
              <div className="space-y-6">
                {[
                  { step: 1, title: "Browse Local Farms", desc: "Discover farmers near you and see what's fresh and in season. Use our map to find the closest options." },
                  { step: 2, title: "Order & Chat", desc: "Add items to your cart and chat with farmers about their products, growing methods, or special requests." },
                  { step: 3, title: "Enjoy Fresh Delivery", desc: "Receive farm-fresh produce at your door or choose pickup. Track everything in real-time with QR codes." }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 scroll-animate step-animation" style={{ animationDelay: `${index * 0.2}s` }}>
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm animate-pulse-gentle">
                      {item.step}
                    </div>
                    <div className="group">
                      <h4 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                      <p className="text-gray-600 group-hover:text-gray-800 transition-colors">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Farmers */}
            <div className="space-y-8 scroll-animate">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 animate-bounce-gentle" style={{ animationDelay: '0.5s' }}>
                  <Tractor className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-green-800 animate-text-glow">For Farmers</h3>
              </div>
              
              <div className="space-y-6">
                {[
                  { step: 1, title: "Set Up Your Farm Profile", desc: "Create your profile, add photos of your farm, and tell your story. Get verified to build customer trust." },
                  { step: 2, title: "List Your Products", desc: "Add your produce with photos, prices, and availability. Manage inventory easily and connect with local buyers." },
                  { step: 3, title: "Grow Your Business", desc: "Process orders, chat with customers, and even run crowdfunding campaigns for farm improvements and expansion." }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 scroll-animate step-animation" style={{ animationDelay: `${index * 0.2 + 0.3}s` }}>
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm animate-pulse-gentle">
                      {item.step}
                    </div>
                    <div className="group">
                      <h4 className="text-lg font-semibold mb-2 group-hover:text-green-600 transition-colors">{item.title}</h4>
                      <p className="text-gray-600 group-hover:text-gray-800 transition-colors">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Community Benefits Section with Interactive Elements */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-green-400 rounded-full animate-spin-slow"></div>
          <div className="absolute top-40 right-20 w-16 h-16 border-2 border-emerald-400 rounded-lg animate-spin-reverse"></div>
          <div className="absolute bottom-20 left-1/3 w-24 h-24 border-2 border-green-300 rounded-full animate-pulse"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 gradient-text animate-text-reveal">Join the Farm Direct Community</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-up">
              Experience the benefits of connecting directly with local farmers and fellow food lovers in your area
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {[
              {
                icon: Star,
                title: "Build Trust & Transparency",
                description: "Know exactly where your food comes from, how it's grown, and who grows it. Chat directly with farmers about their methods and practices.",
                accent: "⭐",
                gradient: "from-yellow-400 to-orange-400"
              },
              {
                icon: Heart,
                title: "Strengthen Your Community",
                description: "Every purchase supports local farming families and keeps agricultural traditions alive in your area. Your money stays local and creates jobs.",
                accent: "💚",
                gradient: "from-red-400 to-pink-400"
              },
              {
                icon: Award,
                title: "Quality You Can Taste",
                description: "Experience the difference that fresh, locally-grown produce makes. No more bland supermarket vegetables - taste food as it's meant to be.",
                accent: "🏆",
                gradient: "from-yellow-400 to-amber-400"
              }
            ].map((item, index) => (
              <Card key={index} className="group p-6 border-2 hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 hover:border-green-300 scroll-animate card-3d-hover relative overflow-hidden">
                {/* Card background glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                {/* Floating accent */}
                <div className="absolute top-4 right-4 text-2xl animate-float opacity-50 group-hover:opacity-100 transition-opacity">
                  {item.accent}
                </div>
                
                <div className="flex items-center mb-4 relative z-10">
                  {item.icon === Star && (
                    <div className="flex text-green-400 group-hover:scale-110 transition-transform">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current animate-twinkle" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  )}
                  {item.icon !== Star && (
                    <item.icon className="w-8 h-8 text-green-600 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-green-800 transition-colors relative z-10">{item.title}</h3>
                <p className="text-gray-700 leading-relaxed group-hover:text-gray-800 transition-colors relative z-10">
                  {item.description}
                </p>
                
                {/* Interactive hover element */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 via-green-500 to-emerald-400 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/15 rounded-full blur-xl animate-pulse-slow transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        {/* Particle rain effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-rain"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl font-bold mb-6 animate-text-glow">Ready to Taste the Difference?</h2>
          <p className="text-2xl mb-8 max-w-3xl mx-auto opacity-95 leading-relaxed animate-fade-in-up">
            Join to those who've already discovered fresher food, stronger communities, and a more sustainable way to eat.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Link to="/register">
              <Button 
                size="lg" 
                className="magnetic-button bg-white text-green-700 hover:bg-green-50 transition-all duration-300 px-10 py-5 text-xl font-semibold relative overflow-hidden"
                onMouseMove={handleButtonMouseMove}
                onMouseLeave={handleButtonMouseLeave}
              >
                <span className="relative z-10 flex items-center">
                  <ShoppingCart className="mr-3 h-6 w-6" />
                  Start Shopping Today
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-emerald-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Button>
            </Link>
            <Link to="/register">
              <Button 
                size="lg" 
                className="magnetic-button bg-green-800 text-white hover:bg-green-900 transition-all duration-300 px-10 py-5 text-xl font-semibold border-2 border-green-700 relative overflow-hidden"
                onMouseMove={handleButtonMouseMove}
                onMouseLeave={handleButtonMouseLeave}
              >
                <span className="relative z-10 flex items-center">
                  <Tractor className="mr-3 h-6 w-6" />
                  Start Selling Your Harvest
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Button>
            </Link>
          </div>
          
          {/* Enhanced final trust indicators */}
          <div className="final-cta-content">
            <div className="flex justify-center items-center gap-8 flex-wrap mb-6">
              {[
                "✓ Free to join",
                "✓ No setup fees", 
                "✓ Start selling in minutes",
                "✓ 24/7 support"
              ].map((item, index) => (
                <span key={index} className="text-lg opacity-90 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  {item}
                </span>
              ))}
            </div>
            <div className="text-sm opacity-75 animate-pulse">
              🌱 Join the sustainable food revolution today
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer with Animations */}
      <footer className="bg-gray-900 text-white py-16 relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 grid-rows-8 h-full w-full">
            {[...Array(96)].map((_, i) => (
              <div key={i} className="border border-green-400 animate-grid-fade" style={{ animationDelay: `${i * 0.02}s` }}></div>
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Company Info */}
            <div className="scroll-animate">
              <h3 className="text-2xl font-bold mb-6 flex items-center group">
                <Leaf className="mr-3 h-7 w-7 text-green-500 group-hover:animate-spin transition-all duration-300" />
                <span className="group-hover:text-green-400 transition-colors">Farm Direct</span>
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Connecting communities through fresh, local food. Supporting farmers, delighting customers, building a sustainable future.
              </p>
              <div className="flex space-x-4">
                {['f', '@', 'in'].map((social, index) => (
                  <div key={index} className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-600 transition-all duration-300 cursor-pointer hover:scale-110 hover:rotate-12">
                    <span className="text-sm font-bold">{social}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* For Customers */}
            <div className="scroll-animate">
              <h4 className="text-lg font-semibold mb-6 text-blue-400 flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                For Customers
              </h4>
              <ul className="space-y-3 text-gray-400">
                {[
                  { to: "/register", text: "Browse Fresh Produce" },
                  { to: "/campaigns", text: "Support Farm Projects" },
                  { to: "/login", text: "Track Your Orders" },
                  { to: "/about", text: "Why Choose Local" }
                ].map((link, index) => (
                  <li key={index}>
                    <Link to={link.to} className="hover:text-white hover:translate-x-2 transition-all duration-300 text-base inline-block">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Farmers */}
            <div className="scroll-animate">
              <h4 className="text-lg font-semibold mb-6 text-green-400 flex items-center">
                <Tractor className="mr-2 h-5 w-5" />
                For Farmers
              </h4>
              <ul className="space-y-3 text-gray-400">
                {[
                  { to: "/register", text: "Start Selling Today" },
                  { to: "/campaigns/create", text: "Launch a Campaign" },
                  { to: "/login", text: "Farmer Dashboard" },
                  { to: "/about", text: "Success Stories" }
                ].map((link, index) => (
                  <li key={index}>
                    <Link to={link.to} className="hover:text-white hover:translate-x-2 transition-all duration-300 text-base inline-block">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p className="text-lg animate-fade-in-up">
              &copy; 2025 Farm Direct. 
              <span className="inline-block animate-pulse ml-2">🌱</span> 
              Growing communities, one harvest at a time.
            </p>
          </div>
        </div>
      </footer>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(-10px); }
          50% { transform: translateY(-30px); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.1); }
        }

        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        @keyframes morph {
          0%, 100% { transform: rotate(45deg) scale(1); border-radius: 20%; }
          50% { transform: rotate(225deg) scale(1.2); border-radius: 50%; }
        }

        @keyframes morph-delayed {
          0%, 100% { transform: scale(1) rotate(0deg); border-radius: 50%; }
          50% { transform: scale(1.3) rotate(180deg); border-radius: 20%; }
        }

        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
          50% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.8); }
        }

        @keyframes text-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes text-reveal {
          from { 
            opacity: 0; 
            transform: translateY(50px); 
            filter: blur(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
            filter: blur(0); 
          }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }

        @keyframes rain {
          to { transform: translateY(100vh); }
        }

        @keyframes grid-fade {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }

        @keyframes draw-line {
          to { stroke-dashoffset: 0; }
        }

        @keyframes count-up {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes type-writer {
          from { width: 0; }
          to { width: 100%; }
        }

        /* Animation Classes */
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }

        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 4s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 5s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
        .animate-morph { animation: morph 6s ease-in-out infinite; }
        .animate-morph-delayed { animation: morph-delayed 7s ease-in-out infinite; }
        .animate-text-glow { animation: text-glow 2s ease-in-out infinite; }
        .animate-text-shimmer { 
          background: linear-gradient(45deg, #ffffff, #d1fae5, #ffffff);
          background-size: 400% 400%;
          animation: text-shimmer 3s ease-in-out infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .animate-text-reveal { animation: text-reveal 1.5s ease-out forwards; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-pulse-gentle { animation: pulse-gentle 2s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 6s linear infinite; }
        .animate-twinkle { animation: twinkle 1.5s ease-in-out infinite; }
        .animate-rain { animation: rain linear infinite; }
        .animate-grid-fade { animation: grid-fade 3s ease-in-out infinite; }
        .animate-draw-line { 
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw-line 3s ease-out forwards;
        }
        .animate-count-up { animation: count-up 0.8s ease-out forwards; }
        .animate-type-writer { 
          animation: type-writer 2s steps(40) forwards;
          white-space: nowrap;
          overflow: hidden;
        }

        /* Enhanced gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #16a34a, #059669, #047857);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gradient-text-hero {
          background: linear-gradient(135deg, #ffffff, #d1fae5, #bbf7d0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Parallax and 3D effects */
        .parallax-bg,
        .hero-content,
        .floating-element {
          will-change: transform;
        }

        .floating-element {
          animation: float 4s ease-in-out infinite;
        }

        /* Interactive effects */
        .magnetic-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover-effect:hover {
          transform: translateY(-16px) rotateX(5deg);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .card-3d-hover {
          perspective: 1000px;
          transform-style: preserve-3d;
        }

        .card-3d-hover:hover {
          transform: rotateY(5deg) rotateX(5deg) translateZ(20px);
        }

        /* Scroll-triggered animations */
        .scroll-animate {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scroll-animate.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .step-animation {
          transition-delay: var(--animation-delay, 0s);
        }

        .counter-animation {
          transition-delay: var(--animation-delay, 0s);
        }

        /* Performance optimizations */
        * {
          transition-property: transform, background-color, border-color, color, fill, stroke, opacity, box-shadow;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Smooth scroll */
        html {
          scroll-behavior: smooth;
        }

        /* Enhanced focus states for accessibility */
        button:focus,
        a:focus {
          outline: 2px solid #16a34a;
          outline-offset: 2px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .text-6xl { font-size: 3rem; }
          .text-7xl { font-size: 3.5rem; }
          .text-5xl { font-size: 2.5rem; }
          
          .card-hover-effect:hover,
          .card-3d-hover:hover {
            transform: translateY(-8px);
          }
        }

        /* Loading states */
        .loading {
          position: relative;
          overflow: hidden;
        }

        .loading::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: loading-shimmer 2s infinite;
        }

        @keyframes loading-shimmer {
          to { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Home;