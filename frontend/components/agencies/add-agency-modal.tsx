"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2 } from "lucide-react"
import { AddAgencyFormData, Agency } from "@/lib/types/agencies"
import { agenciesApi } from "@/lib/api/agencies.api"
import { toast } from "sonner"

interface AddAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgencyAdded?: () => void;
  agency?: Agency; // Optional agency for edit mode
}

export function AddAgencyModal({ isOpen, onClose, onAgencyAdded, agency }: AddAgencyModalProps) {
  const isEditMode = !!agency
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<AddAgencyFormData>({
    username: "",
    full_name: "",
    email: "",
    agency_name: "",
    default_currency: "USD",
    default_markup_percent: "",
    agent_commission: "",
  })

  // Pre-populate form data when editing
  useEffect(() => {
    if (agency && isOpen) {
      setFormData({
        username: "", // Not editable in edit mode
        full_name: "", // Not editable in edit mode
        email: agency.email,
        agency_name: agency.name,
        default_currency: "USD", // Could be extracted from agency if available
        default_markup_percent: "", // Would need to be in Agency type
        agent_commission: agency.commission?.toString() || "",
      })
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        username: "",
        full_name: "",
        email: "",
        agency_name: "",
        default_currency: "USD",
        default_markup_percent: "",
        agent_commission: "",
      })
    }
  }, [agency, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    // Only validate non-editable fields in add mode
    if (!isEditMode) {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required"
      }

      if (!formData.full_name.trim()) {
        newErrors.full_name = "Full name is required"
      }
      
      if (!formData.email.trim()) {
        newErrors.email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format"
      }
      
      if (!formData.agency_name.trim()) {
        newErrors.agency_name = "Agency name is required"
      }
    }
    
    // Always validate editable fields
    if (!formData.default_currency.trim()) {
      newErrors.default_currency = "Currency is required"
    }
    
    if (!formData.default_markup_percent.trim()) {
      newErrors.default_markup_percent = "Markup percent is required"
    }

    if (!formData.agent_commission.trim()) {
      newErrors.agent_commission = "Agent commission is required"
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
      if (isEditMode && agency) {
        // Update existing agency
        await agenciesApi.updateAgency(agency.id, {
          default_currency: formData.default_currency,
          default_markup_percent: formData.default_markup_percent,
          commission: formData.agent_commission,
        })
        toast.success("Agency updated successfully")
      } else {
        // Create new agency
        // @ts-ignore - custom property for interceptor
        const result = await agenciesApi.createAgency(formData, { _suppressToast: true })
        toast.success(result.message || "Agency created successfully")
      }
      if (onAgencyAdded) onAgencyAdded()
      handleClose()
    } catch (error: any) {
      console.error(isEditMode ? "Failed to update agency:" : "Failed to create agency:", error)
      
      const backendError = error.response?.data?.error || error.response?.data?.message || ""
      
      if (backendError.toLowerCase().includes("username")) {
        setErrors(prev => ({ ...prev, username: backendError }))
      } else if (backendError.toLowerCase().includes("email")) {
        setErrors(prev => ({ ...prev, email: backendError }))
      } else if (backendError.toLowerCase().includes("agency name")) {
        setErrors(prev => ({ ...prev, agency_name: backendError }))
      } else {
        toast.error(backendError || (isEditMode ? "Failed to update agency" : "Failed to create agency"))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      username: "",
      full_name: "",
      email: "",
      agency_name: "",
      default_currency: "USD",
      default_markup_percent: "",
      agent_commission: "",
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 bg-white border-none shadow-2xl rounded-2xl">
        <DialogHeader className="p-8 pb-6 border-b border-gray-100 relative">
          <DialogTitle className="text-3xl font-bold text-[#000E19]">
            {isEditMode ? "Edit Agency" : "Add New Agency"}
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-base mt-1">
            {isEditMode ? "Update agency settings and configuration" : "Create a new agency account and admin user"}
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* Admin Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[#43ABFF]">
              <Building2 className="h-5 w-5" />
              <h3 className="font-bold text-lg text-[#000E19]">Admin Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Admin Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-medium text-gray-400">
                  Admin Username {!isEditMode && '*'}
                </Label>
                <Input 
                  id="username"
                  placeholder="john_admin"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value })
                    if (errors.username) setErrors(prev => ({ ...prev, username: "" }))
                  }}
                  disabled={isEditMode}
                  readOnly={isEditMode}
                  className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''} ${errors.username ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
                />
                {errors.username && <p className="text-[10px] text-red-500 mt-1">{errors.username}</p>}
              </div>

              {/* Admin Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-xs font-medium text-gray-400">
                  Admin Full Name {!isEditMode && '*'}
                </Label>
                <Input 
                  id="full_name"
                  placeholder="John Smith"
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value })
                    if (errors.full_name) setErrors(prev => ({ ...prev, full_name: "" }))
                  }}
                  disabled={isEditMode}
                  readOnly={isEditMode}
                  className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''} ${errors.full_name ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
                />
                {errors.full_name && <p className="text-[10px] text-red-500 mt-1">{errors.full_name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="email" className="text-xs font-medium text-gray-400">
                  Admin Email Address {!isEditMode && '*'}
                </Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="admin@agency.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (errors.email) setErrors(prev => ({ ...prev, email: "" }))
                  }}
                  disabled={isEditMode}
                  readOnly={isEditMode}
                  className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''} ${errors.email ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
                />
                {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Agency Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[#43ABFF]">
              <Building2 className="h-5 w-5" />
              <h3 className="font-bold text-lg text-[#000E19]">Agency Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Agency Name */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="agency_name" className="text-xs font-medium text-gray-400">
                  Agency Name {!isEditMode && '*'}
                </Label>
                <Input 
                  id="agency_name"
                  placeholder="Global Travel Agency"
                  value={formData.agency_name}
                  onChange={(e) => {
                    setFormData({ ...formData, agency_name: e.target.value })
                    if (errors.agency_name) setErrors(prev => ({ ...prev, agency_name: "" }))
                  }}
                  disabled={isEditMode}
                  readOnly={isEditMode}
                  className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''} ${errors.agency_name ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
                />
                {errors.agency_name && <p className="text-[10px] text-red-500 mt-1">{errors.agency_name}</p>}
              </div>
              
              {/* Default Currency */}
              <div className="space-y-2">
                <Label htmlFor="default_currency" className="text-xs font-medium text-gray-400">Default Currency *</Label>
                <Input 
                  id="default_currency"
                  placeholder="USD"
                  maxLength={3}
                  value={formData.default_currency}
                  onChange={(e) => {
                    setFormData({ ...formData, default_currency: e.target.value.toUpperCase() })
                    if (errors.default_currency) setErrors(prev => ({ ...prev, default_currency: "" }))
                  }}
                  className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${errors.default_currency ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
                />
                {errors.default_currency && <p className="text-[10px] text-red-500 mt-1">{errors.default_currency}</p>}
              </div>

              {/* Default Markup Percent */}
              <div className="space-y-2">
                <Label htmlFor="default_markup_percent" className="text-xs font-medium text-gray-400">Default Markup % *</Label>
                <Input 
                  id="default_markup_percent"
                  type="number"
                  step="0.01"
                  placeholder="15.00"
                  value={formData.default_markup_percent}
                  onChange={(e) => {
                    setFormData({ ...formData, default_markup_percent: e.target.value })
                    if (errors.default_markup_percent) setErrors(prev => ({ ...prev, default_markup_percent: "" }))
                  }}
                  className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${errors.default_markup_percent ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
                />
                {errors.default_markup_percent && <p className="text-[10px] text-red-500 mt-1">{errors.default_markup_percent}</p>}
              </div>

              {/* Agent Commission */}
              <div className="space-y-2">
                <Label htmlFor="agent_commission" className="text-xs font-medium text-gray-400">Agent Commission % *</Label>
                <Input 
                  id="agent_commission"
                  type="number"
                  step="0.01"
                  placeholder="5.00"
                  value={formData.agent_commission}
                  onChange={(e) => {
                    setFormData({ ...formData, agent_commission: e.target.value })
                    if (errors.agent_commission) setErrors(prev => ({ ...prev, agent_commission: "" }))
                  }}
                  className={`bg-[#F8F9FA] border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] ${errors.agent_commission ? 'ring-1 ring-red-400 bg-red-50' : ''}`}
                />
                {errors.agent_commission && <p className="text-[10px] text-red-500 mt-1">{errors.agent_commission}</p>}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 pt-0 flex gap-4 sm:justify-between">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="flex-1 h-14 rounded-xl border-gray-200 text-gray-500 font-bold text-lg hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-14 rounded-xl bg-[#43ABFF] hover:bg-[#43ABFF]/90 text-white font-bold text-lg shadow-lg shadow-blue-100"
          >
            {isSubmitting 
              ? (isEditMode ? "Updating..." : "Creating...") 
              : (isEditMode ? "Update Agency" : "Create Agency Account")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
