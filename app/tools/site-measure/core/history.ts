import type { Project } from './model'
export type History = { present: Project | null; past: Project[]; future: Project[]; group: string | null }
export type HistoryAction =
  | { type: 'load'; project: Project }
  | { type: 'edit'; recipe: (project: Project) => void; group?: string }
  | { type: 'end' } | { type: 'undo' } | { type: 'redo' }
export const initialHistory: History = { present: null, past: [], future: [], group: null }
export function historyReducer(state: History, action: HistoryAction): History {
  if (action.type === 'load') return { present: action.project, past: [], future: [], group: null }
  if (action.type === 'end') return { ...state, group: null }
  const current = state.present
  if (!current) return state
  const stamp = (project: Project) => ({ ...project, revision: current.revision + 1, updatedAt: new Date().toISOString() })
  if (action.type === 'undo') {
    if (!state.past.length) return state
    return { present: stamp(state.past[state.past.length - 1]), past: state.past.slice(0, -1), future: [current, ...state.future].slice(0, 60), group: null }
  }
  if (action.type === 'redo') {
    if (!state.future.length) return state
    return { present: stamp(state.future[0]), past: [...state.past, current].slice(-60), future: state.future.slice(1), group: null }
  }
  const next = structuredClone(current)
  action.recipe(next)
  return {
    present: stamp(next), past: action.group && state.group === action.group ? state.past : [...state.past, current].slice(-60),
    future: [], group: action.group ?? null,
  }
}
