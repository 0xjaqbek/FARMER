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

  const [hoveredCard, setHoveredCard] = useState(null);
  const [clickedCard, setClickedCard] = useState(null);
  const [triggeredCards, setTriggeredCards] = useState(new Set()); // Track which cards have been triggered

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

        // Static animation loop without mouse/scroll interaction
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          
          const time = Date.now() * 0.001;
          
          // Animate particle layers with consistent movement only
          [particles1, particles2, particles3].forEach((particleSystem, layerIndex) => {
            const geometry = particleSystem.geometry;
            const positions = geometry.attributes.position.array;
            const velocities = geometry.userData.velocities;
            const speed = geometry.userData.speed;
            
            for (let i = 0; i < positions.length; i += 3) {
              // Smooth organic movement only
              const baseSpeed = speed * 60; // Normalize for 60fps
              positions[i] += velocities[i] * baseSpeed + Math.sin(time * 0.5 + i * 0.01) * 0.002;
              positions[i + 1] += velocities[i + 1] * baseSpeed + Math.cos(time * 0.3 + i * 0.02) * 0.002;
              positions[i + 2] += velocities[i + 2] * baseSpeed + Math.sin(time * 0.2 + i * 0.01) * 0.001;
              
              // Smooth boundary wrapping
              if (positions[i] > 15) positions[i] = -15;
              if (positions[i] < -15) positions[i] = 15;
              if (positions[i + 1] > 15) positions[i + 1] = -15;
              if (positions[i + 1] < -15) positions[i + 1] = 15;
            }
            
            geometry.attributes.position.needsUpdate = true;
            
            // Smooth layer rotation
            particleSystem.rotation.x += 0.0001 * (layerIndex + 1);
            particleSystem.rotation.y += 0.0002 * (layerIndex + 1);
          });
          
          // Animate floating shapes smoothly
          floatingShapes.forEach((shape, index) => {
            shape.rotation.x += 0.003 + index * 0.0005;
            shape.rotation.y += 0.002 + index * 0.0003;
            shape.position.y += Math.sin(time * 0.5 + index) * 0.003;
            
            // Smooth pulsing effect
            const scale = 1 + Math.sin(time + index) * 0.1;
            shape.scale.setScalar(scale);
          });
          
          // Animate light beams smoothly
          lightBeams.forEach((beam, index) => {
            beam.rotation.z += 0.0008;
            beam.material.opacity = 0.08 + Math.sin(time * 2 + index) * 0.05;
          });
          
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
  }, );

  // Smooth parallax scroll effect
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          
          // Multi-layer parallax with smooth transforms
          const parallaxElements = document.querySelectorAll('.parallax-bg');
          parallaxElements.forEach((element, index) => {
            const speed = (index + 1) * 0.1; // Reduced speed for smoothness
            const yPos = scrolled * speed;
            element.style.transform = `translate3d(0, ${yPos}px, 0)`;
          });
          
          // Hero content parallax
          const heroContent = document.querySelector('.hero-content');
          if (heroContent) {
            const rate = scrolled * -0.2; // Reduced intensity
            heroContent.style.transform = `translate3d(0, ${rate}px, 0)`;
          }
          
          // Floating elements with smooth movement
          const floatingElements = document.querySelectorAll('.floating-element');
          floatingElements.forEach((element, index) => {
            const speed = 0.05 + (index * 0.02); // Much gentler movement
            const yPos = Math.sin(scrolled * 0.001 + index) * 10 + scrolled * speed;
            const rotation = scrolled * 0.05; // Reduced rotation
            element.style.transform = `translateY(${yPos}px) rotate(${rotation}deg)`;
          });
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Advanced intersection observer for staggered animations and mobile click detection
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

    // Mobile click activation when cards are in viewport center (once only)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (isMobile) {
      const centerObserverOptions = {
        threshold: 0.5,
        rootMargin: '-40% 0px -40% 0px'
      };

      const centerObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target.classList.contains('mobile-click-card')) {
            if (entry.isIntersecting) {
              const cardIndex = parseInt(entry.target.dataset.cardIndex);
              
              // Only trigger if card hasn't been triggered before
              if (!isNaN(cardIndex) && !triggeredCards.has(cardIndex)) {
                setTriggeredCards(prev => new Set([...prev, cardIndex]));
                setClickedCard(cardIndex);
                
                // Clear clicked state after animation
                setTimeout(() => {
                  setClickedCard(null);
                }, 600);
              }
            }
          }
        });
      }, centerObserverOptions);

      const mobileClickCards = document.querySelectorAll('.mobile-click-card');
      mobileClickCards.forEach((card) => centerObserver.observe(card));

      return () => {
        observer.disconnect();
        centerObserver.disconnect();
      };
    }

    return () => observer.disconnect();
  }, [triggeredCards]);

  // Mobile click animation handler
  // Mobile click animation handler (one-time only)
  const handleCardClick = (index) => {
    if (!triggeredCards.has(index)) {
      setTriggeredCards(prev => new Set([...prev, index]));
      setClickedCard(index);
    }
  };

  // Smooth magnetic button effect
  const handleButtonMouseMove = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.1;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.1;
    
    // Use transform with translate3d for hardware acceleration
    button.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.02)`;
    button.style.transition = 'none'; // Remove transition during mouse move
  };

  const handleButtonMouseLeave = (e) => {
    const button = e.currentTarget;
    button.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    button.style.transform = 'translate3d(0, 0, 0) scale(1)';
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
        
<div className="relative text-center lg:text-center px-4 max-w-5xl mx-auto hero-content mt-40" style={{ zIndex: 3 }}>
  <h1 className="text-7xl sm:text-4xl md:text-8xl font-extrabold mb-6 leading-tight animate-fade-in-up">
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
          <div className="mt-12 flex flex-wrap justify-center items-center gap-4 lg:flex-row md:flex-row flex-col text-green-100 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
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
                  className={`group mobile-click-card transition-all duration-500 ease-out hover:shadow-2xl border-2 hover:border-green-300 bg-gradient-to-br from-white to-green-50/30 scroll-animate will-change-transform ${triggeredCards.has(index) ? 'mobile-triggered' : ''} ${triggeredCards.has(index) && clickedCard === index ? 'mobile-click-active' : ''}`}
                  data-card-index={index}
                  style={{ 
                    transform: (hoveredCard === index || triggeredCards.has(index)) ? 'translateY(-12px)' : 'translateY(0)',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => handleCardClick(index)}
                >
                <CardHeader className="pb-4">
                  <div className="mx-auto mb-4 p-4 bg-green-100 rounded-2xl w-fit transition-all duration-300 group-hover:bg-green-200 group-hover:scale-110">
                    <item.icon className={`w-10 h-10 text-${item.color}-600`} />
                  </div>
                  <CardTitle className="text-green-800 text-xl transition-colors duration-300 group-hover:text-green-900">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-700 leading-relaxed transition-colors duration-300 group-hover:text-gray-800">
                    {item.description}
                  </CardDescription>
                </CardContent>
                
                {/* Smooth card glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg pointer-events-none"></div>
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
                <Card key={index} className={`group mobile-click-card p-6 border-2 transition-all duration-500 ease-out hover:shadow-2xl hover:border-green-300 scroll-animate relative overflow-hidden will-change-transform ${triggeredCards.has(index + 10) ? 'mobile-triggered' : ''} ${triggeredCards.has(index + 10) && clickedCard === (index + 10) ? 'mobile-click-active' : ''}`}
                  data-card-index={index + 10}
                  style={{ 
                    transform: (hoveredCard === (index + 10) || triggeredCards.has(index + 10)) ? 'translateY(-8px)' : 'translateY(0)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={() => setHoveredCard(index + 10)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => handleCardClick(index + 10)}
                >
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
            Join those who've already discovered fresher food, stronger communities, and a more sustainable way to eat.
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
          {/* Mobile and Small Screen Layout */}
          <div className="block md:hidden">
            {/* Company Info - Full Width on Top */}
            <div className="mb-12 text-center">
              <h3 className="text-2xl font-bold mb-6 flex items-center justify-center group">
                <Leaf className="mr-3 h-7 w-7 text-green-500 group-hover:animate-spin transition-all duration-300" />
                <span className="group-hover:text-green-400 transition-colors">Farm Direct</span>
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Connecting communities through fresh, local food. Supporting farmers, delighting customers, building a sustainable future.
              </p>
              <div className="flex justify-center space-x-4">
                {['f', '@', 'in'].map((social, index) => (
                  <div key={index} className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-600 transition-all duration-300 cursor-pointer hover:scale-110 hover:rotate-12">
                    <span className="text-sm font-bold">{social}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Two Column Layout for Customers and Farmers */}
            <div className="grid grid-cols-2 gap-8">
              {/* For Customers */}
              <div>
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
                      <Link to={link.to} className="hover:text-white hover:translate-x-1 transition-all duration-300 text-sm inline-block">
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* For Farmers */}
              <div>
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
                      <Link to={link.to} className="hover:text-white hover:translate-x-1 transition-all duration-300 text-sm inline-block">
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Desktop Layout - 3 Columns (unchanged) */}
          <div className="hidden md:grid md:grid-cols-3 gap-12">
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

        /* Enhanced animations with better performance */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(-5px); }
          50% { transform: translateY(-15px); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.02); }
        }

        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }

        @keyframes morph {
          0%, 100% { transform: rotate(45deg) scale(1); border-radius: 20%; }
          50% { transform: rotate(135deg) scale(1.1); border-radius: 40%; }
        }

        @keyframes morph-delayed {
          0%, 100% { transform: scale(1) rotate(0deg); border-radius: 50%; }
          50% { transform: scale(1.1) rotate(90deg); border-radius: 30%; }
        }

        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
          50% { text-shadow: 0 0 15px rgba(255, 255, 255, 0.7); }
        }

        @keyframes text-reveal {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
            filter: blur(5px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
            filter: blur(0); 
          }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }

        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }

        @keyframes rain {
          to { transform: translateY(100vh); }
        }

        /* Optimized animation classes */
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }

        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-bounce-gentle { animation: bounce-gentle 2.5s ease-in-out infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 4s ease-in-out infinite; }
        .animate-morph { animation: morph 8s ease-in-out infinite; }
        .animate-morph-delayed { animation: morph-delayed 9s ease-in-out infinite; }
        .animate-text-glow { animation: text-glow 3s ease-in-out infinite; }
        .animate-text-reveal { animation: text-reveal 1s ease-out forwards; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-pulse-gentle { animation: pulse-gentle 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
        .animate-rain { animation: rain linear infinite; } 2s ease-in-out infinite; }
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

        /* Performance optimizations */
        .parallax-bg,
        .hero-content,
        .floating-element {
          will-change: transform;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }

        .floating-element {
          animation: float 6s ease-in-out infinite;
        }

        /* Smooth interactive effects */
        .magnetic-button {
          will-change: transform;
          backface-visibility: hidden;
        }

        /* Hardware acceleration for all transforms */
        * {
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }

        /* Smooth transitions */
        .transition-smooth {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Smooth scroll */
        html {
          scroll-behavior: smooth;
        }

        /* Enhanced focus states */
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
          
          /* Reduce motion for mobile */
          .animate-float,
          .animate-bounce-slow,
          .animate-morph {
            animation-duration: 8s;
          }
        }

        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }

        /* Mobile hover simulation */
        .mobile-hover-card.mobile-hover-active .group-hover:shadow-2xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .mobile-hover-card.mobile-hover-active .group-hover:border-green-300 {
          border-color: rgb(134 239 172);
        }

        .mobile-hover-card.mobile-hover-active .group-hover:bg-green-200 {
          background-color: rgb(187 247 208);
        }

        .mobile-hover-card.mobile-hover-active .group-hover:scale-110 {
          transform: scale(1.1);
        }

        .mobile-hover-card.mobile-hover-active .group-hover:scale-125 {
          transform: scale(1.25);
        }

        .mobile-hover-card.mobile-hover-active .group-hover:rotate-12 {
          transform: rotate(12deg) scale(1.25);
        }

        .mobile-hover-card.mobile-hover-active .group-hover:text-green-800 {
          color: rgb(22 101 52);
        }

        .mobile-hover-card.mobile-hover-active .group-hover:text-green-900 {
          color: rgb(20 83 45);
        }

        .mobile-hover-card.mobile-hover-active .group-hover:text-gray-800 {
          color: rgb(31 41 55);
        }

        .mobile-hover-card.mobile-hover-active .group-hover:text-green-600 {
          color: rgb(22 163 74);
        }

        .mobile-hover-card.mobile-hover-active .group-hover:opacity-100 {
          opacity: 1;
        }

        .mobile-hover-card.mobile-hover-active .group-hover:scale-x-100 {
          transform: scaleX(1);
        }

        /* Mobile-specific adjustments */
        @media (max-width: 768px) {
          .mobile-hover-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .mobile-hover-card.mobile-hover-active {
            transform: translateY(-8px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border-color: rgb(134 239 172);
          }

          /* Simulate all group-hover states on mobile */
          .mobile-hover-card.mobile-hover-active .group-hover:bg-green-200,
          .mobile-hover-card.mobile-hover-active *:hover {
            background-color: rgb(187 247 208) !important;
          }
        }
          /* Mobile click activation animations */
          .mobile-click-active {
            animation: cardClickPulse 0.6s ease-out;
          }

          @keyframes cardClickPulse {
            0% { 
              transform: translateY(0) scale(1); 
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            50% { 
              transform: translateY(-12px) scale(1.05); 
              box-shadow: 0 20px 25px -5px rgba(34, 197, 94, 0.3);
              border-color: rgb(134 239 172);
            }
            100% { 
              transform: translateY(-12px) scale(1); 
              box-shadow: 0 25px 50px -12px rgba(34, 197, 94, 0.25);
            }
          }

          .mobile-click-active .group-hover:bg-green-200,
          .mobile-click-active [class*="group-hover"] {
            background-color: rgb(187 247 208) !important;
            color: rgb(22 101 52) !important;
          }

          .mobile-click-active .group-hover:scale-110 {
            transform: scale(1.1);
            animation: iconBounce 0.4s ease-out;
          }

          @keyframes iconBounce {
            0%, 100% { transform: scale(1.1); }
            50% { transform: scale(1.25); }
          }

          /* Color wave animation */
          .mobile-click-active::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(45deg, 
              rgba(34, 197, 94, 0.1) 0%, 
              rgba(134, 239, 172, 0.2) 25%, 
              rgba(34, 197, 94, 0.1) 50%, 
              rgba(134, 239, 172, 0.2) 75%, 
              rgba(34, 197, 94, 0.1) 100%);
            animation: colorWave 0.6s ease-out;
            border-radius: 0.5rem;
            pointer-events: none;
          }

          /* Persistent triggered state */
.mobile-triggered {
  box-shadow: 0 20px 25px -5px rgba(34, 197, 94, 0.15);
  border-color: rgb(134 239 172);
}

.mobile-triggered .group-hover:bg-green-200 {
  background-color: rgb(187 247 208);
}

.mobile-triggered .group-hover:scale-110 {
  transform: scale(1.1);
}

.mobile-triggered .group-hover:scale-125 {
  transform: scale(1.25);
}

.mobile-triggered .group-hover:rotate-12 {
  transform: rotate(12deg) scale(1.25);
}

.mobile-triggered .group-hover:text-green-800 {
  color: rgb(22 101 52);
}

.mobile-triggered .group-hover:text-green-900 {
  color: rgb(20 83 45);
}

.mobile-triggered .group-hover:text-gray-800 {
  color: rgb(31 41 55);
}

.mobile-triggered .group-hover:text-green-600 {
  color: rgb(22 163 74);
}

/* Mobile click activation animations (temporary) */
.mobile-click-active {
  animation: cardClickPulse 1s ease-out;
}

@keyframes cardClickPulse {
  0% { 
    transform: translateY(-12px) scale(1); 
  }
  50% { 
    transform: translateY(-12px) scale(1.05); 
    box-shadow: 0 25px 30px -5px rgba(34, 197, 94, 0.4);
  }
  100% { 
    transform: translateY(-12px) scale(1); 
  }
}

      `}</style>
    </div>
  );
};

export default Home;