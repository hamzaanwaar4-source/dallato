"use client"

import { Construction } from "lucide-react"

export function UnderDevelopment() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full bg-white/80 backdrop-blur-md rounded-[2rem] border border-gray-100 p-12 text-center shadow-xl transition-all duration-500 hover:shadow-2xl">
      <div className="relative mb-8">
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-blue-400/20 blur-3xl rounded-full scale-150 animate-pulse" />
        
        {/* Icon container */}
        <div className="relative h-28 w-28 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-700 ease-out">
          <Construction className="h-14 w-14 text-white animate-bounce-slow" />
        </div>
      </div>

      <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
        Under Development
      </h2>
      
      <div className="space-y-4 max-w-md">
        <p className="text-xl text-gray-600 leading-relaxed">
          We have some changes in the flow currently, it's been under development.
        </p>
        
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-100">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Updating UI
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  )
}
