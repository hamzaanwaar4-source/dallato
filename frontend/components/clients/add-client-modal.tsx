import { useEffect, useState, useCallback } from "react"
import { useTravelAssistant } from "@/hooks/use-client-auto-fill"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mic, Sparkles, Users, Tag, MapPin, Utensils, Accessibility, Plus, Loader2, StopCircle, RefreshCw, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

import { clientsApi } from "@/lib/api/clients.api"
import { CreateClientPayload, UpdateClientPayload, FamilyMember } from "../../lib/api/clients"
import { toast } from "sonner"
import { Client } from "@/lib/types/clients"

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded?: () => void
  clientToEdit?: Client | null
}

const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; 
    return date.toISOString().split('T')[0];
}

export function AddClientModal({ isOpen, onClose, onClientAdded, clientToEdit }: AddClientModalProps) {
  const initialFormData = {
    clientName: "",
    clientType: "", 
    budget: "",
    style: "", 
    email: "",
    travelDate: "",
    destination: "",
    birthday: "",
    phoneNumber: "",
    origin: "",
    notes: "",
    commissionPercent: "0.00",
    membership: "",
    travelPreferences: [] as string[],
    groupMembers: [] as { name: string; type: 'adult' | 'child'; relation?: string }[]
  }

  const [formData, setFormData] = useState(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})


  const CLIENT_TYPE_OPTIONS = [
    { id: "Single", name: "Single" },
    { id: "Couple", name: "Couple" },
    { id: "Family/Friends", name: "Family/Friends" },
    { id: "Corporate", name: "Corporate" }
  ]

  const TRAVEL_STYLE_OPTIONS = [
    { id: "Luxury", name: "Luxury" },
    { id: "Budget", name: "Budget" },
    { id: "Adventure", name: "Adventure" },
    { id: "Business", name: "Business" },
    { id: "Family", name: "Family" }
  ]
  
  const MEMBERSHIP_OPTIONS = [
    { id: "GOLD", name: "Gold" },
    { id: "SILVER", name: "Silver" },
    { id: "PLATINUM", name: "Platinum" }
  ]

  useEffect(() => {
    if (clientToEdit) {
      // Map client type from display format to form format
      // The clientType in Client object might be "Couple" but we need to match it to our options
      const mapClientTypeToForm = (type: string): string => {
        const typeMap: Record<string, string> = {
          'Single': 'Single',
          'Couple': 'Couple',
          'Family/Friends': 'Family/Friends',
          'Family Friends': 'Family/Friends',
          'Corporate': 'Corporate'
        };
        return typeMap[type] || type;
      };

      // Map travel style from display format to form format
      const mapTravelStyleToForm = (style: string): string => {
        const styleMap: Record<string, string> = {
          'Luxury': 'Luxury',
          'Budget': 'Budget',
          'Adventure': 'Adventure',
          'Business': 'Business',
          'Family': 'Family'
        };
        return styleMap[style] || style;
      };

      setFormData({
        ...initialFormData,
        clientName: clientToEdit.name,
        email: clientToEdit.email,
        phoneNumber: clientToEdit.phone,
        origin: clientToEdit.location,
        budget: clientToEdit.budgetRange,
        style: mapTravelStyleToForm(clientToEdit.travelStyle),
        clientType: mapClientTypeToForm(clientToEdit.clientType),
        notes: clientToEdit.notes || "",
        destination: clientToEdit.destination || "",
        travelDate: clientToEdit.travelDate || "",
        birthday: clientToEdit.importantDates.find(d => d.type === 'Birthday')?.date || "",
        commissionPercent: clientToEdit.commissionPercent || "0.00",
        membership: clientToEdit.membership || "",
        groupMembers: clientToEdit.groupMembers.map(m => ({
          id: m.id,
          name: m.name,
          type: m.ageGroup?.toLowerCase() as 'adult' | 'child' || 'adult',
          relation: m.relation?.toLowerCase()
        })) || [],
      })
      // console.log('Edit modal - clientToEdit:', {
      //   notes: clientToEdit.notes,
      //   clientType: clientToEdit.clientType,
      //   travelStyle: clientToEdit.travelStyle,
      //   destination: clientToEdit.destination,
      //   travelDate: clientToEdit.travelDate
      // });
    } else {
      setFormData(initialFormData)
    }
  }, [clientToEdit, isOpen])

  const handleFieldUpdate = useCallback((args: any) => {
    setFormData(prev => ({
        ...prev,
        clientName: args.full_name || prev.clientName,
        clientType: args.client_type || prev.clientType,
        budget: args.budget || prev.budget,
        email: args.email || prev.email,
        travelDate: formatDateForInput(args.travel_date) || prev.travelDate,
        destination: args.destination || prev.destination,
        birthday: formatDateForInput(args.birthday) || prev.birthday,
        phoneNumber: args.phone_number || prev.phoneNumber,
        origin: args.origin || prev.origin,
        style: args.travel_style || prev.style,
        notes: args.notes || prev.notes,
        // Check for null/undefined specifically so '0' is accepted. Remove non-numeric chars (e.g. "10%" -> "10")
        commissionPercent: (args.commission !== undefined && args.commission !== null) ? String(args.commission).replace(/[^0-9.]/g, '') : prev.commissionPercent,
        // Force uppercase and fuzzy match to match select option IDs (Gold -> GOLD, Gold Member -> GOLD)
        membership: args.membership ? (() => {
            const m = args.membership.toUpperCase();
            if (m.includes('GOLD')) return 'GOLD';
            if (m.includes('SILVER')) return 'SILVER';
            if (m.includes('PLATINUM')) return 'PLATINUM';
            return prev.membership;
        })() : prev.membership,
        travelPreferences: args.travel_preferences ? [...new Set([...prev.travelPreferences, ...args.travel_preferences])] : prev.travelPreferences,
        groupMembers: args.group_family_members ? [...prev.groupMembers, ...args.group_family_members] : prev.groupMembers,
    }))
  }, [])

  const { 
    isRecording, 
    toggleRecording, 
    stopRecording,
    transcript, 
    activeField, 
    hasGeneratedData, 
    extractionError, 
    reset 
  } = useTravelAssistant({ onFieldUpdate: handleFieldUpdate })

  const handleClose = () => {
    stopRecording()
    setErrors({})
    onClose()
  }

  const handleClearForm = () => {
    setFormData(initialFormData)
    setErrors({})
    reset()
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client name is required"
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    
    if (!formData.clientType) {
      newErrors.clientType = "Client type is required"
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required"
    }
    
    if (!formData.commissionPercent || formData.commissionPercent.trim() === "") {
      newErrors.commissionPercent = "Commission is required"
    } else if (parseFloat(formData.commissionPercent) < 0 || parseFloat(formData.commissionPercent) > 100) {
      newErrors.commissionPercent = "Commission must be between 0 and 100"
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
      
      // Get agent_id from localStorage
      const agentId = localStorage.getItem('userId');
      
      // Map group members to family members with uppercase values
      const familyMembers: FamilyMember[] = formData.groupMembers.map(member => ({
        full_name: member.name,
        relation: member.relation?.toUpperCase() || 'OTHER',
        age_group: member.type === 'adult' ? 'ADULT' : 'CHILD'
      }));

      // Map client type and travel style to uppercase with underscores
      const mapClientType = (type: string): string => {
        const mapping: Record<string, string> = {
          'Single': 'SINGLE',
          'Couple': 'COUPLE',
          'Family/Friends': 'FAMILY_FRIENDS',
          'Corporate': 'CORPORATE'
        };
        return mapping[type] || type.toUpperCase().replace(/\s+/g, '_');
      };

      const mapTravelStyle = (style: string): string => {
        return style.toUpperCase();
      };
      
      const payload: CreateClientPayload = {
        agent_id: agentId ? parseInt(agentId) : undefined,
        full_name: formData.clientName,
        email: formData.email,
        phone: formData.phoneNumber,
        dob: formData.birthday || undefined,
        notes: formData.notes,
        budget_range: formData.budget,
        origin: formData.origin,
        destination: formData.destination,
        travel_date: formData.travelDate || undefined,
        client_type: formData.clientType ? mapClientType(formData.clientType) : undefined,
        travel_style: formData.style ? mapTravelStyle(formData.style) : undefined,
        commission_percent: formData.commissionPercent || "0.00",
        family_members: familyMembers.length > 0 ? familyMembers : undefined,
        membership: formData.membership || undefined,
      }

      if (clientToEdit) {
        await clientsApi.updateClient(parseInt(clientToEdit.id), payload as any)
        toast.success("Client updated successfully")
      } else {
        const response = await clientsApi.createClient(payload)
        toast.success(response.message || "Client created successfully")
      }
      
      if (onClientAdded) {
        onClientAdded()
      } else {
        handleClose()
      }
      
      if (!clientToEdit) {
          handleClearForm()
      }
    } catch (error) {
      console.error("Failed to save client", error)
      toast.error(clientToEdit ? "Failed to update client" : "Failed to create client")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      groupMembers: prev.groupMembers.filter((_, i) => i !== index)
    }))
  }

  const handleUpdateMember = (index: number, field: keyof typeof formData.groupMembers[0], value: string) => {
    setFormData(prev => ({
      ...prev,
      groupMembers: prev.groupMembers.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }))
  }

  const handleAddMember = () => {
    setFormData(prev => ({
      ...prev,
      groupMembers: [...prev.groupMembers, { name: "", type: "adult", relation: "" }]
    }))
  }

    return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="text-xl font-bold">{clientToEdit ? "Edit Client" : "Create New Client"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {clientToEdit ? "Edit the details of the existing client." : "Fill in the details to create a new client profile."}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-2 h-full">
            <div className="space-y-6 pb-6">
                {/* Voice Input */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className={`rounded-full p-1.5 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}>
                                <Mic className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold text-sm text-gray-900">
                                {isRecording ? "Listening..." : "Use Voice Input"}
                            </span>
                        </div>
                        <Button 
                            size="sm" 
                            variant={isRecording ? "destructive" : "default"}
                            onClick={toggleRecording}
                            className={isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"}
                        >
                            {isRecording ? (
                                <>
                                    <StopCircle className="h-3 w-3 mr-2" />
                                    Stop Session
                                </>
                            ) : (
                                <>
                                    <Mic className="h-3 w-3 mr-2" />
                                    Start Conversation
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <p className="text-xs text-muted-foreground italic mb-1">
                            {isRecording ? "Real-time analysis active..." : "Voice Input Detected:"}
                        </p>
                        <p className="text-sm text-gray-700 italic">
                            {isRecording 
                                ? (transcript || "Speak naturally. I'm listening and filling out the form...") 
                                : extractionError 
                                    ? <span className="text-red-500">{extractionError}</span>
                                    : "e.g., \"John & Deborah, retired couple, like luxury beachfront 5-star resorts, prefer premium rooms\""
                            }
                        </p>
                    </div>
                    {/* Debug Info - Commented out for production
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-gray-600">
                        <p>Status: {socketRef.current?.readyState === 1 ? "Connected" : "Disconnected"}</p>
                        <p>Transcript Length: {transcript.length}</p>
                    </div> */}
                </div>

                {/* Auto-Generated Banner */}
                {isRecording ? (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
                        <Loader2 className="h-5 w-5 text-blue-600 mt-0.5 animate-spin" />
                        <div>
                            <p className="font-bold text-sm text-blue-800">Listening & Analyzing...</p>
                            <p className="text-xs text-blue-700">I'm processing your voice input to extract client details.</p>
                        </div>
                    </div>
                ) : hasGeneratedData ? (
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm text-green-800">Profile Auto-Generated!</p>
                            <p className="text-xs text-green-700">I've analyzed your input and created a client profile. Review and edit as needed.</p>
                        </div>
                    </div>
                ) : null}

                {/* Basic Information */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-blue-500" />
                        <h3 className="font-bold text-sm text-gray-900">Basic Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="clientName" className="text-xs text-muted-foreground">
                                Client Name(s) <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                id="clientName" 
                                value={formData.clientName} 
                                onChange={(e) => {
                                    setFormData({...formData, clientName: e.target.value})
                                    if (errors.clientName) setErrors(prev => ({ ...prev, clientName: "" }))
                                }}
                                className={`bg-gray-50 border-none transition-all duration-300 ${activeField === 'clientName' ? 'ring-2 ring-blue-400 bg-blue-50' : ''} ${errors.clientName ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                            />
                            {errors.clientName && <p className="text-[10px] text-red-500 mt-1">{errors.clientName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="birthday" className="text-xs text-muted-foreground">Birthday</Label>
                            <Input 
                                id="birthday" 
                                type="date"
                                value={formData.birthday} 
                                onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                                className={`bg-gray-50 border-none transition-all duration-300 ${activeField === 'birthday' ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="clientType" className="text-xs text-muted-foreground">
                                Client Type <span className="text-red-500">*</span>
                            </Label>
                            <select 
                                id="clientType" 
                                value={formData.clientType} 
                                onChange={(e) => {
                                    setFormData({...formData, clientType: e.target.value})
                                    if (errors.clientType) setErrors(prev => ({ ...prev, clientType: "" }))
                                }}
                                className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.clientType ? 'ring-2 ring-red-400 bg-red-50 border-none' : ''}`}
                            >
                                <option value="">Select Type</option>
                                {CLIENT_TYPE_OPTIONS.map(type => (
                                    <option key={type.id} value={type.name}>{type.name}</option>
                                ))}
                            </select>
                            {errors.clientType && <p className="text-[10px] text-red-500 mt-1">{errors.clientType}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="membership" className="text-xs text-muted-foreground">
                                Membership
                            </Label>
                            <select 
                                id="membership" 
                                value={formData.membership} 
                                onChange={(e) => setFormData({...formData, membership: e.target.value})}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select Membership</option>
                                {MEMBERSHIP_OPTIONS.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs text-muted-foreground">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                id="email" 
                                value={formData.email} 
                                onChange={(e) => {
                                    setFormData({...formData, email: e.target.value})
                                    if (errors.email) setErrors(prev => ({ ...prev, email: "" }))
                                }}
                                placeholder="client@example.com"
                                className={`bg-gray-50 border-none transition-all duration-300 ${activeField === 'email' ? 'ring-2 ring-blue-400 bg-blue-50' : ''} ${errors.email ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                            />
                            {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phoneNumber" className="text-xs text-muted-foreground">
                                Phone Number <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                id="phoneNumber" 
                                value={formData.phoneNumber} 
                                onChange={(e) => {
                                    setFormData({...formData, phoneNumber: e.target.value})
                                    if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: "" }))
                                }}
                                placeholder="+1 234 567 8900"
                                className={`bg-gray-50 border-none transition-all duration-300 ${activeField === 'phoneNumber' ? 'ring-2 ring-blue-400 bg-blue-50' : ''} ${errors.phoneNumber ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                            />
                            {errors.phoneNumber && <p className="text-[10px] text-red-500 mt-1">{errors.phoneNumber}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="travelDate" className="text-xs text-muted-foreground">Travel Date</Label>
                            <Input 
                                id="travelDate" 
                                type="date"
                                value={formData.travelDate} 
                                onChange={(e) => setFormData({...formData, travelDate: e.target.value})}
                                className={`bg-gray-50 border-none transition-all duration-300 ${activeField === 'travelDate' ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="destination" className="text-xs text-muted-foreground">
                                Destination
                            </Label>
                            <Input 
                                id="destination" 
                                value={formData.destination} 
                                onChange={(e) => {
                                    setFormData({...formData, destination: e.target.value})
                                    if (errors.destination) setErrors(prev => ({ ...prev, destination: "" }))
                                }}
                                placeholder="Paris"
                                className={`bg-gray-50 border-none transition-all duration-300 ${activeField === 'destination' ? 'ring-2 ring-blue-400 bg-blue-50' : ''} ${errors.destination ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                            />
                            {errors.destination && <p className="text-[10px] text-red-500 mt-1">{errors.destination}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="origin" className="text-xs text-muted-foreground">Origin</Label>
                            <Input 
                                id="origin" 
                                value={formData.origin} 
                                onChange={(e) => setFormData({...formData, origin: e.target.value})}
                                placeholder="New York"
                                className={`bg-gray-50 border-none transition-all duration-300 ${activeField === 'origin' ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Travel Preferences */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Tag className="h-4 w-4 text-blue-500" />
                        <h3 className="font-bold text-sm text-gray-900">Travel Preferences</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="budget" className="text-xs text-muted-foreground">Budget Range</Label>
                            <Input 
                                id="budget" 
                                value={formData.budget} 
                                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                                className={`bg-gray-50 border-none transition-all duration-300 ${activeField === 'budget' ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="style" className="text-xs text-muted-foreground">Travel Style</Label>
                            <select 
                                id="style" 
                                value={formData.style} 
                                onChange={(e) => setFormData({...formData, style: e.target.value})}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select Style</option>
                                {TRAVEL_STYLE_OPTIONS.map(style => (
                                    <option key={style.id} value={style.name}>{style.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="commission" className="text-xs text-muted-foreground">
                                Commission % <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                id="commission" 
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.commissionPercent} 
                                onChange={(e) => {
                                    setFormData({...formData, commissionPercent: e.target.value})
                                    if (errors.commissionPercent) setErrors(prev => ({ ...prev, commissionPercent: "" }))
                                }}
                                placeholder="0.00"
                                className={`bg-gray-50 border-none transition-all duration-300 ${activeField === 'commission' ? 'ring-2 ring-blue-400 bg-blue-50' : ''} ${errors.commissionPercent ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                            />
                            {errors.commissionPercent && <p className="text-[10px] text-red-500 mt-1">{errors.commissionPercent}</p>}
                        </div>
                    </div>
                    {/* <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Preference Tags</Label>
                        <div className="flex flex-wrap gap-2">
                            {formData.travelPreferences.map(tag => (
                                <span key={tag} className="bg-[var(--primary-skyblue)] text-white text-xs font-medium px-3 py-1.5 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div> */}
                </div>

                {/* Suggested Destinations */}
                {/* <div>
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <h3 className="font-bold text-sm text-gray-900">Suggested Destinations</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['Maldives', 'Bora Bora', 'Santorini', 'Amalfi Coast'].map(dest => (
                            <div key={dest} className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex flex-col items-center justify-center text-center gap-2 h-20">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span className="text-xs font-bold text-gray-900">{dest}</span>
                            </div>
                        ))}
                    </div>
                </div> */}

                {/* Special Requirements */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Accessibility className="h-4 w-4 text-blue-500" />
                        <h3 className="font-bold text-sm text-gray-900">Notes & Special Requirements</h3>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Utensils className="h-3 w-3" /> General Notes (Dietary, Mobility, etc.)
                        </Label>
                        <textarea 
                            className={`w-full h-24 p-3 bg-gray-50 rounded-lg border-none resize-none text-sm placeholder:text-gray-400 focus:ring-0 focus:outline-none transition-all duration-300 ${activeField === 'notes' ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                            placeholder="e.g., Vegetarian, Wheelchair accessible, Anniversary trip..." 
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>
                </div>

                {/* Group/Family Members */}
                <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <h3 className="font-bold text-sm text-gray-900">Group/Family Members</h3>
                        </div>
                        <Button size="sm" onClick={handleAddMember} className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/90 h-7 text-xs text-white w-full sm:w-auto">
                            <Plus className="h-3 w-3 mr-1" /> Add Member
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Add spouse, children, or other traveling companions</p>
                    <div className="flex flex-col gap-3">
                        {formData.groupMembers.map((member, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-center bg-gray-50 p-2 rounded-lg">
                                <Input 
                                    value={member.name} 
                                    onChange={(e) => handleUpdateMember(idx, 'name', e.target.value)}
                                    className="bg-white border-gray-200 w-full" 
                                />
                                <div className="flex gap-3 w-full sm:w-auto items-center">
                                    <select 
                                        value={member.type}
                                        onChange={(e) => handleUpdateMember(idx, 'type', e.target.value as any)}
                                        className="flex h-10 w-full sm:w-[120px] items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="adult">Adult</option>
                                        <option value="child">Child</option>
                                    </select>
                                    <select 
                                        value={member.relation || 'relation'}
                                        onChange={(e) => handleUpdateMember(idx, 'relation', e.target.value)}
                                        className="flex h-10 w-full sm:w-[120px] items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="relation">Relation</option>
                                        <option value="spouse">Spouse</option>
                                        <option value="child">Child</option>
                                        <option value="friend">Friend</option>
                                        <option value="relative">Relative</option>
                                        <option value="colleague">Colleague</option>
                                    </select>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleRemoveMember(idx)}
                                        className="h-10 w-10 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 border-t border-gray-100 gap-3">
          <Button variant="outline" size="icon" onClick={handleClearForm} className="h-11 w-11 border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50" title="Clear Form">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleClose} className="flex-1 h-11 border-gray-200 text-gray-600">Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-11 bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/90 text-white font-bold"
          >
            {isSubmitting ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {clientToEdit ? "Saving..." : "Creating..."}
                </>
            ) : (
                <>
                    <Sparkles className="h-4 w-4 mr-2" /> {clientToEdit ? "Save Changes" : "Create Client Profile"}
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


