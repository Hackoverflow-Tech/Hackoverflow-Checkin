/**
 * Home Page - Server Component with Data Fetching
 *
 * @module app/page
 * @description Main landing page with QR scan instructions
 *
 * Best Practices:
 * - Server Component by default (no 'use client')
 * - Hackoverflow 4.0 theme implementation
 */

import './hackoverflow-animations.css';
import { checkDatabaseConnectionAction } from '@/actions';
import { HomePageClient } from './HomePageClient';
import Image from 'next/image';

// ============================================================================
// Data Fetching Functions
// ============================================================================

async function getInitialData(): Promise<{
  connectionStatus: {
    success: boolean;
    data?: {
      message: string;
      database: string;
      collections: string[];
      participantCount: number;
    };
    error?: string;
  };
}> {
  const connectionResult = await checkDatabaseConnectionAction();

  if (!connectionResult.success) {
    return {
      connectionStatus: {
        success: false,
        error: connectionResult.error,
      },
    };
  }

  return {
    connectionStatus: {
      success: true,
      data: connectionResult.data,
    },
  };
}

// ============================================================================
// Main Page Component
// ============================================================================

export default async function HomePage() {
  const { connectionStatus } = await getInitialData();

  return (
    <div className="min-h-screen bg-[#0F0F0F] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#E85D24] to-[#D91B57] rounded-full blur-[120px] opacity-[0.08] animate-pulse-glow" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#FCB216] to-[#63205F] rounded-full blur-[120px] opacity-[0.08] animate-pulse-glow" style={{ animationDelay: '2s' }} />

      {/* Decorative Dots */}
      <div className="absolute top-20 left-20 w-1 h-1 bg-[#FCB216] rounded-full opacity-40 animate-float" />
      <div className="absolute top-40 right-32 w-1 h-1 bg-[#E85D24] rounded-full opacity-50 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 left-40 w-1 h-1 bg-[#D91B57] rounded-full opacity-40 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 right-20 w-1 h-1 bg-[#63205F] rounded-full opacity-60 animate-float" style={{ animationDelay: '3s' }} />

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header with Logo */}
        <header className="text-center mb-16 animate-fade-in-up">
          <div className="flex justify-center mb-8">
            <div className="relative w-48 h-48 md:w-64 md:h-64">
              <Image
                src="/images/Logo.png"
                alt="Hackoverflow 4.0 Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[#FCB216] via-[#E85D24] to-[#D91B57] bg-clip-text text-transparent tracking-wide">
            HACKOVERFLOW 4.0
          </h1>

          <div className="inline-block px-6 py-2 rounded-full bg-[rgba(231,88,41,0.15)] border border-[rgba(231,88,41,0.4)] mb-6">
            <span className="text-[#FCB216] text-sm font-semibold tracking-wider uppercase">
              Check-in System
            </span>
          </div>
        </header>

        {/* Main Content Card */}
        <div className="max-w-4xl mx-auto">
          <div
            className="bg-[rgba(255,255,255,0.03)] backdrop-blur-[10px] rounded-3xl border border-[rgba(255,255,255,0.1)] p-8 md:p-12 mb-8 transition-all duration-400 hover:bg-[rgba(231,88,41,0.08)] hover:border-[rgba(231,88,41,0.3)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(231,88,41,0.3)] animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            {/* QR Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-[#FCB216] via-[#E85D24] to-[#D91B57] p-1">
                <div className="w-full h-full bg-[#0F0F0F] rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-20 h-20 md:w-24 md:h-24 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-wide">
                Ready to Check In?
              </h2>

              <div className="max-w-2xl mx-auto space-y-4">
                <p className="text-xl md:text-2xl text-[rgba(255,255,255,0.9)] font-semibold">
                  Scan the QR code on your ID card
                </p>
                <p className="text-lg text-[rgba(255,255,255,0.6)] leading-relaxed">
                  Use your phone camera or any QR code scanner app to scan the unique QR code printed on your participant ID card. You&apos;ll be automatically redirected to complete your check-in.
                </p>
              </div>

              {/* Steps */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="bg-[rgba(255,255,255,0.05)] rounded-2xl p-6 border border-[rgba(255,255,255,0.1)] transition-all duration-300 hover:-translate-y-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FCB216] to-[#E85D24] flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                    1
                  </div>
                  <h3 className="text-white font-semibold mb-2">Locate QR Code</h3>
                  <p className="text-[rgba(255,255,255,0.6)] text-sm">
                    Find the QR code on your ID card
                  </p>
                </div>

                <div className="bg-[rgba(255,255,255,0.05)] rounded-2xl p-6 border border-[rgba(255,255,255,0.1)] transition-all duration-300 hover:-translate-y-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E85D24] to-[#D91B57] flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                    2
                  </div>
                  <h3 className="text-white font-semibold mb-2">Scan with Camera</h3>
                  <p className="text-[rgba(255,255,255,0.6)] text-sm">
                    Open your phone camera and point at the QR code
                  </p>
                </div>

                <div className="bg-[rgba(255,255,255,0.05)] rounded-2xl p-6 border border-[rgba(255,255,255,0.1)] transition-all duration-300 hover:-translate-y-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D91B57] to-[#63205F] flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                    3
                  </div>
                  <h3 className="text-white font-semibold mb-2">Complete Check-in</h3>
                  <p className="text-[rgba(255,255,255,0.6)] text-sm">
                    Confirm your details and you&apos;re all set!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fallback Manual Entry */}
          <div
            className="bg-[rgba(255,255,255,0.03)] backdrop-blur-[10px] rounded-2xl border border-[rgba(255,255,255,0.1)] p-6 text-center animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <p className="text-[rgba(255,255,255,0.6)] mb-4">
              Having trouble scanning? No worries!
            </p>
            <a
              href="/manual-checkin"
              className="inline-block px-6 py-3 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] text-white font-semibold transition-all duration-300 hover:bg-[rgba(231,88,41,0.15)] hover:border-[rgba(231,88,41,0.4)] hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(231,88,41,0.3)]"
            >
              Manual Check-in →
            </a>
          </div>
        </div>

        {/* Client Component for Connection Status (Hidden from main view) */}
        <HomePageClient initialConnectionStatus={connectionStatus} />
      </div>


    </div>
  );
}

// ============================================================================
// Metadata
// ============================================================================

export const metadata = {
  title: 'Hackoverflow 4.0 - Check-in System',
  description: 'Participant check-in for Hackoverflow 4.0',
};