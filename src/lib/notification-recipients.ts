export function newlyAssignedRecipients(previous: string[], current: string[], actorId: string) {
  const existing = new Set(previous);
  return [...new Set(current)].filter((id) => id !== actorId && !existing.has(id));
}

export function commentRecipients(assignees: string[], actorId: string) {
  return [...new Set(assignees)].filter((id) => id !== actorId);
}
