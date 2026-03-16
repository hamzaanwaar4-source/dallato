import { useState, useMemo } from "react"
import { Search, Plus, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Client } from "@/lib/types/clients"

interface ClientListProps {
  clients: Client[]
  selectedClientId: string | null
  onSelectClient: (client: Client) => void
  onAddClient: () => void
}

function formatTimeAgo(dateString: string) {
  if (!dateString) return ""
  const date = new Date(dateString)
  const now = new Date()

  // Reset time part to compare just the dates
  date.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)

  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return `${diffDays} days ago`
}

export function ClientList({ clients, selectedClientId, onSelectClient, onAddClient }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients

    const term = searchTerm.toLowerCase().trim()
    return clients.filter(client =>
      client.name.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term) ||
      (client.phone && client.phone.toLowerCase().includes(term))
    )
  }, [clients, searchTerm])

  return (
    <div className="flex flex-col md:h-full h-auto bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">All Client</h2>
          <Button size="icon" className="h-8 w-8 bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/90" onClick={onAddClient}>
            <Plus className="h-5 w-5 text-white" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Client"
            className="pl-9 bg-gray-50 border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 md:h-full h-auto">
        <div className="p-2 space-y-1">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left relative cursor-pointer ${selectedClientId === client.id
                    ? "bg-[#E0F2FE]" // Light blue background for selected
                    : "hover:bg-gray-50"
                  }`}
              >
                {/* Left Border Indicator for Selected State */}
                {selectedClientId === client.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary-skyblue)] rounded-l-xl" />
                )}

                {/* Avatar */}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 text-white ${client.color.includes('bg-') ? client.color : 'bg-blue-500'
                    }`}
                >
                  {client.initials}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-gray-900 truncate">
                      {client.name}
                    </p>
                    {client.isFavorite && (
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {client.email}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    {client.tags.map(tag => {
                      let tagColor = "bg-gray-100 text-gray-600";
                      if (tag === 'Single') tagColor = "bg-orange-100 text-orange-600";
                      if (tag === 'Couple') tagColor = "bg-purple-100 text-purple-600";
                      if (tag === 'Family/Friends') tagColor = "bg-blue-100 text-blue-600";
                      if (tag === 'Corporate') tagColor = "bg-red-100 text-red-600";

                      return (
                        <span key={tag} className={`px-2 py-0.5 rounded text-[10px] font-medium ${tagColor}`}>
                          {tag}
                        </span>
                      )
                    })}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {formatTimeAgo(client.lastContact)}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No clients found matching {searchTerm}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
