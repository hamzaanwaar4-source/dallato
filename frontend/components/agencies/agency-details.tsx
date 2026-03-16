"use client"

import { useState } from "react"
import { Agency } from "@/lib/types/agencies"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Mail, 
  Calendar, 
  Percent,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  Power
} from "lucide-react"
import { agenciesApi } from "@/lib/api/agencies.api"
import { toast } from "sonner"
import { Loader } from "@/components/ui/loader"
import { AddAgencyModal } from "./add-agency-modal"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { cn } from "@/lib/utils"

interface AgencyDetailsProps {
  agency: Agency;
  onAgencyDeleted: () => void;
  onAgencyUpdated: () => void;
  isLoading?: boolean;
}

export function AgencyDetails({ agency, onAgencyDeleted, onAgencyUpdated, isLoading }: AgencyDetailsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  const handleDeleteAgency = async () => {
    try {
      setIsDeleting(true)
      await agenciesApi.deleteAgency(agency.id)
      toast.success("Agency deleted successfully")
      onAgencyDeleted()
    } catch (error) {
      console.error("Failed to delete agency:", error)
      toast.error("Failed to delete agency")
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  const handleToggleStatus = async () => {
    try {
      setIsTogglingStatus(true)
      const newStatus = agency.status === 'Active' ? false : true
      await agenciesApi.toggleAgencyStatus(agency.id, newStatus)
      toast.success(`Agency ${newStatus ? 'activated' : 'deactivated'} successfully`)
      onAgencyUpdated()
    } catch (error) {
      console.error("Failed to toggle agency status:", error)
      toast.error("Failed to toggle agency status")
    } finally {
      setIsTogglingStatus(false)
      setIsStatusModalOpen(false)
    }
  }

  const handleEditComplete = () => {
    setIsEditModalOpen(false)
    onAgencyUpdated()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 h-full overflow-y-auto">
        {/* Header */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#43ABFF] flex items-center justify-center text-white font-bold text-2xl">
                {agency.initials}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#000E19]">{agency.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                    agency.status === 'Active' ? 'bg-[#E6F9F1] text-[#00B69B]' : 
                    agency.status === 'Suspended' ? 'bg-[#FFF0F0] text-[#EE5D50]' : 
                    'bg-[#F8F9FA] text-gray-500'
                  }`}>
                    {agency.status}
                  </span>
                  
                  {/* New Toggle Button */}
                  <Button
                    onClick={() => setIsStatusModalOpen(true)}
                    disabled={isTogglingStatus}
                    className={cn(
                      "h-8 px-4 rounded-full font-semibold text-xs shadow-sm transition-all duration-200 border",
                      agency.status === 'Active' 
                        ? "bg-white text-[#EE5D50] border-[#EE5D50] hover:bg-[#EE5D50] hover:text-white hover:shadow-md" 
                        : "bg-[#00B69B] text-white border-[#00B69B] hover:bg-[#00A085] hover:shadow-md"
                    )}
                  >
                    <Power className="h-3.5 w-3.5 mr-1.5" />
                    {isTogglingStatus ? (
                      agency.status === 'Active' ? 'Deactivating...' : 'Activating...'
                    ) : (
                      agency.status === 'Active' ? 'Deactivate' : 'Activate'
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditModalOpen(true)}
                className="h-9 w-9 text-[#43ABFF] hover:bg-blue-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isDeleting}
                className="h-9 w-9 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{agency.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Joined {new Date(agency.joinedDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-8 space-y-6">
          <h3 className="text-lg font-bold text-[#000E19] mb-4">Agency Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Agents</p>
                    <p className="text-xl font-bold text-[#000E19]">{agency.stats.totalAgents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Clients</p>
                    <p className="text-xl font-bold text-[#000E19]">{agency.stats.totalClients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Conversion Rate</p>
                    <p className="text-xl font-bold text-[#000E19]">{agency.stats.conversionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission Card */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="h-4 w-4 text-[#43ABFF]" />
                Default Agent Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#43ABFF]">{agency.commission}%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddAgencyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onAgencyAdded={handleEditComplete}
        agency={agency}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAgency}
        title="Delete Agency"
        description={`Are you sure you want to delete ${agency.name}? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Agency"}
        cancelLabel="Cancel"
        variant="destructive"
      />

      <ConfirmationModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleToggleStatus}
        title={agency.status === 'Active' ? "Deactivate Agency" : "Activate Agency"}
        description={`Are you sure you want to ${agency.status === 'Active' ? 'deactivate' : 'activate'} ${agency.name}?`}
        confirmLabel={isTogglingStatus ? (agency.status === 'Active' ? "Deactivating..." : "Activating...") : (agency.status === 'Active' ? "Deactivate" : "Activate")}
        cancelLabel="Cancel"
        variant={agency.status === 'Active' ? "destructive" : "default"}
      />
    </>
  )
}