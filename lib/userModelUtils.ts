/**
 * lib/userModelUtils.ts
 * Helper to safely extract a plain Record<string,number> from a
 * Mongoose Map<string,number> or plain object.
 */
export function mapToRecord(
  m: Map<string, number> | Record<string, number> | undefined | null
): Record<string, number> {
  if (!m) return {};
  if (m instanceof Map) return Object.fromEntries(m.entries());
  if (typeof m === 'object') {
    // Mongoose Map exposes .toObject() / is iterable in some versions
    try { return Object.fromEntries((m as any).entries()); } catch { /* fallthrough */ }
    return m as Record<string, number>;
  }
  return {};
}
