import type { ProjectItem, ToolStatus } from '../data/site'

export default function StatusBadge({ status }: { status: ToolStatus | ProjectItem['status'] }) {
  return <span className="status-badge" data-status={status}>{status}</span>
}
