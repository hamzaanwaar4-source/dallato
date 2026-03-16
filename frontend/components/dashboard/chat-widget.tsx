"use client"

import { useState } from "react"
import { MessageSquare, X, Send, Paperclip, Maximize2, Calendar, Users, DollarSign, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import QuoteAssitant from "@/app/assets/quotes/ShallowSeek.png"

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-48px)] sm:w-[380px] h-[calc(100vh-160px)] sm:h-[600px] sm:max-h-[calc(100vh-160px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden fixed sm:static bottom-24 right-6 sm:bottom-auto sm:right-auto font-sans">
          {/* Header */}
          <div className="bg-[#229EFF] p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center h-10 w-10 rounded-full">
                 {/* Logo placeholder */}
                 <Image src={QuoteAssitant} alt="Logo" className="h-10 w-10 rounded-full" />
                 <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-400 border-2 border-[#0099FF] rounded-full"></div>
              </div>
              <div>
                <h3 className="font-bold text-base">AI Assistant</h3>
                <p className="text-xs text-blue-100">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full h-8 w-8"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <ScrollArea className="flex-1 bg-white">
             <div className="p-4 space-y-6">
                {/* Quick Actions */}
                <div className="space-y-3">
                    <p className="text-xs text-center text-gray-500 font-medium">Quick actions:</p>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                        <Button variant="outline" className="h-auto py-3 px-2 flex items-center justify-start gap-2 bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200 text-gray-700 shadow-sm">
                            <Calendar className="h-4 w-4 text-black shrink-0" />
                            <span className="text-xs font-medium text-left whitespace-normal">Check upcoming trips</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-3 px-2 flex items-center justify-start gap-2 bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200 text-gray-700 shadow-sm">
                            <Users className="h-4 w-4 text-black shrink-0" />
                            <span className="text-xs font-medium text-left whitespace-normal">New clients summary</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-3 px-2 flex items-center justify-start gap-2 bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200 text-gray-700 shadow-sm">
                            <DollarSign className="h-4 w-4 text-black shrink-0" />
                            <span className="text-xs font-medium text-left whitespace-normal">Revenue insights</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-3 px-2 flex items-center justify-start gap-2 bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200 text-gray-700 shadow-sm">
                            <TrendingUp className="h-4 w-4 text-black shrink-0" />
                            <span className="text-xs font-medium text-left whitespace-normal">Performance tips</span>
                        </Button>
                    </div>
                </div>

                <div className="h-px bg-gray-100 w-full"></div>

                {/* Chat Messages */}
                <div className="space-y-4">
                    <div className="flex gap-3">
                            <Image src={QuoteAssitant} alt="Logo" className="h-8 w-8 rounded-full" />
                         <div className="space-y-2">
                             <span className="text-sm font-bold text-[#0099FF]">AI Assistant</span>
                             <p className="text-sm text-gray-600 leading-relaxed">
                                Hello! I&apos;m your AI assistant for Tara Agent Hub.
                                I can help you with booking insights, client
                                management, and revenue optimization. How
                                can I assist you today?
                             </p>
                         </div>
                    </div>

                    {/* Suggestion Chips */}
                    <div className="flex flex-wrap gap-2 pl-2 sm:pl-11">
                        <Button className="h-auto min-h-[32px] py-2 whitespace-normal text-left rounded-full bg-[#00C2E0] hover:bg-[#00C2E0]/90 text-white text-xs font-medium border-none px-4">
                            Show upcoming trips
                        </Button>
                        <Button className="h-auto min-h-[32px] py-2 whitespace-normal text-left rounded-full bg-[#00C2E0] hover:bg-[#00C2E0]/90 text-white text-xs font-medium border-none px-4">
                            Client insights
                        </Button>
                        <Button className="h-auto min-h-[32px] py-2 whitespace-normal text-left rounded-full bg-[#00C2E0] hover:bg-[#00C2E0]/90 text-white text-xs font-medium border-none px-4">
                            Analyze my revenue
                        </Button>
                        <Button className="h-auto min-h-[32px] py-2 whitespace-normal text-left rounded-full bg-[#00C2E0] hover:bg-[#00C2E0]/90 text-white text-xs font-medium border-none px-4">
                            Performance tips
                        </Button>
                    </div>
                </div>
             </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
            <div className="relative flex items-center gap-2">
              <Input
                placeholder="Ask me anything..."
                className="flex-1 bg-gray-50 border-gray-100 focus-visible:ring-[#0099FF] rounded-full pl-4 pr-12 h-11 text-sm shadow-sm"
              />
              <Button
                size="icon"
                className="bg-[#43ABFF] hover:bg-[#43ABFF]/90 h-9 w-9 rounded-full shrink-0 absolute right-1.5 top-1"
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen ? 'bg-[#0099FF] hover:bg-[#0099FF]/90 rotate-90' : 'bg-[#0099FF] hover:bg-[#0099FF]/90'
        }`}
      >
        {isOpen ? (
          <X className="h-7 w-7 text-white" />
        ) : (
          <>
            <MessageSquare className="h-7 w-7 text-white fill-current" />
            {/* Notification Badge */}
            <div className="absolute top-0 right-0 -mt-1 -mr-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
              <span className="text-white text-xs font-bold">1</span>
            </div>
          </>
        )}
      </button>
    </div>
  )
}
