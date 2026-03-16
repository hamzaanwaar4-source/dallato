import { Sparkles, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthSuggestion } from "@/lib/types/dashboard"
import { Badge } from "@/components/ui/badge"

import { Skeleton } from "@/components/ui/skeleton"

interface TravelSuggestionsProps {
  suggestions: MonthSuggestion[];
  isLoading?: boolean;
}

export function TravelSuggestions({ suggestions, isLoading = false }: TravelSuggestionsProps) {
  if (isLoading) {
    return (
      <Card className="flex flex-col bg-[#F9F5FF] !border-[#E9D4FF] border overflow-hidden h-[1200px]">
        <CardHeader className="flex-none flex flex-row items-center gap-2 pb-4">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <Skeleton className="h-6 w-40 bg-purple-100" />
        </CardHeader>
        <CardContent className="flex-1 space-y-6 pt-0 pr-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full bg-purple-100" />
                <Skeleton className="h-4 w-24 bg-purple-100" />
              </div>
              <Skeleton className="h-3 w-32 bg-purple-50" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Card key={j} className="bg-white border-none shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <div className="flex gap-1 pt-1">
                        <Skeleton className="h-4 w-12 rounded-full" />
                        <Skeleton className="h-4 w-12 rounded-full" />
                        <Skeleton className="h-4 w-12 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  // For now, just show the first month or all months. 
  // Let's show all months available in the response.
  
  return (
    <Card className="flex flex-col bg-[#F9F5FF] !border-[#E9D4FF] border overflow-hidden h-[1200px]">
      <CardHeader className="flex-none flex flex-row items-center gap-2 pb-4">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <CardTitle className="text-base">AI Travel Suggestions</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto min-h-0 space-y-6 pt-0 pr-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-purple-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        {suggestions.map((month) => (
          <div key={month.month_number} className="space-y-3">
             <div className="flex items-center gap-2 text-sm font-bold text-purple-700">
                <Calendar className="h-4 w-4" />
                {month.month_name}
             </div>
             <p className="text-xs text-muted-foreground italic">{month.season}</p>

             <div className="space-y-3">
                {month.destinations.map((dest, idx) => (
                    <Card key={idx} className="bg-white shrink-0">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-sm text-[#000E19]">{dest.name}</h4>
                                <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100">{dest.temperature}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {dest.why_visit}
                            </p>
                            <div className="flex flex-wrap gap-1 pt-1">
                                {dest.best_for.split(', ').map((tag, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
             </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
