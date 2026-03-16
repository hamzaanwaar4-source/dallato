import { AlertTriangle, DollarSign, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TodoItem } from "@/lib/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface TodoListProps {
  todos: TodoItem[];
  isLoading?: boolean;
}

export function TodoList({ todos, isLoading = false }: TodoListProps) {
  if (isLoading) {
    return (
      <Card className="border-b shadow-none bg-transparent pt-5 px-6 pb-6">
        <CardHeader className="flex flex-row items-center justify-between px-0 pt-0 pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="px-0 space-y-4 h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-gray-100 bg-gray-50/50"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-b shadow-none bg-transparent pt-5 px-6 pb-6">
      <CardHeader className="flex flex-row items-center justify-between px-0 pt-0 pb-4">
        <CardTitle className="text-xl font-bold">
          Today's To-Do List
        </CardTitle>
        {/* <Button className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/90 text-white text-xs font-medium h-8 px-4 rounded-lg">
          View All
        </Button> */}
      </CardHeader>

      <CardContent className="px-0 space-y-4 h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
        {todos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium">No tasks to show</p>
            <p className="text-xs">You're all caught up.</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`p-4 rounded-xl !border ${
                todo.urgent
                  ? "bg-red-50/50 !border-red-200"
                  : "bg-gray-50/50 !border-gray-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-3">
                <div className="flex items-start gap-3 w-full">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      todo.urgent
                        ? "bg-red-500 text-white"
                        : "bg-[var(--primary-skyblue)] text-white"
                    }`}
                  >
                    {todo.urgent ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <DollarSign className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h4 className="font-bold text-gray-900 whitespace-nowrap">
                        {todo.client}
                      </h4>
                      <span className="text-sm text-muted-foreground truncate">
                        {todo.task}
                      </span>
                    </div>

                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge
                          variant="secondary"
                          className={`${todo.tagColor} hover:${todo.tagColor} border-none rounded-md font-normal whitespace-nowrap`}
                        >
                          {todo.tag}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap self-end sm:self-start">
                  {todo.time}
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </div>

              <div className="pl-[52px]">
                <p className="text-xs text-muted-foreground">Next Action:</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {todo.nextAction}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
