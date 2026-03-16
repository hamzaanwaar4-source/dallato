import { Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RecommendationItem } from "@/lib/types/dashboard"

interface RecommendationsProps {
  recommendations: RecommendationItem[];
}

export function Recommendations({ recommendations }: RecommendationsProps) {
  return (
    <Card className="flex flex-col bg-[#F9F5FF] !border-[#E9D4FF] border overflow-hidden">
      <CardHeader className="flex-none flex flex-row items-center gap-2 pb-4">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <CardTitle className="text-base">AI Recommendations</CardTitle>
      </CardHeader>
      
      {/* <div className="flex-none px-6 pb-4">
        <div className="flex gap-2">
          <Button className="w-full bg-[var(--primary-skyblue)] hover:bg-blue-600">Add to Quote</Button>
          <Button variant="outline" className="w-full">Send Email</Button>
        </div>
      </div> */}

      <CardContent className="flex-1 overflow-y-auto min-h-0 space-y-4 pt-0 pr-2 mr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="bg-white shrink-0 overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
            {rec.image && (
              <div className="relative h-32 w-full">
                <img 
                  src={rec.image} 
                  alt={rec.action} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                  <span className="font-bold text-green-600 text-xs">{rec.price}</span>
                </div>
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{rec.action}</h4>
                  <p className="text-xs text-muted-foreground">For {rec.name}</p>
                </div>
                {!rec.image && <span className="font-bold text-green-600 text-sm">{rec.price}</span>}
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground uppercase tracking-wider font-semibold">Match Probability</span>
                  <span className="font-bold text-purple-600">{rec.probability}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" 
                    style={{ width: `${rec.probability}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-purple-50/50 p-2 rounded-lg mb-4">
                <p className="text-[11px] text-purple-800 leading-relaxed italic">
                  "{rec.reason}"
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/90 text-xs h-9 rounded-lg">Add to Quote</Button>
                <Button size="sm" variant="outline" className="text-xs h-9 rounded-lg border-gray-200">Send Email</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}
