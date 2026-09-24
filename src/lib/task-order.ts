export function moveInOrderedColumns<S extends string>(items: { id: string; status: S }[], taskId: string, targetStatus: S, targetIndex: number) {
  const moving = items.find((item) => item.id === taskId);
  if (!moving) return items;
  const without = items.filter((item) => item.id !== taskId);
  const target = without.filter((item) => item.status === targetStatus);
  const bounded = Math.max(0, Math.min(targetIndex, target.length));
  const orderedTarget = [...target];
  orderedTarget.splice(bounded, 0, { ...moving, status: targetStatus });
  const untouched = without.filter((item) => item.status !== targetStatus);
  return [...untouched, ...orderedTarget];
}
