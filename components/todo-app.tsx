"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import {
  AlertCircle,
  CalendarDays,
  Check,
  Flame,
  ListTodo,
  Plus,
  Trash2,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  addTodo,
  deleteTodo,
  getCurrentStreak,
  getDateKey,
  setTodoCompletion,
  type Todo,
} from "@/lib/todo"
import {
  getServerTodoStoreSnapshot,
  getTodoStoreSnapshot,
  subscribeToTodoStore,
  updateTodoStore,
} from "@/lib/todo-store"

export default function TodoApp() {
  const store = useSyncExternalStore(
    subscribeToTodoStore,
    getTodoStoreSnapshot,
    getServerTodoStoreSnapshot
  )
  const todayKey = useSyncExternalStore(
    subscribeToClock,
    getTodaySnapshot,
    getServerTodaySnapshot
  )
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [taskError, setTaskError] = useState<string | null>(null)
  const { state: todoState, status: storageStatus, error: storageError } = store

  const activeTasks = useMemo(
    () => todoState.tasks.filter((task) => task.completedAt === null),
    [todoState.tasks]
  )
  const completedTasks = useMemo(
    () => todoState.tasks.filter((task) => task.completedAt !== null),
    [todoState.tasks]
  )
  const completedCount = completedTasks.length
  const progress = todoState.tasks.length
    ? Math.round((completedCount / todoState.tasks.length) * 100)
    : 0
  const currentStreak = todayKey
    ? getCurrentStreak(todoState.completionCounts, todayKey)
    : 0
  const weekDays = todayKey ? getLastSevenDays(todayKey) : []

  function handleAddTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTaskTitle.trim()

    if (!title) {
      setTaskError("Add a task name before saving.")
      return
    }

    if (title.length > 160) {
      setTaskError("Keep task names to 160 characters or fewer.")
      return
    }

    const now = new Date()
    updateTodoStore((state) =>
      addTodo(state, {
        id: crypto.randomUUID(),
        title,
        createdAt: now.toISOString(),
        completedAt: null,
      })
    )
    setNewTaskTitle("")
    setTaskError(null)
  }

  function handleToggleTask(taskId: string, isComplete: boolean) {
    updateTodoStore((state) =>
      setTodoCompletion(state, taskId, isComplete, new Date())
    )
  }

  function handleDeleteTask(taskId: string) {
    updateTodoStore((state) => deleteTodo(state, taskId))
  }

  const todayLabel = todayKey ? formatDateKey(todayKey) : null
  const storageReady = storageStatus === "ready"

  return (
    <main className="min-h-svh bg-muted/30">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 py-6 sm:px-8 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Check aria-hidden="true" />
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight">
              daymark
            </span>
          </div>
          <Badge
            className="hidden rounded-full px-3 py-1 sm:inline-flex"
            variant="secondary"
          >
            <CalendarDays aria-hidden="true" data-icon="inline-start" />
            Your daily rhythm
          </Badge>
        </header>

        <section className="pt-10 pb-8 sm:pt-14">
          <div className="max-w-2xl">
            <div className="mb-3 text-sm font-medium text-primary">
              {todayLabel ?? <Skeleton className="h-4 w-36" />}
            </div>
          </div>
        </section>

        {storageError && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Local storage unavailable</AlertTitle>
            <AlertDescription>{storageError}</AlertDescription>
          </Alert>
        )}

        <div className="grid flex-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListTodo aria-hidden="true" className="size-5 text-primary" />
                Your tasks
              </CardTitle>
              <Badge className="shrink-0 rounded-full" variant="outline">
                {storageReady ? `${activeTasks.length} left` : "—"}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <form noValidate onSubmit={handleAddTask}>
                <FieldGroup className="flex-row items-start gap-2">
                  <Field
                    className="min-w-0 flex-1 gap-1"
                    data-invalid={Boolean(taskError)}
                  >
                    <FieldLabel className="sr-only" htmlFor="new-task">
                      New task
                    </FieldLabel>
                    <Input
                      aria-describedby={taskError ? "task-error" : undefined}
                      aria-invalid={Boolean(taskError)}
                      autoComplete="off"
                      disabled={!storageReady}
                      id="new-task"
                      maxLength={160}
                      onChange={(event) => {
                        setNewTaskTitle(event.target.value)
                        if (taskError) {
                          setTaskError(null)
                        }
                      }}
                      placeholder="What would you like to get done?"
                      value={newTaskTitle}
                    />
                    {taskError && (
                      <FieldError id="task-error">{taskError}</FieldError>
                    )}
                  </Field>
                  <Button
                    aria-label="Add task"
                    className="mt-0.5"
                    disabled={!storageReady}
                    type="submit"
                  >
                    <Plus aria-hidden="true" data-icon="inline-start" />
                    Add task
                  </Button>
                </FieldGroup>
              </form>

              <section aria-labelledby="active-tasks-heading">
                <div className="mb-2 flex items-center justify-between">
                  <h2
                    className="text-sm font-semibold text-foreground"
                    id="active-tasks-heading"
                  >
                    To do
                  </h2>
                </div>
                {storageStatus === "loading" ? (
                  <div aria-busy="true" className="flex flex-col gap-4 py-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-11/12" />
                    <Skeleton className="h-10 w-4/5" />
                  </div>
                ) : storageStatus === "error" ? (
                  <Empty className="min-h-52 border border-dashed border-border/70 bg-muted/20 p-8">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <AlertCircle aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>Tasks unavailable</EmptyTitle>
                      <EmptyDescription>
                        Resolve the storage issue above and reload to access
                        your saved list.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : activeTasks.length ? (
                  <TaskList
                    disabled={!storageReady}
                    onDelete={handleDeleteTask}
                    onToggle={handleToggleTask}
                    tasks={activeTasks}
                  />
                ) : (
                  <Empty className="min-h-52 border border-dashed border-border/70 bg-muted/20 p-8">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Check aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>
                        {todoState.tasks.length
                          ? "You’re all caught up"
                          : "A fresh page"}
                      </EmptyTitle>
                      {!todoState.tasks.length && (
                        <EmptyDescription>
                          Add one small task to get your day moving.
                        </EmptyDescription>
                      )}
                    </EmptyHeader>
                  </Empty>
                )}
              </section>

              <Separator />

              <section aria-labelledby="completed-tasks-heading">
                <div className="mb-2 flex items-center justify-between">
                  <h2
                    className="text-sm font-semibold text-foreground"
                    id="completed-tasks-heading"
                  >
                    Completed
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {storageReady ? completedTasks.length : "—"}
                  </span>
                </div>
                {storageStatus === "loading" ? (
                  <Skeleton className="h-10 w-full" />
                ) : storageStatus === "error" ? null : completedTasks.length ? (
                  <TaskList
                    disabled={!storageReady}
                    onDelete={handleDeleteTask}
                    onToggle={handleToggleTask}
                    tasks={completedTasks}
                  />
                ) : (
                  <p className="py-2 text-sm text-muted-foreground">
                    Finished tasks will show up here.
                  </p>
                )}
              </section>
            </CardContent>
          </Card>

          <aside className="flex flex-col gap-6">
            <Card className="overflow-visible">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Current streak</CardTitle>
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Flame aria-hidden="true" className="size-5" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 pt-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-5xl font-semibold tracking-tight">
                    {storageReady ? currentStreak : "—"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {currentStreak === 1 ? "day" : "days"}
                  </span>
                </div>
                <div
                  aria-label="Task completion activity in the last seven days"
                  className="grid grid-cols-7 gap-2"
                  role="list"
                >
                  {storageReady ? (
                    weekDays.map((day) => {
                      const hasActivity =
                        (todoState.completionCounts[day.key] ?? 0) > 0

                      return (
                        <div
                          aria-label={`${day.longLabel}: ${hasActivity ? "activity" : "no activity"}`}
                          className="flex flex-col items-center gap-2"
                          key={day.key}
                          role="listitem"
                          title={`${day.longLabel}: ${hasActivity ? "activity" : "no activity"}`}
                        >
                          <span
                            className={`flex size-7 items-center justify-center rounded-full ${
                              hasActivity
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {hasActivity ? (
                              <Check aria-hidden="true" className="size-3.5" />
                            ) : (
                              <span className="size-1 rounded-full bg-current" />
                            )}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {day.shortLabel}
                          </span>
                        </div>
                      )
                    })
                  ) : storageStatus === "loading" ? (
                    <Skeleton className="col-span-7 h-10 w-full" />
                  ) : (
                    <p className="col-span-7 text-xs text-muted-foreground">
                      Activity is unavailable until your saved history loads.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Your progress</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tasks completed</span>
                  <span className="font-medium text-foreground">
                    {storageReady
                      ? `${completedCount} / ${todoState.tasks.length}`
                      : "—"}
                  </span>
                </div>
                {storageReady ? (
                  <div
                    aria-label="Task completion progress"
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={progress}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                ) : (
                  <Skeleton className="h-2 w-full" />
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  )
}

function TaskList({
  tasks,
  disabled,
  onToggle,
  onDelete,
}: {
  tasks: Todo[]
  disabled: boolean
  onToggle: (taskId: string, isComplete: boolean) => void
  onDelete: (taskId: string) => void
}) {
  return (
    <div className="flex flex-col">
      {tasks.map((task, index) => {
        const checkboxId = `todo-${task.id}`
        const isComplete = task.completedAt !== null

        return (
          <div key={task.id}>
            {index > 0 && <Separator className="my-1" />}
            <Field className="items-center gap-3 py-2" orientation="horizontal">
              <Checkbox
                checked={isComplete}
                disabled={disabled}
                id={checkboxId}
                onCheckedChange={(checked) =>
                  onToggle(task.id, checked === true)
                }
              />
              <FieldContent className="min-w-0 flex-row items-center">
                <FieldLabel
                  className={`min-w-0 flex-1 cursor-pointer text-sm ${
                    isComplete
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                  htmlFor={checkboxId}
                >
                  <span className="break-words">{task.title}</span>
                </FieldLabel>
              </FieldContent>
              <Button
                aria-label={`Delete ${task.title}`}
                disabled={disabled}
                onClick={() => onDelete(task.id)}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </Field>
          </div>
        )
      })}
    </div>
  )
}

function getLastSevenDays(todayKey: string) {
  const [year, month, day] = todayKey.split("-").map(Number)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(year, month - 1, day - 6 + index)

    return {
      key: getDateKey(date),
      longLabel: new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }).format(date),
      shortLabel: new Intl.DateTimeFormat("en", {
        weekday: "narrow",
      }).format(date),
    }
  })
}

function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number)

  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(year, month - 1, day))
}

function subscribeToClock(listener: () => void): () => void {
  const intervalId = window.setInterval(listener, 60_000)

  return () => window.clearInterval(intervalId)
}

function getTodaySnapshot(): string {
  return getDateKey(new Date())
}

function getServerTodaySnapshot(): null {
  return null
}
