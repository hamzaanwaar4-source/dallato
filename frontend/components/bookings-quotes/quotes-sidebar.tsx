import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Quote } from "@/lib/types/bookings-quotes"
import { QuoteCard } from "./quote-card"

interface QuotesSidebarProps {
  quotes: Quote[];
  selectedQuoteId: string | null;
  onSelectQuote: (quote: Quote) => void;
  isLoading?: boolean;
}

export function QuotesSidebar({ quotes, selectedQuoteId, onSelectQuote, isLoading }: QuotesSidebarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <h2 className="text-xl font-bold text-[#000E19]">All Quotes</h2>
      </div>

      {/* Search & Filter */}
      <div className="px-6 mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search quotes..." 
            className="pl-10 bg-[#F8F9FA] border-none h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF]"
          />
        </div>
        {/* <button className="h-10 w-10 flex items-center justify-center bg-[#F8F9FA] rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
          <Filter className="h-4 w-4" />
        </button> */}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 w-full bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : quotes.length > 0 ? (
          quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              isSelected={selectedQuoteId === quote.id}
              onClick={() => onSelectQuote(quote)}
            />
          ))
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            No quotes found
          </div>
        )}
      </div>
    </div>
  );
}
