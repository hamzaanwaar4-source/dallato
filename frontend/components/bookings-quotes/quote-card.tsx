import { Clock } from "lucide-react"
import { Quote } from "@/lib/types/bookings-quotes"
import { cn } from "@/lib/utils"

interface QuoteCardProps {
  quote: Quote;
  isSelected: boolean;
  onClick: () => void;
}

export function QuoteCard({ quote, isSelected, onClick }: QuoteCardProps) {
  const statusColors: Record<string, string> = {
    DRAFT: "bg-[#F8F9FA] text-gray-500",
    INITIAL_CONTACT: "bg-[#FFF0F0] text-[#EE5D50]",
    QUOTE_SENT: "bg-[#E6F4FF] text-[#43ABFF]",
    IN_NEGOTIATION: "bg-[#FFF9E6] text-[#FFB800]",
    ACCEPTED: "bg-[#E6F9F1] text-[#00B69B]",
    DECLINED: "bg-[#FFF0F0] text-[#EE5D50]",
    VIEWED: "bg-[#E6F9F1] text-[#00B69B]",
    EXPIRED: "bg-[#FFF0F0] text-[#EE5D50]",
    // Legacy mappings
    Sent: "bg-[#E6F4FF] text-[#43ABFF]",
    Draft: "bg-[#F8F9FA] text-gray-500",
    Viewed: "bg-[#E6F9F1] text-[#00B69B]",
    Accepted: "bg-[#E6F9F1] text-[#00B69B]",
    Declined: "bg-[#FFF0F0] text-[#EE5D50]",
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 flex flex-col gap-3 transition-all border-2 text-left rounded-2xl mb-3 cursor-pointer",
        isSelected 
          ? "bg-[#E6F4FF] border-[#43ABFF] shadow-sm" 
          : "bg-white border-transparent hover:border-gray-100 hover:bg-gray-50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-[#000E19] truncate">{quote.quoteNumber}</h3>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0",
          statusColors[quote.status] || "bg-gray-100 text-gray-500"
        )}>
          {formatStatus(quote.status)}
        </span>
      </div>
      
      <div className="space-y-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium truncate">{quote.clientName}</p>
        <p className="text-sm font-bold text-[#000E19] truncate">{quote.destination}</p>
      </div>

      <div className="flex items-center justify-between mt-1 gap-2">
        <span className="text-lg font-bold text-[#43ABFF] shrink-0">{quote.value}</span>
        <span className="text-[10px] text-gray-400 flex items-center gap-1 truncate">
          <Clock className="h-3 w-3 shrink-0" />
          {quote.expiry}
        </span>
      </div>
    </button>
  );
}
