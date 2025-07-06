export type CreateTaskInput = Record<string, never>;
export type CreateTaskInput = {
  title: string;
  description?: string;
  priority: number;
};
