"use client"

import { useState, useEffect } from "react"
import { Agency, AgencyDashboardStats } from "@/lib/types/agencies"
import { agenciesApi } from "@/lib/api/agencies.api"
import { AgencyStats } from "./agency-stats"
import { AgencyList } from "./agency-list"
import { AgencyDetails } from "./agency-details"
import { AddAgencyModal } from "./add-agency-modal"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"

export function AgenciesContent() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [stats, setStats] = useState<AgencyDashboardStats | null>(null)
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [agenciesData, statsData] = await Promise.all([
        agenciesApi.getAgencies(),
        agenciesApi.getAgencyStats()
      ])
      setAgencies(agenciesData)
      setStats(statsData)

      if (agenciesData.length > 0 && !selectedAgency) {
        fetchAgencyDetail(agenciesData[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch agencies data", error)
      toast.error("Failed to load agencies")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAgencyDetail = async (agencyId: string) => {
    try {
      setIsLoadingDetail(true)
      const detailData = await agenciesApi.getAgencyDetail(agencyId)
      if (detailData) {
        setSelectedAgency(detailData)
      }
    } catch (error) {
      console.error("Failed to fetch agency detail", error)
      toast.error("Failed to load agency details")
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleSelectAgency = (agency: Agency) => {
    setSelectedAgency(agency)
    fetchAgencyDetail(agency.id)
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
      {stats && <AgencyStats stats={stats} />}

      {/* Main Content: List & Details */}
      <div className="relative flex flex-col md:flex-row min-h-[calc(100vh-20rem)] md:h-[calc(100vh-20rem)] gap-6">
        {/* Left Column: List */}
        <div className={`w-full md:w-1/3 lg:w-1/4 h-full ${selectedAgency ? 'hidden md:block' : 'block'}`}>
          <AgencyList 
            agencies={agencies}
            selectedAgencyId={selectedAgency?.id || null}
            onSelectAgency={handleSelectAgency}
            onAddAgency={() => setIsAddModalOpen(true)}
          />
        </div>

        {/* Right Column: Details */}
        <div className={`flex-1 h-full md:overflow-hidden overflow-visible ${selectedAgency ? 'block' : 'hidden md:block'}`}>
          {selectedAgency ? (
            <div className="h-full flex flex-col mb-10">
              <div className="md:hidden mb-4">
                <button 
                  onClick={() => setSelectedAgency(null)}
                  className="text-sm text-blue-500 font-medium flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Agencies
                </button>
              </div>
              <AgencyDetails 
                agency={selectedAgency} 
                onAgencyDeleted={() => {
                  // Clear selection first to prevent detail fetch
                  setSelectedAgency(null)
                  // Then refetch the list
                  fetchData()
                }}
                onAgencyUpdated={() => {
                  // Only refetch the selected agency's details, not the full list
                  if (selectedAgency) {
                    fetchAgencyDetail(selectedAgency.id)
                  }
                }}
                isLoading={isLoadingDetail}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground bg-white rounded-2xl border border-gray-200">
              Select an agency to view details
            </div>
          )}
        </div>
      </div>

      {/* Add Agency Modal */}
      <AddAgencyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAgencyAdded={() => {
          fetchData()
          setIsAddModalOpen(false)
        }}
      />
    </div>
  )
}
