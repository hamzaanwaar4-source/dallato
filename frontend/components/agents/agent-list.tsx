import { useState, useMemo } from "react"
import { Search, Plus, Users as UsersIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Agent } from "@/lib/types/agents"
import { cn } from "@/lib/utils"

interface AgentListProps {
  agents: Agent[]
  selectedAgentId: string | null
  onSelectAgent: (agent: Agent) => void
  onAddAgent: () => void
}

export function AgentList({
  agents,
  selectedAgentId,
  onSelectAgent,
  onAddAgent,
}: AgentListProps) {
  const [search, setSearch] = useState("")

  // Filter agents based on search
  const filteredAgents = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return agents

    return agents.filter((agent) =>
      agent.name.toLowerCase().includes(query) ||
      agent.email.toLowerCase().includes(query)
    )
  }, [agents, search])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#000E19]">
          All Agents ({filteredAgents.length})
        </h2>
        <Button
          onClick={onAddAgent}
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
            placeholder="Search agent"
            className="pl-10 bg-[#F8F9FA] border-none h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAgents.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No agents found
          </div>
        ) : (
          filteredAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent)}
              className={cn(
                "w-full p-4 flex items-start gap-4 transition-colors border-l-4 text-left",
                selectedAgentId === agent.id
                  ? "bg-[#E6F4FF] border-[#43ABFF]"
                  : "bg-white border-transparent hover:bg-gray-50 border-t border-gray-100"
              )}
            >
              <div className="h-12 w-12 rounded-full bg-[#43ABFF] flex items-center justify-center text-white font-bold text-lg shrink-0">
                {agent.initials}
              </div>

              <div className="flex-1 min-w-0 cursor-pointer">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="font-bold text-[#000E19] truncate">
                    {agent.name}
                  </h3>
                </div>

                <p className="text-xs text-muted-foreground truncate mb-2">
                  {agent.email}
                </p>

                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md",
                      agent.status === "Active"
                        ? "bg-[#E6F9F1] text-[#00B69B]"
                        : agent.status === "Suspended"
                        ? "bg-[#FFF0F0] text-[#EE5D50]"
                        : "bg-[#F8F9FA] text-gray-500"
                    )}
                  >
                    {agent.status}
                  </span>

                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <UsersIcon className="h-3 w-3" />
                    {agent.clientsCount} clients
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
