export type Todo = {
  id: string
  title: string
  createdAt: string
  completedAt: string | null
}

export type TodoState = {
  version: 1
  tasks: Todo[]
  completionCounts: Record<string, number>
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function createEmptyTodoState(): TodoState {
  return {
    version: 1,
    tasks: [],
    completionCounts: {},
  }
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function getPreviousDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number)
  return getDateKey(new Date(year, month - 1, day - 1))
}

export function getCurrentStreak(
  completionCounts: Record<string, number>,
  todayKey: string
): number {
  let dateKey =
    completionCounts[todayKey] > 0 ? todayKey : getPreviousDateKey(todayKey)
  let streak = 0

  while (completionCounts[dateKey] > 0) {
    streak += 1
    dateKey = getPreviousDateKey(dateKey)
  }

  return streak
}

export function addTodo(state: TodoState, todo: Todo): TodoState {
  return {
    ...state,
    tasks: [todo, ...state.tasks],
  }
}

export function setTodoCompletion(
  state: TodoState,
  todoId: string,
  isComplete: boolean,
  completedAt: Date
): TodoState {
  const todo = state.tasks.find((task) => task.id === todoId)

  if (!todo || Boolean(todo.completedAt) === isComplete) {
    return state
  }

  const completionCounts = { ...state.completionCounts }
  let completionDate: string

  if (isComplete) {
    completionDate = getDateKey(completedAt)
    completionCounts[completionDate] =
      (completionCounts[completionDate] ?? 0) + 1
  } else {
    if (todo.completedAt === null) {
      return state
    }

    completionDate = getDateKey(new Date(todo.completedAt))
    const remainingCompletions = (completionCounts[completionDate] ?? 0) - 1

    if (remainingCompletions > 0) {
      completionCounts[completionDate] = remainingCompletions
    } else {
      delete completionCounts[completionDate]
    }
  }

  return {
    ...state,
    completionCounts,
    tasks: state.tasks.map((task) =>
      task.id === todoId
        ? {
            ...task,
            completedAt: isComplete ? completedAt.toISOString() : null,
          }
        : task
    ),
  }
}

export function deleteTodo(state: TodoState, todoId: string): TodoState {
  return {
    ...state,
    tasks: state.tasks.filter((task) => task.id !== todoId),
  }
}

export function parseTodoState(value: string): TodoState {
  const parsed: unknown = JSON.parse(value)

  if (
    !isRecord(parsed) ||
    parsed.version !== 1 ||
    !Array.isArray(parsed.tasks)
  ) {
    throw new Error("The saved task list has an unsupported format.")
  }

  if (!isRecord(parsed.completionCounts)) {
    throw new Error("The saved completion history is invalid.")
  }

  const taskIds = new Set<string>()
  const tasks = parsed.tasks.map((task): Todo => {
    if (
      !isRecord(task) ||
      typeof task.id !== "string" ||
      task.id.length === 0 ||
      taskIds.has(task.id) ||
      typeof task.title !== "string" ||
      task.title.trim().length === 0 ||
      task.title.length > 160 ||
      !isIsoDate(task.createdAt) ||
      (task.completedAt !== null && !isIsoDate(task.completedAt))
    ) {
      throw new Error("The saved task list contains invalid task data.")
    }

    taskIds.add(task.id)

    return {
      id: task.id,
      title: task.title,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    }
  })

  const completionCounts: Record<string, number> = {}

  for (const [dateKey, count] of Object.entries(parsed.completionCounts)) {
    if (
      !isDateKey(dateKey) ||
      typeof count !== "number" ||
      !Number.isSafeInteger(count) ||
      count <= 0
    ) {
      throw new Error("The saved completion history contains invalid data.")
    }

    completionCounts[dateKey] = count
  }

  return {
    version: 1,
    tasks,
    completionCounts,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false
  }

  const timestamp = Date.parse(value)

  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  )
}

function isDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false
  }

  const [year, month, day] = value.split("-").map(Number)

  return getDateKey(new Date(year, month - 1, day)) === value
}
