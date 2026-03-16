import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConversationItem } from "@/lib/types/dashboard"

interface ConversationsProps {
  conversations: ConversationItem[];
}

export function Conversations({ conversations }: ConversationsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Active Conversations</CardTitle>
        <Button variant="link" className="text-xs text-blue-500">
          View All &gt;
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {conversations.map((conv) => (
          <div key={conv.id} className="rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-full ${conv.avatarColor}`} />
              <div>
                <p className="font-medium text-sm">{conv.name}</p>
                <p className="text-xs text-muted-foreground">{conv.location}</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{conv.status}</span>
                <span className="font-medium text-blue-500">{conv.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--primary-skyblue)] rounded-full" 
                  style={{ width: `${conv.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Last message: {conv.lastMessage}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
