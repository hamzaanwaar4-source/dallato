"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface SetCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (commission: number) => Promise<void>;
  currentCommission?: string;
  agentName: string;
}

export function SetCommissionModal({ isOpen, onClose, onConfirm, currentCommission, agentName }: SetCommissionModalProps) {
  const [commission, setCommission] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCommission(currentCommission?.replace('%', '') || "")
    }
  }, [isOpen, currentCommission])

  const handleSubmit = async () => {
    const value = parseFloat(commission)
    if (isNaN(value) || value < 0 || value > 100) {
      toast.error("Please enter a valid percentage between 0 and 100")
      return
    }

    try {
      setIsSubmitting(true)
      await onConfirm(value)
      onClose()
    } catch (error) {
      // Error is handled by the caller usually, but we can catch here too
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Set Commission Rate</DialogTitle>
          <DialogDescription>
            Set the default commission rate for {agentName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="commission" className="text-right">
              Rate (%)
            </Label>
            <Input
              id="commission"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="col-span-3"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g. 15"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#43ABFF] hover:bg-[#43ABFF]/90 text-white">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
