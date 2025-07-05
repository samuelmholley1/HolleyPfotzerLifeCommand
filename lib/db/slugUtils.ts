// Utility for generating human-friendly slugs/labels for all tables
// Usage: generateSlug('task', 'My Important Task', '123') => 'task-my-important-task-123'

export function generateSlug(table: string, name: string, id?: string | number): string {
  if (!name) return '';
  // Normalize name: lowercase, replace spaces and special chars with hyphens, remove non-alphanumerics
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return id ? `${table}-${base}-${id}` : `${table}-${base}`;
}

// Example: generateSlug('goal', 'Finish MVP', 42) => 'goal-finish-mvp-42'
