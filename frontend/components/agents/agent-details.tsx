import { useState } from "react"
import { 
  Mail, 
  Phone, 
  MapPin, 
  TrendingUp, 
  Clock, 
  MapPin as MapPinIcon,
  Ban,
  Key,
  DollarSign,
  Trash2,
  Plus,
  Lock,
  User
} from "lucide-react"
import { Agent } from "@/lib/types/agents"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { agentsApi } from "@/lib/api/agents.api"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { SetCommissionModal } from "./set-commission-modal"

interface AgentDetailsProps {
  agent: Agent;
  onAgentDeleted?: () => void;
  onAgentUpdated?: () => void;
  isLoading?: boolean;
}

export function AgentDetails({ agent, onAgentDeleted, onAgentUpdated }: AgentDetailsProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  const handleDeleteAgent = async () => {
    try {
      setIsDeleting(true)
      await agentsApi.removeAgent(agent.id)
      toast.success("Agent removed successfully")
      if (onAgentDeleted) onAgentDeleted()
    } catch (error) {
      console.error("Failed to remove agent:", error)
      toast.error("Failed to remove agent")
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  const handleToggleStatus = async () => {
    try {
      setIsTogglingStatus(true)
      const newStatus = agent.status === 'Active' ? false : true
      await agentsApi.toggleAgentStatus(agent.id, newStatus)
      toast.success(`Agent ${newStatus ? 'activated' : 'deactivated'} successfully`)
      if (onAgentUpdated) onAgentUpdated()
    } catch (error) {
      console.error("Failed to toggle agent status:", error)
      toast.error("Failed to toggle agent status")
    } finally {
      setIsTogglingStatus(false)
      setIsStatusModalOpen(false)
    }
  }

  const handleSetCommission = async (commission: number) => {
    try {
      await agentsApi.setCommission(agent.id, commission)
      toast.success("Commission updated successfully")
      if (onAgentUpdated) onAgentUpdated()
    } catch (error) {
      console.error("Failed to set commission:", error)
      toast.error("Failed to set commission")
      throw error // Re-throw to let modal handle loading state if needed
    }
  }

  const handleResetPassword = async () => {
    const loadingToast = toast.loading("Sending password reset email...")
    try {
      await agentsApi.resetPassword(agent.email)
      toast.success("Password reset email sent successfully")
    } catch (error) {
      console.error("Failed to send password reset email:", error)
      toast.error("Failed to send password reset email")
    } finally {
      toast.dismiss(loadingToast)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
          <div className="h-16 w-16 rounded-full bg-[#43ABFF] flex items-center justify-center text-white font-bold text-2xl shrink-0">
            {agent.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
              <h2 className="text-xl md:text-2xl font-bold text-[#000E19] truncate">{agent.name}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm text-gray-500">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="truncate">{agent.email}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                {agent.phone}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="truncate">{agent.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#F8F9FA] p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Commission %</span>
              <TrendingUp className="h-4 w-4 text-[#00B69B]" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-[#000E19]">{agent.commission}%</div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00B69B] rounded-full" 
                style={{ width: `${agent.commission}%` }}
              />
            </div>
          </div>

          <div className="bg-[#F8F9FA] p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Total Clients</span>
              <User className="h-4 w-4 text-[#43ABFF]" />
            </div>
            <div className="text-2xl font-bold text-[#000E19]">{agent.clientsCount}</div>
          </div>

          <div className="bg-[#F8F9FA] p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Top Destination</span>
              <MapPin className="h-4 w-4 text-[#A855F7]" />
            </div>
            <div className="text-2xl font-bold text-[#000E19]">{agent.stats.topDestination}</div>
          </div>
        </div>

        {/* Travel Preferences / Actions */}
        <div className="space-y-4">
          <h3 className="font-bold text-[#000E19]">Travel Preferences</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { 
                label: agent.status === 'Active' ? "Deactivate Agent" : "Activate Agent", 
                icon: Ban, 
                color: agent.status === 'Active' ? "text-[#EE5D50]" : "text-[#00B69B]",
                onClick: () => setIsStatusModalOpen(true)
              },
              { label: "Reset Password", icon: Key, color: "text-[#43ABFF]", onClick: handleResetPassword },
              { label: "Set Commission", icon: DollarSign, color: "text-[#00B69B]", onClick: () => setIsCommissionModalOpen(true) },
              // { label: "Permissions", icon: Lock, color: "text-[#A855F7]" },
              { label: "Remove Agent", icon: Trash2, color: "text-[#EE5D50]", onClick: () => setIsDeleteModalOpen(true) },
            ].map((action, idx) => (
              <button 
                key={idx}
                onClick={action.onClick}
                className="flex flex-col items-center justify-center gap-2 p-3 md:p-4 bg-[#F8F9FA] rounded-xl hover:bg-gray-100 transition-colors group cursor-pointer"
              >
                <action.icon className={cn("h-5 w-5 md:h-6 md:w-6", action.color)} />
                <span className="text-[10px] font-bold text-[#000E19] text-center break-words">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {/* <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#000E19]">Recent Activity</h3>
            <button className="text-[#43ABFF] text-xs font-bold flex items-center gap-1">
              <Plus className="h-3 w-3" /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {agent.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-[#F8F9FA] rounded-xl">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                  activity.type === 'itinerary' ? "bg-[#E6F4FF]" : 
                  activity.type === 'booking' ? "bg-[#E6F9F1]" : "bg-[#F3E8FF]"
                )}>
                  {activity.type === 'itinerary' && <Mail className="h-5 w-5 text-[#43ABFF]" />}
                  {activity.type === 'booking' && <MapPin className="h-5 w-5 text-[#00B69B]" />}
                  {activity.type === 'quote' && <Mail className="h-5 w-5 text-[#A855F7]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#000E19]">{activity.action}</h4>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {activity.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{activity.target}</p>
                </div>
              </div>
            ))}
          </div> 
        </div>*/}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAgent}
        title="Remove Agent"
        description={`Are you sure you want to remove ${agent.name}? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Removing..." : "Remove Agent"}
        cancelLabel="Cancel"
        variant="destructive"
      />

      <ConfirmationModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleToggleStatus}
        title={agent.status === 'Active' ? "Deactivate Agent" : "Activate Agent"}
        description={`Are you sure you want to ${agent.status === 'Active' ? 'deactivate' : 'activate'} ${agent.name}?`}
        confirmLabel={isTogglingStatus ? (agent.status === 'Active' ? "Deactivating..." : "Activating...") : (agent.status === 'Active' ? "Deactivate" : "Activate")}
        cancelLabel="Cancel"
        variant={agent.status === 'Active' ? "destructive" : "default"}
      />

      <SetCommissionModal
        isOpen={isCommissionModalOpen}
        onClose={() => setIsCommissionModalOpen(false)}
        onConfirm={handleSetCommission}
        currentCommission={agent.commission?.toString()}
        agentName={agent.name}
      />
    </div>
  )
}
