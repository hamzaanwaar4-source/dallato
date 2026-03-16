"use client"

import { useState, useEffect } from "react"
import { Client } from "@/lib/types/clients"
import { ClientList } from "./client-list"
import { ClientDetails } from "./client-details"
import { AddClientModal } from "./add-client-modal"
import { clientsApi, adaptClientToUI } from "@/lib/api/clients.api"
import { toast } from "sonner"
import { Loader } from "@/components/ui/loader"

interface ClientsContentProps {
  initialClients?: Client[] // Optional now as we fetch
}

export function ClientsContent({ initialClients = [] }: ClientsContentProps) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      const apiClients = await clientsApi.getClients()
      const uiClients = apiClients.map(adaptClientToUI)
      setClients(uiClients)

      // Auto-select first client on desktop if none selected
      if (!selectedClient && window.innerWidth >= 768 && uiClients.length > 0) {
        const firstClient = uiClients[0]
        try {
          setIsDetailLoading(true)
          const fullClient = await clientsApi.getClient(parseInt(firstClient.id))
          setSelectedClient(adaptClientToUI(fullClient))
        } catch (error) {
          console.error("Failed to fetch first client details", error)
          setSelectedClient(firstClient)
        } finally {
          setIsDetailLoading(false)
        }
      }
    } catch (error) {
      console.error("Failed to fetch clients", error)
      toast.error("Failed to load clients")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])


  const handleClientAdded = () => {
    fetchClients()
    setIsAddModalOpen(false)
  }

  return (
    <div className="relative flex flex-col md:flex-row min-h-[calc(100vh-6rem)] md:h-[calc(100vh-6rem)] gap-6">
      {/* Overlay Loader */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50">
          <Loader />
        </div>
      )}

      {/* Left Column: List */}
      <div className={`w-full md:w-1/3 lg:w-1/4 h-full ${selectedClient ? 'hidden md:block' : 'block'}`}>
        <ClientList
          clients={clients}
          selectedClientId={selectedClient?.id || null}
          onSelectClient={async (client) => {
            try {
              setIsDetailLoading(true)
              const fullClient = await clientsApi.getClient(parseInt(client.id))
              setSelectedClient(adaptClientToUI(fullClient))
            } catch (error) {
              console.error("Failed to fetch client details", error)
              toast.error("Failed to load client details")
              setSelectedClient(client) // Fallback to list data
            } finally {
              setIsDetailLoading(false)
            }
          }}
          onAddClient={() => setIsAddModalOpen(true)}
        />
      </div>

      {/* Right Column: Details */}
      <div className={`flex-1 h-full md:overflow-hidden overflow-visible ${selectedClient ? 'block' : 'hidden md:block'}`}>
        {selectedClient ? (
          <div className="h-full flex flex-col mb-10 relative">
            {isDetailLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 rounded-2xl">
                <Loader />
              </div>
            )}
            <div className="md:hidden mb-4">
              <button 
                onClick={() => setSelectedClient(null)}
                className="text-sm text-blue-500 font-medium flex items-center gap-1 cursor-pointer"
              >
                ← Back to Clients
              </button>
            </div>
            <ClientDetails 
              client={selectedClient} 
              onClientUpdated={async () => {
                if (selectedClient) {
                  try {
                    setIsDetailLoading(true)
                    const fullClient = await clientsApi.getClient(parseInt(selectedClient.id))
                    const updatedUIClient = adaptClientToUI(fullClient)
                    
                    // Update the selected client
                    setSelectedClient(updatedUIClient)
                    
                    // Update the client in the list locally
                    setClients(prevClients => 
                      prevClients.map(c => c.id === updatedUIClient.id ? updatedUIClient : c)
                    )
                  } catch (error) {
                    console.error("Failed to refresh client details", error)
                    toast.error("Failed to refresh client details")
                  } finally {
                    setIsDetailLoading(false)
                  }
                }
              }}
              onClientDeleted={() => {
                fetchClients()
                setSelectedClient(null)
              }}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground bg-white rounded-2xl border border-gray-200">
            Select a client to view details
          </div>
        )}
      </div>

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClientAdded={handleClientAdded}
      />
    </div>
  )
}
