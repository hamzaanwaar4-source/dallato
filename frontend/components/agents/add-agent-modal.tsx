"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Mail, Phone, MapPin, Percent, ShieldCheck, X } from "lucide-react"
import { AddAgentFormData } from "@/lib/types/agent-management"
import { agentsApi } from "@/lib/api/agents.api"
import { toast } from "sonner"

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentAdded?: () => void;
}

const INITIAL_FORM_DATA: AddAgentFormData = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
  location: "",
  commission: "",
  permissions: {
    quoteAssistant: true,
    itineraryBuilder: true,
    crmAccess: true,
    supplierComparison: false,
    analyticsDashboard: false,
  }
}

export function AddAgentModal({ isOpen, onClose, onAgentAdded }: AddAgentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<AddAgentFormData>(INITIAL_FORM_DATA)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    }
    
    if (!formData.location.trim()) {
      newErrors.location = "Location is required"
    }
    
    if (!formData.commission.trim()) {
      newErrors.commission = "Commission is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly")
      return
    }

    try {
      setIsSubmitting(true)
      // @ts-ignore - custom property for interceptor
      await agentsApi.createAgent(formData, { _suppressToast: true })
      toast.success("Agent account created successfully")
      if (onAgentAdded) onAgentAdded()
      onClose()
    } catch (error: any) {
      console.error("Failed to create agent:", error)
      
      const backendError = error.response?.data?.error || error.response?.data?.message || ""
      
      if (backendError.toLowerCase().includes("username")) {
        setErrors(prev => ({ ...prev, username: backendError }))
      } else if (backendError.toLowerCase().includes("email")) {
        setErrors(prev => ({ ...prev, email: backendError }))
      } else {
        toast.error(backendError || "Failed to create agent account")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const permissionsList = [
    { id: "quoteAssistant", label: "Quote Assistant" },
    { id: "itineraryBuilder", label: "Itinerary Builder" },
    { id: "crmAccess", label: "CRM Access" },
    { id: "supplierComparison", label: "Supplier Comparison" },
    { id: "analyticsDashboard", label: "Analytics Dashboard" },
  ]

  const handleClose = () => {
    setErrors({})
    setFormData(INITIAL_FORM_DATA)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl">
        <DialogHeader className="p-8 pb-6 border-b border-gray-100 relative">
          <DialogTitle className="text-3xl font-bold text-[#000E19]">Add New Agent</DialogTitle>
          <DialogDescription className="text-gray-500 text-base mt-1">
            Create a new agent account and set permissions
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[#43ABFF]">
              <User className="h-5 w-5" />
              <h3 className="font-bold text-lg text-[#000E19]">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-medium text-gray-400">Full Name *</Label>
                <Input 
                  id="fullName"
                  placeholder="John & Deborah"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value })
                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: "" }))
                  }}
                  className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${errors.fullName ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
                />
                {errors.fullName && <p className="text-[10px] text-red-500 mt-1">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-medium text-gray-400">Username *</Label>
                <Input 
                  id="username"
                  placeholder="john_agent"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value })
                    if (errors.username) setErrors(prev => ({ ...prev, username: "" }))
                  }}
                  className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${errors.username ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
                />
                {errors.username && <p className="text-[10px] text-red-500 mt-1">{errors.username}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-gray-400">Email Address *</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="john@agency.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (errors.email) setErrors(prev => ({ ...prev, email: "" }))
                  }}
                  className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${errors.email ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
                />
                {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-medium text-gray-400">Phone Number *</Label>
                <Input 
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value })
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }))
                  }}
                  className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${errors.phone ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
                />
                {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-medium text-gray-400">Location *</Label>
                <Input 
                  id="location"
                  placeholder="New York, NY"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value })
                    if (errors.location) setErrors(prev => ({ ...prev, location: "" }))
                  }}
                  className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${errors.location ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
                />
                {errors.location && <p className="text-[10px] text-red-500 mt-1">{errors.location}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission" className="text-xs font-medium text-gray-400">Default Commission % *</Label>
              <Input 
                id="commission"
                type="number"
                step="0.01"
                placeholder="15.00"
                value={formData.commission}
                onChange={(e) => {
                  setFormData({ ...formData, commission: e.target.value })
                  if (errors.commission) setErrors(prev => ({ ...prev, commission: "" }))
                }}
                className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${errors.commission ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
              />
              {errors.commission && <p className="text-[10px] text-red-500 mt-1">{errors.commission}</p>}
            </div>
          </div>

          {/* Access Permissions */}
          {/* <div className="space-y-4">
            <h3 className="font-bold text-lg text-[#000E19]">Access Permissions</h3>
            <div className="space-y-3">
              {permissionsList.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-3">
                  <Checkbox 
                    id={permission.id} 
                    checked={formData.permissions[permission.id as keyof typeof formData.permissions]}
                    onCheckedChange={(checked) => 
                      setFormData({ 
                        ...formData, 
                        permissions: { 
                          ...formData.permissions, 
                          [permission.id]: !!checked 
                        } 
                      })
                    }
                    className="border-gray-300 data-[state=checked]:bg-[#43ABFF] data-[state=checked]:border-[#43ABFF] rounded"
                  />
                  <Label 
                    htmlFor={permission.id}
                    className="text-sm font-medium text-gray-500 cursor-pointer"
                  >
                    {permission.label}
                  </Label>
                </div>
              ))}
            </div>
          </div> */}
        </div>

        <DialogFooter className="p-8 pt-0 flex gap-4 sm:justify-between">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 h-14 rounded-xl border-gray-200 text-gray-500 font-bold text-lg hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-14 rounded-xl bg-[#43ABFF] hover:bg-[#43ABFF]/90 text-white font-bold text-lg shadow-lg shadow-blue-100"
          >
            {isSubmitting ? "Creating..." : "Create Agent Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
