"use client"

import { useState } from "react"
import { Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SuperAdminAgency } from "@/lib/api/dashboard.api"
import { cn } from "@/lib/utils"

interface AgencySelectorProps {
  agencies?: SuperAdminAgency[]
  selectedAgencyId?: string
  onSelect: (agencyId: string) => void
  className?: string
  placeholder?: string
}

export function AgencySelector({
  agencies = [],
  selectedAgencyId,
  onSelect,
  className,
  placeholder = "Select Agency",
}: AgencySelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filteredAgencies = agencies.filter((agency) =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedAgencyName = agencies.find(a => String(a.id) === selectedAgencyId)?.name || placeholder

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 md:h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm gap-2 px-2 md:px-3 min-w-[100px] md:min-w-[140px] justify-between font-normal text-xs md:text-sm",
            className
          )}
        >
          <span className="truncate max-w-[80px] md:max-w-[100px]">
            {selectedAgencyName}
          </span>
          <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        className="w-[90vw] sm:w-72 p-2"
      >
        <div className="relative mb-2 px-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search agencies..."
            className="pl-9 h-9 bg-gray-50 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto space-y-1">
          {filteredAgencies.length > 0 ? (
            filteredAgencies.map((agency) => (
              <DropdownMenuItem
                key={agency.id}
                className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                onClick={() => {
                  onSelect(String(agency.id))
                  setSearchTerm("")
                  setIsOpen(false)
                }}
              >
                <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {agency.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {agency.name}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No agencies found
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
