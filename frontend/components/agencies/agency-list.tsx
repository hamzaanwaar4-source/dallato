import { useState, useMemo } from "react"
import { Search, Plus, Building2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Agency } from "@/lib/types/agencies"
import { cn } from "@/lib/utils"

interface AgencyListProps {
  agencies: Agency[]
  selectedAgencyId: string | null
  onSelectAgency: (agency: Agency) => void
  onAddAgency: () => void
}

export function AgencyList({
  agencies,
  selectedAgencyId,
  onSelectAgency,
  onAddAgency,
}: AgencyListProps) {
  const [search, setSearch] = useState("")

  const filteredAgencies = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return agencies

    return agencies.filter((agency) => {
      const name = agency.name?.toLowerCase() || ""
      const email = agency.email?.toLowerCase() || ""
      const status = agency.status?.toLowerCase() || ""
      const initials = agency.initials?.toLowerCase() || ""

      return (
        name.includes(query) ||
        email.includes(query) ||
        status.includes(query) ||
        initials.includes(query)
      )
    })
  }, [agencies, search])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#000E19]">
          All Agencies ({filteredAgencies.length})
        </h2>
        <Button
          onClick={onAddAgency}
          size="icon"
          className="h-8 w-8 bg-[#43ABFF] hover:bg-[#43ABFF]/90 rounded-lg"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-6 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agency"
            className="pl-10 bg-[#F8F9FA] border-none h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAgencies.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No agencies found
          </div>
        ) : (
          filteredAgencies.map((agency) => (
            <button
              key={agency.id}
              onClick={() => onSelectAgency(agency)}
              className={cn(
                "w-full p-4 flex items-start gap-4 transition-colors border-l-4 text-left",
                selectedAgencyId === agency.id
                  ? "bg-[#E6F4FF] border-[#43ABFF]"
                  : "bg-white border-transparent hover:bg-gray-50 border-t border-gray-100"
              )}
            >
              <div className="h-12 w-12 rounded-full bg-[#43ABFF] flex items-center justify-center text-white font-bold text-lg shrink-0">
                {agency.initials || "?"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="font-bold text-[#000E19] truncate">
                    {agency.name || "Unnamed Agency"}
                  </h3>
                </div>

                <p className="text-xs text-muted-foreground truncate mb-2">
                  {agency.email}
                </p>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      agency.is_active === true
                        ? "bg-green-100 text-green-500"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {agency.is_active === true ? "Active" : "Inactive"}
                  </span>

                  {/* <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {agency.agentsCount ?? 0} agents
                  </span> */}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
