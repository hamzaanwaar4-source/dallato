"use client"

import { useState, useEffect } from "react"
import { Agent, AgentDashboardStats } from "@/lib/types/agents"
import { agentsApi } from "@/lib/api/agents.api"
import { AgentStats } from "./agent-stats"
import { AgentList } from "./agent-list"
import { AgentDetails } from "./agent-details"
import { AddAgentModal } from "./add-agent-modal"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"

export function AgentsContent() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [stats, setStats] = useState<AgentDashboardStats | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [agentsData, statsData] = await Promise.all([
        agentsApi.getAgents(),
        agentsApi.getAgentStats()
      ])
      setAgents(agentsData)
      setStats(statsData)
      if (agentsData.length > 0 && !selectedAgent) {
        // Fetch details for the first agent
        fetchAgentDetail(agentsData[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch agents data", error)
      toast.error("Failed to load agents")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAgentDetail = async (agentId: string) => {
    try {
      setIsLoadingDetail(true)
      const detailData = await agentsApi.getAgentDetail(agentId)
      if (detailData) {
        setSelectedAgent(detailData)
      }
    } catch (error) {
      console.error("Failed to fetch agent detail", error)
      toast.error("Failed to load agent details")
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    fetchAgentDetail(agent.id)
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Stats Row */}
      {stats && <AgentStats stats={stats} />}

      {/* Main Content: List & Details */}
      <div className="relative flex flex-col md:flex-row min-h-[calc(100vh-20rem)] md:h-[calc(100vh-20rem)] gap-6">
        {/* Left Column: List */}
        <div className={`w-full md:w-1/3 lg:w-1/4 h-full ${selectedAgent ? 'hidden md:block' : 'block'}`}>
          <AgentList 
            agents={agents}
            selectedAgentId={selectedAgent?.id || null}
            onSelectAgent={handleSelectAgent}
            onAddAgent={() => setIsAddModalOpen(true)}
          />
        </div>

        {/* Right Column: Details */}
        <div className={`flex-1 h-full md:overflow-hidden overflow-visible ${selectedAgent ? 'block' : 'hidden md:block'}`}>
          {selectedAgent ? (
            <div className="h-full flex flex-col mb-10">
              <div className="md:hidden mb-4">
                <button 
                  onClick={() => setSelectedAgent(null)}
                  className="text-sm text-blue-500 font-medium flex items-center gap-1"
                >
                  ← Back to Agents
                </button>
              </div>
              <AgentDetails 
                agent={selectedAgent} 
                onAgentDeleted={() => {
                  // Clear selection first to prevent detail fetch
                  setSelectedAgent(null)
                  // Then refetch the list
                  fetchData()
                }}
                onAgentUpdated={() => {
                  // Refetch both the details and the full list/stats
                  if (selectedAgent) {
                    fetchAgentDetail(selectedAgent.id)
                  }
                  fetchData()
                }}
                isLoading={isLoadingDetail}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground bg-white rounded-2xl border border-gray-200">
              Select an agent to view details
            </div>
          )}
        </div>
      </div>

      <AddAgentModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAgentAdded={() => {
          fetchData()
          setIsAddModalOpen(false)
        }}
      />
    </div>
  )
}
