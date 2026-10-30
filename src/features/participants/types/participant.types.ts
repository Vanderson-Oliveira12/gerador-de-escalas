export interface Participant {
  id: string;

  name: string;

  active: boolean;

  allowedActivityIds: string[];

  unavailableDates: string[];

  maxActivitiesPerMeeting: number | null;

  createdAt: string;

  updatedAt: string;
}

export type CreateParticipantInput = Omit<
  Participant,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateParticipantInput = Partial<CreateParticipantInput>;

export interface ParticipantFilters {
  search?: string;
  active?: boolean;
}

export interface ParticipantRepository {
  findAll(): Promise<Participant[]>;

  findById(id: string): Promise<Participant | null>;

  create(data: CreateParticipantInput): Promise<Participant>;

  update(id: string, data: UpdateParticipantInput): Promise<Participant>;

  delete(id: string): Promise<void>;
}
