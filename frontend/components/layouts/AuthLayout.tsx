'use client';

import { Sparkles, Globe, CalendarDays, BotIcon } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-[900px] h-full min-h-[480px] md:h-auto md:max-h-[85vh] flex flex-col md:flex-row bg-white rounded-[16px] overflow-hidden shadow-xl border border-gray-100">
        
        {/* Left Column: Form Content */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-8 lg:p-14 bg-white">
          <div className="max-w-md w-full mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-[var(--primary-skyblue)] rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
              <span className="text-xl font-bold text-gray-900">AskTara</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-sm text-gray-500 mb-6">{subtitle}</p>

            {children}
          </div>
          
          {/* Footer */}
          <div className="mt-auto pt-8 text-xs text-gray-400 text-center md:text-left">
            2025 Tara. All Rights Reserved
          </div>
        </div>

        {/* Right Column: Feature Showcase */}
        <div className="hidden md:flex w-1/2 bg-[var(--primary-skyblue)]/90 relative overflow-hidden items-center justify-center p-6 lg:p-10">
          {/* Decorative Arcs with Radial Gradient */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[82%] left-0 -translate-y-1/2 -translate-x-1/2">
              <div 
                className="w-[760px] h-[760px] rounded-full blur-[4px]"
                style={{
                  background: 'radial-gradient(circle, #E2F6FC5C 0%, #48B7D600 100%)',
                  padding: '64px',
                  WebkitMaskImage: 'radial-gradient(circle, transparent calc(50% - 64px), black calc(50% - 64px))',
                  maskImage: 'radial-gradient(circle, transparent calc(50% - 64px), black calc(50% - 64px))'
                }}
              />
            </div>
            <div className="absolute top-[82%] left-0 -translate-y-1/2 -translate-x-1/2">
              <div 
                className="w-[620px] h-[620px] rounded-full blur-[2px]"
                style={{
                  background: 'radial-gradient(circle, #E2F6FC5C 0%, #48B7D600 100%)',
                  padding: '48px',
                  WebkitMaskImage: 'radial-gradient(circle, transparent calc(50% - 48px), black calc(50% - 48px))',
                  maskImage: 'radial-gradient(circle, transparent calc(50% - 48px), black calc(50% - 48px))'
                }}
              />
            </div>
            <div className="absolute top-[82%] left-0 -translate-y-1/2 -translate-x-1/2">
              <div 
                className="w-[470px] h-[470px] rounded-full blur-[1px]"
                style={{
                  background: 'radial-gradient(circle, #E2F6FC5C 0%, #48B7D600 100%)',
                  padding: '64px',
                  WebkitMaskImage: 'radial-gradient(circle, transparent calc(50% - 64px), black calc(50% - 64px))',
                  maskImage: 'radial-gradient(circle, transparent calc(50% - 64px), black calc(50% - 64px))'
                }}
              />
            </div>
          </div>

          {/* Glassmorphism Feature Box */}
          <div className="relative z-10 w-full max-w-[480px] h-full flex flex-col bg-white/10 backdrop-blur-[30px] border border-white/20 rounded-[16px] p-6 lg:p-8 shadow-2xl overflow-hidden">
            {/* Tara Logo in Glass Box */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Tara</h3>
                <p className="text-white/70 text-xs">Travel Agent</p>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-8 flex-1">
              <div className="flex gap-4 group">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <BotIcon className="text-white w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white text-base font-semibold mb-1">AI-Powered Assistance</h4>
                  <p className="text-white/60 text-xs leading-relaxed">
                    Create quotes, build itineraries, and manage bookings with intelligent AI suggestions
                  </p>
                </div>
              </div>

              <div className="flex gap-4 group">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <Globe className="text-white w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white text-base font-semibold mb-1">Global Supplier Network</h4>
                  <p className="text-white/60 text-xs leading-relaxed">
                    Access best rates from top suppliers worldwide with real-time pricing
                  </p>
                </div>
              </div>

              <div className="flex gap-4 group">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <CalendarDays className="text-white w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white text-base font-semibold mb-1">Smart Itinerary Builder</h4>
                  <p className="text-white/60 text-xs leading-relaxed">
                    Design perfect trips with drag-and-drop interface and automated conflict detection
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative Image Overlay - Girl with camera */}
            {/* <div className='absolute bottom-0 right-0 w-full h-1/2 pointer-events-none'>
              <Image
                src={girlImage}
                alt="Traveler"
                className="absolute bottom-0 left-60 right-0 w-[60%] h-auto object-contain opacity-90"
              />
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
