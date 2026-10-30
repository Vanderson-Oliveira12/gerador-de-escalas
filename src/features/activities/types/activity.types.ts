export interface Activity {
  id: string;

  name: string;

  durationMinutes: number;

  order: number;

  requiredParticipants: number;

  active: boolean;

  createdAt: string;

  updatedAt: string;
}

export type CreateActivityInput = Omit<
  Activity,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateActivityInput = Partial<CreateActivityInput>;

export interface ActivityRepository {
  findAll(): Promise<Activity[]>;

  findById(id: string): Promise<Activity | null>;

  create(data: CreateActivityInput): Promise<Activity>;

  update(id: string, data: UpdateActivityInput): Promise<Activity>;

  delete(id: string): Promise<void>;

  reorder(ids: string[]): Promise<Activity[]>;

  resetToDefault(): Promise<Activity[]>;
}
