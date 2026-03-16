import {
  MapPin,
  FileText,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovedQuote } from "@/lib/types/quotes";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";

interface ApprovedQuotesProps {
  quotes?: ApprovedQuote[];
  isLoading?: boolean;
}

export function ApprovedQuotes({
  quotes = [],
  isLoading = false,
}: ApprovedQuotesProps) {
  if (isLoading) {
    return (
      <Card className="border-b shadow-none bg-transparent p-6 mb-10">
        <CardHeader className="flex flex-row items-center justify-between px-0 pt-0 pb-6">
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-xl border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  // Filter for only 'Approved' status and limit to 4
  const approvedQuotes = quotes
    .filter((quote) => quote.status === "In Negotiation")
    .slice(0, 4);

  return (
    <Card className="border-b shadow-none bg-transparent p-6 mb-10">
      <CardHeader className="flex flex-row items-center justify-between px-0 pt-0 pb-6">
        <CardTitle className="text-xl font-bold">
          Pending client approval
        </CardTitle>
        <Link href="/manage-bookings">
          <Button className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/90 text-white text-xs font-medium h-8 px-4 rounded-lg flex items-center gap-2">
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="px-0">
        {approvedQuotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-white rounded-xl border border-dashed border-gray-200">
            No Quotes Found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedQuotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-[var(--primary-skyblue)]/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-[var(--primary-skyblue)] font-medium shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {quote.clientName}
                      </h4>
                      <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 mr-1" />
                        {quote.destination}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {quote.price}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {quote.quoteId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="flex items-center text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Ready on {quote.date}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {quote.status === "Approved" ? "Ready" : quote.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
