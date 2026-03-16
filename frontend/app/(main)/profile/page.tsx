
"use client"

import { useEffect, useState } from 'react'
import { User, Mail, Phone, MapPin, Save, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { agentsApi } from '@/lib/api/agents.api'
import { AgentSettings } from '@/lib/types/agents'
import { toast } from 'sonner'
import { Loader } from '@/components/ui/loader'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AgentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: ''
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await agentsApi.getAgentSettings()
        setSettings(data)
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          location: data.location || ''
        })
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await agentsApi.updateAgentSettings(formData)
      toast.success('Settings updated successfully')
      setSettings(prev => prev ? { ...prev, ...formData } : null)
    } catch (error) {
      console.error('Failed to update settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex flex-col gap-1">
        <p className="text-[#64748B] text-sm sm:text-base">
          Manage your profile and account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Summary Card */}
        <Card className="p-6 border border-[#E2E8F0] rounded-[16px] shadow-sm bg-[#F8F9FA] h-fit">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#E6F4FF] flex items-center justify-center text-[#43ABFF]">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#0F172A]">{settings?.name}</h2>
              <p className="text-[14px] text-[#64748B]">{settings?.email}</p>
            </div>
            <div className="w-full pt-4 border-t border-[#E2E8F0] space-y-3">
              <div className="flex items-center gap-3 text-[13px] text-[#64748B]">
                <Phone className="w-4 h-4" />
                <span>{settings?.phone || 'No phone set'}</span>
              </div>
              <div className="flex items-center gap-3 text-[13px] text-[#64748B]">
                <MapPin className="w-4 h-4" />
                <span>{settings?.location || 'No location set'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Edit Profile Form */}
        <Card className="md:col-span-2 p-6 border border-[#E2E8F0] rounded-[16px] shadow-sm bg-white">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[14px] font-semibold text-[#0F172A]">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 border-[#E2E8F0] focus:ring-[#43ABFF] focus:border-[#43ABFF] rounded-[10px]"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[14px] font-semibold text-[#0F172A]">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <Input
                    id="email"
                    value={settings?.email}
                    disabled
                    className="pl-10 bg-[#F8F9FA] border-[#E2E8F0] text-[#64748B] rounded-[10px] cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-[#64748B]">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[14px] font-semibold text-[#0F172A]">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10 border-[#E2E8F0] focus:ring-[#43ABFF] focus:border-[#43ABFF] rounded-[10px]"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-[14px] font-semibold text-[#0F172A]">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="pl-10 border-[#E2E8F0] focus:ring-[#43ABFF] focus:border-[#43ABFF] rounded-[10px]"
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue-hover)] text-white px-8 py-2 rounded-[10px] flex items-center gap-2 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
