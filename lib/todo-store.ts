import {
  createEmptyTodoState,
  parseTodoState,
  type TodoState,
} from "@/lib/todo"

const STORAGE_KEY = "daymark.todo-state.v1"

export type TodoStoreSnapshot = {
  state: TodoState
  status: "loading" | "ready" | "error"
  error: string | null
}

const serverSnapshot: TodoStoreSnapshot = {
  state: createEmptyTodoState(),
  status: "loading",
  error: null,
}

let snapshot = serverSnapshot
let initialized = false
const listeners = new Set<() => void>()

export function subscribeToTodoStore(listener: () => void): () => void {
  listeners.add(listener)

  if (!initialized) {
    initializeTodoStore()
  }

  return () => listeners.delete(listener)
}

export function getTodoStoreSnapshot(): TodoStoreSnapshot {
  return snapshot
}

export function getServerTodoStoreSnapshot(): TodoStoreSnapshot {
  return serverSnapshot
}

export function updateTodoStore(update: (state: TodoState) => TodoState): void {
  if (snapshot.status !== "ready") {
    return
  }

  const nextState = update(snapshot.state)

  if (nextState === snapshot.state) {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
    snapshot = {
      state: nextState,
      status: "ready",
      error: null,
    }
  } catch {
    snapshot = {
      ...snapshot,
      status: "error",
      error:
        "Your browser could not save this change. Check available storage and reload before continuing.",
    }
  }

  notifyListeners()
}

function initializeTodoStore(): void {
  initialized = true

  try {
    const savedState = window.localStorage.getItem(STORAGE_KEY)

    snapshot = {
      state: savedState ? parseTodoState(savedState) : createEmptyTodoState(),
      status: "ready",
      error: null,
    }
  } catch {
    snapshot = {
      state: createEmptyTodoState(),
      status: "error",
      error:
        "Your saved tasks could not be opened. Check your browser storage settings and reload the page.",
    }
  }

  notifyListeners()
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener()
  }
}
