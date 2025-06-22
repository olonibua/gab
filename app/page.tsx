'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { databaseService } from '@/lib/database';
import { Service } from '@/lib/types';
import { formatNairaFromKobo } from '@/lib/validations';
import { responsiveClasses as rc, animationClasses as ac } from '@/lib/animations';
import { Navbar } from '@/components/ui/navbar';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeaturedServices();
  }, []);

  const loadFeaturedServices = async () => {
    try {
      const response = await databaseService.getActiveServices();
      if (response.success && response.data) {
        // Get first 3 services for featured section
        setFeaturedServices(response.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden relative">
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-20 h-20 bg-purple-300/20 rounded-full animate-float animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-300/20 rounded-full animate-float animation-delay-4000"></div>
        </div>

        <div className={`${rc.container} py-16 sm:py-24 relative z-10`}>
          <div className="text-center">
            <div className={`${ac.fadeIn}`} style={{ animationDelay: '0.2s' }}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                Lagos Premier 
                <br />
                <span className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent inline-block transform hover:scale-105 transition-transform duration-500">
                  Laundry Service
                </span>
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                Professional laundry pickup and delivery service across Lagos State. 
                Perfect for busy professionals, entrepreneurs, and modern families.
              </p>
            </div>
            
            <div className={`flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mb-12 ${ac.slideIn}`} style={{ animationDelay: '0.4s' }}>
              <Link
                href={isAuthenticated ? "/book" : "/register"}
                className="group bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105 w-full sm:w-auto relative overflow-hidden shadow-xl hover:shadow-2xl"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Book Laundry Service
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </Link>
              <Link
                href="/services"
                className="group border-2 border-white/80 text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105 w-full sm:w-auto backdrop-blur-sm"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  View Services
                </span>
              </Link>
            </div>

            {/* Service Areas */}
            <div className={`text-center ${ac.fadeIn}`} style={{ animationDelay: '0.6s' }}>
              <p className="text-blue-200 mb-6 text-lg font-medium">🌍 Serving Lagos Areas:</p>
              <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
                {['Lagos Island', 'Victoria Island', 'Ikoyi', 'Lekki', 'Ikeja', 'Surulere', 'Yaba', 'Gbagada'].map((area, index) => (
                  <span
                    key={area}
                    className={`bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium transform hover:scale-110 transition-all duration-300 hover:bg-white/30 border border-white/20 ${ac.fadeIn}`}
                    style={{ animationDelay: `${0.6 + (index * 0.1)}s` }}
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {/* Trust indicators */}
            <div className={`flex flex-wrap justify-center items-center gap-6 md:gap-8 mt-12 ${ac.fadeIn}`} style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center text-blue-200">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">1000+ Happy Customers</span>
              </div>
              <div className="flex items-center text-blue-200">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Same Day Service</span>
              </div>
              <div className="flex items-center text-blue-200">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Eco-Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-white relative overflow-hidden">
        <div className={rc.container}>
          <div className={`text-center mb-16 ${ac.fadeIn}`}>
            <div className="inline-flex items-center bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Why Choose Us
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Lagos' Most Trusted 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Laundry Service</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We understand the fast-paced lifestyle in Lagos. That's why we've designed our service 
              to be as convenient, reliable, and professional as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                title: "Quick Pickup & Delivery",
                description: "Same-day pickup and 24-48 hour turnaround across Lagos State",
                gradient: "from-blue-500 to-blue-600",
                bgGradient: "from-blue-50 to-blue-100"
              },
              {
                icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                title: "Professional Quality",
                description: "Expert care for all fabric types with eco-friendly cleaning solutions",
                gradient: "from-emerald-500 to-emerald-600",
                bgGradient: "from-emerald-50 to-emerald-100"
              },
              {
                icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
                title: "Easy Online Booking",
                description: "Book online, track your order, and pay with multiple Nigerian payment options",
                gradient: "from-purple-500 to-purple-600",
                bgGradient: "from-purple-50 to-purple-100"
              }
            ].map((feature, index) => (
              <div 
                key={feature.title} 
                className={`text-center transform hover:scale-105 transition-all duration-300 bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl border border-gray-100 ${ac.slideIn}`}
                style={{ animationDelay: `${0.2 + (index * 0.2)}s` }}
              >
                <div className={`bg-gradient-to-r ${feature.bgGradient} rounded-2xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center group hover:scale-110 transition-all duration-300 shadow-lg`}>
                  <svg className={`w-8 h-8 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ stroke: `url(#gradient-${index})` }}>
                    <defs>
                      <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={feature.gradient.includes('blue') ? '#3b82f6' : feature.gradient.includes('emerald') ? '#10b981' : '#8b5cf6'} />
                        <stop offset="100%" stopColor={feature.gradient.includes('blue') ? '#2563eb' : feature.gradient.includes('emerald') ? '#059669' : '#7c3aed'} />
                      </linearGradient>
                    </defs>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-base lg:text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-transparent pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl"></div>
      </section>

      {/* Featured Services */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 relative">
        <div className={rc.container}>
          <div className={`text-center mb-16 ${ac.fadeIn}`}>
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Our Services
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Professional Laundry Services
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Tailored for Lagos</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From everyday essentials to delicate garments, we provide comprehensive laundry solutions 
              that fit your busy lifestyle.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`bg-white rounded-3xl shadow-lg p-8 animate-pulse ${ac.fadeIn}`} style={{ animationDelay: `${i * 0.2}s` }}>
                  <div className="h-6 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-6"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {featuredServices.map((service, index) => (
                <div 
                  key={service.$id} 
                  className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 p-8 transform hover:scale-105 hover:-translate-y-2 border border-gray-100 group ${ac.slideIn}`}
                  style={{ animationDelay: `${0.2 + (index * 0.2)}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">
                        {service.type === 'wash_and_fold' ? '🧺' : 
                         service.type === 'dry_cleaning' ? '👔' : 
                         service.type === 'ironing' ? '👕' : '🧽'}
                      </span>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600 capitalize">
                      {service.type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {service.description}
                  </p>
                  
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Starting from</span>
                      <span className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {formatNairaFromKobo(service.basePrice)}
                        {service.pricePerKg && <span className="text-sm text-gray-500 font-normal">/kg</span>}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/services?service=${service.$id}`}
                    className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-center py-3 px-6 rounded-2xl font-semibold transition-all duration-300 transform group-hover:scale-105"
                  >
                    Learn More
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className={`text-center mt-12 ${ac.fadeIn}`} style={{ animationDelay: '0.8s' }}>
            <Link
              href="/services"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105 transform shadow-xl hover:shadow-2xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              View All Services
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/30 via-indigo-100/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-gradient-to-r from-indigo-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-white relative overflow-hidden">
        <div className={rc.container}>
          <div className={`text-center mb-16 ${ac.fadeIn}`}>
            <div className="inline-flex items-center bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Simple Steps to 
              <span className="block bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Clean Clothes</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Getting your laundry done professionally has never been easier. 
              Just follow these simple steps and let us handle the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {[
              {
                number: 1,
                title: "Book Online",
                description: "Schedule pickup time and select your services",
                icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
                gradient: "from-blue-500 to-blue-600",
                bgGradient: "from-blue-50 to-blue-100"
              },
              {
                number: 2,
                title: "We Pickup",
                description: "Our team collects your laundry from your location",
                icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
                gradient: "from-emerald-500 to-emerald-600",
                bgGradient: "from-emerald-50 to-emerald-100"
              },
              {
                number: 3,
                title: "We Clean",
                description: "Professional cleaning with care and attention",
                icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                gradient: "from-purple-500 to-purple-600",
                bgGradient: "from-purple-50 to-purple-100"
              },
              {
                number: 4,
                title: "We Deliver",
                description: "Fresh, clean clothes delivered back to you",
                icon: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4",
                gradient: "from-amber-500 to-amber-600",
                bgGradient: "from-amber-50 to-amber-100"
              }
            ].map((step, index) => (
              <div 
                key={step.number}
                className={`text-center group ${ac.slideIn}`}
                style={{ animationDelay: `${0.2 + (index * 0.2)}s` }}
              >
                <div className="relative mb-6">
                  <div className={`bg-gradient-to-r ${step.bgGradient} rounded-3xl p-6 w-20 h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl`}>
                    <svg className={`w-8 h-8 text-${step.gradient.split('-')[1]}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                    </svg>
                  </div>
                  <div className={`absolute -bottom-2 -right-2 bg-gradient-to-r ${step.gradient} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg`}>
                    {step.number}
                  </div>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-white/5 opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className={`${ac.fadeIn}`}>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Ready to Experience
              <span className="block bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Lagos' Best Laundry Service?
              </span>
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
              Join thousands of satisfied customers across Lagos State. Book your first pickup today 
              and discover why we're the preferred choice for busy professionals and families.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
              <Link
                href={isAuthenticated ? "/book" : "/register"}
                className="group bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105 w-full sm:w-auto relative overflow-hidden shadow-xl hover:shadow-2xl"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {isAuthenticated ? "Book Now" : "Get Started Today"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </Link>
              
              <Link
                href="/services"
                className="group border-2 border-white/80 text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105 w-full sm:w-auto backdrop-blur-sm"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Explore Services
                </span>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center items-center gap-8 mt-12 opacity-80">
              <div className="flex items-center text-blue-200">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Trusted by 1000+ Customers</span>
              </div>
              <div className="flex items-center text-blue-200">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">100% Satisfaction Guarantee</span>
              </div>
              <div className="flex items-center text-blue-200">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Free Pickup & Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Gab'z Laundromat</h3>
              <p className="text-gray-400 mb-4">
                Lagos Premier Laundry Service providing convenient pickup and delivery 
                across Lagos State.
              </p>
              <p className="text-gray-400">
                📞 +234 800 000 0000<br />
                📧 hello@gabzlaundromat.com
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Wash & Fold</li>
                <li>Dry Cleaning</li>
                <li>Ironing Service</li>
                <li>Express Service</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Service Areas</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Lagos Island</li>
                <li>Victoria Island</li>
                <li>Ikoyi</li>
                <li>Lekki</li>
                <li>Ikeja</li>
                <li>Surulere</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Gab'z Laundromat. All rights reserved. | Lagos State, Nigeria</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
