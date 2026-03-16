import { Search, Bell, X, User as UserIcon, Calendar, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileSidebar } from "@/components/layout-components/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { authStore } from "@/lib/auth-store"
import { User } from "@/lib/types/auth"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavRoute {
  id: string;
  type: 'client' | 'trip' | 'quote' | 'page';
  title: string;
  subtitle: string;
  url: string;
  roles: string[];
}

const NAV_ROUTES: NavRoute[] = [
  { id: 'dashboard', type: 'page', title: 'Dashboard', subtitle: 'Overview of your agency\'s performance', url: '/dashboard', roles: ['Agency Agent', 'Agency Admin', 'Platform SuperAdmin'] },
  { id: 'quote-assistant', type: 'page', title: 'Quote Assistant', subtitle: 'AI-powered tool to help you create quotes', url: '/quote-assistant', roles: ['Agency Agent'] },
  { id: 'quotes', type: 'quote', title: 'Quotes', subtitle: 'View and manage your travel quotes', url: '/quotes', roles: ['Agency Agent'] },
  { id: 'manage-bookings', type: 'trip', title: 'Manage Bookings', subtitle: 'Track and manage confirmed bookings', url: '/manage-bookings', roles: ['Agency Agent'] },
  { id: 'clients', type: 'client', title: 'Clients', subtitle: 'Manage your client database', url: '/clients', roles: ['Agency Agent'] },
  { id: 'settings', type: 'page', title: 'Settings', subtitle: 'Configure your account and agency settings', url: '/settings', roles: ['Agency Agent'] },
  { id: 'manage-agents', type: 'client', title: 'Manage Agents', subtitle: 'Manage your agency\'s agents', url: '/manage-agents', roles: ['Agency Admin'] },
  { id: 'agent-analytics', type: 'page', title: 'Agent Analytics', subtitle: 'View performance metrics for agents', url: '/agent-analytics', roles: ['Agency Admin'] },
  { id: 'bookings-quotes', type: 'quote', title: 'Bookings & Quotes', subtitle: 'Overview of all bookings and quotes', url: '/bookings-quotes', roles: ['Agency Admin'] },
  { id: 'manage-suppliers', type: 'page', title: 'Manage Suppliers', subtitle: 'Manage your travel suppliers', url: '/manage-suppliers', roles: ['Agency Admin'] },
  { id: 'crm-overview', type: 'page', title: 'CRM Overview', subtitle: 'High-level CRM statistics', url: '/crm-overview', roles: ['Agency Admin'] },
  { id: 'manage-agencies', type: 'page', title: 'Manage Agency', subtitle: 'Manage all travel agencies', url: '/manage-agencies', roles: ['Platform SuperAdmin'] },
  { id: 'super-admin-crm-overview', type: 'page', title: 'CRM Overview', subtitle: 'Platform-wide CRM statistics', url: '/super-admin/crm-overview', roles: ['Platform SuperAdmin'] },
  { id: 'super-admin-hotels', type: 'page', title: 'Hotels', subtitle: 'Platform-wide CRM statistics', url: '/super-admin/hotels', roles: ['Platform SuperAdmin'] },
  { id: 'super-admin-flights', type: 'page', title: 'Flights', subtitle: 'Platform-wide CRM statistics', url: '/super-admin/flights', roles: ['Platform SuperAdmin'] },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<NavRoute[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUser(authStore.getUser())

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const userRole = user?.role || 'Agency Agent'
    
    if (searchQuery.length >= 2) {
      setIsSearching(true)
      const filtered = NAV_ROUTES.filter(route => {
        const matchesQuery = 
          route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
        const isAuthorized = route.roles.includes(userRole)
        return matchesQuery && isAuthorized
      })
      setSearchResults(filtered)
      setShowResults(true)
      setIsSearching(false)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchQuery, user])

  const getPageTitle = (path: string) => {
    if (path === '/quote-assistant') return 'AI Quote Assistant'
    if (path === '/quotes') return 'Quotes'
    if (path === '/clients') return 'Client Management'
    if (path === '/dashboard') return 'Dashboard'
    if (path === '/itinerary') return 'Itinerary'
    if (path === '/suppliers') return 'Suppliers'
    if (path === '/import') return 'Import'
    if (path === '/settings') return 'Settings'
    if (path === '/sop') return 'Standard Operating Procedures'
    if (path === '/manage-agents') return 'Manage Agents'
    if (path === '/agent-analytics') return 'Agent Analytics'
    if (path === '/bookings-quotes') return 'Bookings & Quotes'
    if (path === '/manage-suppliers') return 'Manage Suppliers'
    if (path === '/crm-overview') return 'CRM Overview'
    if (path === '/manage-bookings') return 'Manage Bookings'
    if (path === '/manage-agencies') return 'Manage Agency'
    if (path === '/super-admin/crm-overview') return 'CRM Overview'
    if (path === '/system-check') return 'System Check'
    if (path === '/super-admin/hotels') return 'Hotels'
    if (path === '/super-admin/flights') return 'Flights'
    return 'Dashboard'
  }

  const displayName = user ? (user.full_name || user.username) : 'Loading...'
  const agencyName = user?.agency_name || user?.role || 'Agency'

  const handleResultClick = (url: string) => {
    router.push(url)
    setShowResults(false)
    setSearchQuery("")
    setIsSearchOpen(false)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'client': return <UserIcon className="h-4 w-4 text-blue-500" />
      case 'trip': return <Calendar className="h-4 w-4 text-green-500" />
      case 'quote': return <FileText className="h-4 w-4 text-purple-500" />
      default: return <Search className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <header className="flex h-16 items-center justify-between bg-card px-4 md:px-6 relative z-50">
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
        <MobileSidebar />
        {isSearchOpen ? (
          <div className="relative flex-1 md:hidden max-w-md animate-in fade-in slide-in-from-left-5 duration-200">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-[#F7F8F8] pl-9 pr-4 text-sm outline-none focus:outline-none"
            />
          </div>
        ) : (
          <h1 className="text-base md:text-2xl font-bold truncate">{getPageTitle(pathname)}</h1>
        )}
      </div>
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search anything"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            className="h-9 w-40 lg:w-64 rounded-md border border-input bg-[#F7F8F8] pl-9 pr-4 text-sm outline-none focus:outline-none"
          />
          
          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md border shadow-lg max-h-[400px] overflow-y-auto z-[100]">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result.url)}
                      className="w-full flex items-start gap-3 px-4 py-2 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="mt-1">{getResultIcon(result.type)}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
              )}
            </div>
          )}
        </div>
        
        {/* Mobile Search Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden h-8 w-8"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          {isSearchOpen ? (
            <X className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>

        {/* <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-10 md:w-10">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Button> */}
        <TooltipProvider>
          <div className="flex items-center gap-3 border-l pl-3 md:pl-4">
             <div className="hidden text-sm md:block min-w-0 max-w-full">
              <p className="font-medium ">{displayName}</p> 
              <p className="text-xs text-muted-foreground block w-full">{agencyName}</p> 
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="h-8 w-8 rounded bg-[var(--primary-skyblue)] shrink-0 flex items-center justify-center text-white font-bold cursor-pointer"
                  onClick={() => user?.role === "Agency Agent" && router.push("/profile")}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-0.5">
                  <p className="font-bold text-sm">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{agencyName}</p>
                </div>
              </TooltipContent>
            </Tooltip>
            
           
          </div>
        </TooltipProvider>
      </div>
      
      {/* Mobile Search Results */}
      {isSearchOpen && showResults && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg max-h-[60vh] overflow-y-auto md:hidden z-[100]">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result.url)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b last:border-0"
                >
                  <div className="mt-1">{getResultIcon(result.type)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
          )}
        </div>
      )}
    </header>
  )
}
