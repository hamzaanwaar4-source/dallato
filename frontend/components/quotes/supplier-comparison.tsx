"use client"
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import { getSuppliers } from "@/lib/api/quotes.api"
import { Supplier } from "@/lib/types/quotes"

export function SupplierComparison() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await getSuppliers()
        setSuppliers(data)
      } catch (error) {
        console.error("Failed to load suppliers:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSuppliers()
  }, [])

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading suppliers...</div>
  }

  return (
    <div className="space-y-4">
      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4">
        {suppliers.map((supplier, index) => (
          <div key={index} className={`rounded-lg border border-gray-100 overflow-hidden ${supplier.isRecommended ? 'bg-blue-50/30' : 'bg-white'}`}>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="font-medium flex items-center gap-1 text-sm sm:text-base">
                  {supplier.name}
                  {supplier.isRecommended && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                </div>
                <div className="font-bold text-base sm:text-lg">{supplier.price}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium text-gray-900 mr-2">Room:</span>
                  {supplier.roomType}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium text-gray-900 mr-2">Cancellation:</span>
                  {supplier.cancellation}
                </div>
              </div>

              <div className="flex gap-1 flex-wrap">
                <Badge variant="outline" className={`text-[9px] h-4.5 border-none ${supplier.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {supplier.status}
                </Badge>
                {supplier.tags?.map(tag => (
                  <Badge key={tag} variant="outline" className="text-[9px] h-4.5 border-none bg-orange-100 text-orange-700">
                    {tag}
                  </Badge>
                ))}
              </div>

              <Button size="sm" className="w-full h-9 text-xs bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/90 mt-2">
                Import
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View (Table with Horizontal Scroll) */}
      <div className="hidden md:block rounded-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-12 gap-4 p-2.5 bg-gray-50/50 text-[10px] font-bold text-gray-700 border-b border-gray-100 uppercase tracking-wider">
              <div className="col-span-2">Supplier</div>
              <div className="col-span-3">Room Type</div>
              <div className="col-span-1">Price</div>
              <div className="col-span-3">Cancellation</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            
            <div className="divide-y divide-gray-50">
              {suppliers.map((supplier, index) => (
                <div key={index} className={`grid grid-cols-12 gap-4 p-2.5 items-center text-xs ${supplier.isRecommended ? 'bg-blue-50/30' : 'bg-white'}`}>
                  <div className="col-span-2 font-medium flex items-center gap-1">
                    {supplier.name}
                    {supplier.isRecommended && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                  </div>
                  <div className="col-span-3 text-gray-500 truncate" title={supplier.roomType}>{supplier.roomType}</div>
                  <div className="col-span-1 font-bold">{supplier.price}</div>
                  <div className="col-span-3 text-[11px] font-medium text-gray-500">{supplier.cancellation}</div>
                  <div className="col-span-2 flex gap-1 flex-wrap">
                    <Badge variant="outline" className={`text-[9px] h-4.5 border-none ${supplier.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {supplier.status}
                    </Badge>
                    {supplier.tags?.map(tag => (
                      <Badge key={tag} variant="outline" className="text-[9px] h-4.5 border-none bg-orange-100 text-orange-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="col-span-1 text-right">
                    <Button size="sm" className="h-7 text-xs bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/90 mr-2">
                      Import
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
