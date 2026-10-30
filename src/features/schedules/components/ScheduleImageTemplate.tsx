import { useMemo } from "react";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { Activity } from "@/features/activities/types/activity.types";
import type { Participant } from "@/features/participants/types/participant.types";

import { calculateActivityTimes } from "@/features/activities/utils/activity-time.utils";

import type { MeetingSchedule } from "../types/schedule.types";
import type { AssignmentSnapshot } from "../types/schedule-persistence.types";
import type { ScheduleShareScope } from "../utils/schedule-share.utils";

interface ScheduleImageTemplateProps {
  scope: ScheduleShareScope;
  meetings: MeetingSchedule[];
  activities: Activity[];
  participants: Participant[];
  snapshots?: AssignmentSnapshot[];
  meetingStartTime?: string;
}

export function ScheduleImageTemplate({
  scope,
  meetings,
  activities,
  participants,
  snapshots = [],
  meetingStartTime = "19:30",
}: ScheduleImageTemplateProps) {
  const isMonthly = scope === "MONTH";

  const activitiesWithTime = useMemo(
    () => calculateActivityTimes(activities, meetingStartTime),
    [activities, meetingStartTime],
  );

  const participantMap = useMemo(
    () =>
      new Map(
        participants.map((participant) => [participant.id, participant.name]),
      ),
    [participants],
  );

  const snapshotMap = useMemo(
    () =>
      new Map(
        snapshots.map((snapshot) => [
          snapshot.assignmentId,
          snapshot.participantName,
        ]),
      ),
    [snapshots],
  );

  const orderedMeetings = useMemo(
    () => [...meetings].sort((a, b) => a.date.localeCompare(b.date)),
    [meetings],
  );

  const monthLabel = orderedMeetings.length
    ? format(parseISO(orderedMeetings[0].date), "MMMM 'de' yyyy", {
        locale: ptBR,
      })
    : "";

  return (
    <div
      style={{
        width: isMonthly ? 1200 : 720,
        backgroundColor: "#F4F8F3",
        color: "#173B31",
        fontFamily: "Arial, sans-serif",
        padding: isMonthly ? 48 : 40,
        boxSizing: "border-box",
      }}
    >
      {/* CABEÇALHO */}

      <header
        style={{
          padding: "28px 32px",
          borderRadius: 24,
          backgroundColor: "#145C42",
          color: "#FFFFFF",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 3,
                margin: 0,
                color: "#B7E4C7",
              }}
            >
              LAR
            </p>

            <h1
              style={{
                fontSize: isMonthly ? 36 : 32,
                lineHeight: 1.2,
                fontWeight: 700,
                margin: "12px 0 8px",
              }}
            >
              {isMonthly ? "Escala mensal" : "Programação do encontro"}
            </h1>

            <p
              style={{
                fontSize: 17,
                margin: 0,
                color: "#D8F0E1",
                textTransform: "capitalize",
              }}
            >
              {isMonthly
                ? monthLabel
                : orderedMeetings.length
                  ? format(
                      parseISO(orderedMeetings[0].date),
                      "EEEE, dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR },
                    )
                  : ""}
            </p>
          </div>

          <div
            style={{
              padding: "12px 18px",
              borderRadius: 14,
              backgroundColor: "#FFFFFF1A",
              fontSize: 14,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Início {meetingStartTime}
          </div>
        </div>
      </header>

      {/* ENCONTROS */}

      <main
        style={{
          display: "grid",
          gridTemplateColumns: isMonthly
            ? "repeat(2, minmax(0, 1fr))"
            : "minmax(0, 1fr)",
          gap: 20,
          marginTop: 24,
          alignItems: "start",
        }}
      >
        {orderedMeetings.map((meeting) => {
          const dateLabel = format(
            parseISO(meeting.date),
            "EEEE, dd 'de' MMMM",
            { locale: ptBR },
          );

          return (
            <section
              key={meeting.date}
              style={{
                minWidth: 0,
                backgroundColor: "#FFFFFF",
                border: "1px solid #DDE9DF",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "20px 24px",
                  backgroundColor: "#EAF4EC",
                  borderBottom: "1px solid #DDE9DF",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "#50806A",
                    fontWeight: 700,
                    margin: "0 0 6px",
                  }}
                >
                  ENCONTRO
                </p>

                <h2
                  style={{
                    fontSize: 20,
                    lineHeight: 1.3,
                    textTransform: "capitalize",
                    margin: 0,
                  }}
                >
                  {dateLabel}
                </h2>
              </div>

              <div style={{ padding: "12px 24px" }}>
                {activitiesWithTime.map((activity, index) => {
                  const assignments = meeting.assignments.filter(
                    (assignment) => assignment.activityId === activity.id,
                  );

                  const names = assignments.map(
                    (assignment) =>
                      snapshotMap.get(assignment.id) ??
                      participantMap.get(assignment.participantId) ??
                      "Participante não encontrado",
                  );

                  const missing = Math.max(
                    0,
                    activity.requiredParticipants - assignments.length,
                  );

                  const responsibleNames = [
                    ...names,
                    ...Array.from({ length: missing }, () => "A definir"),
                  ];

                  return (
                    <div
                      key={activity.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 18,
                        padding: "16px 0",
                        borderBottom:
                          index === activitiesWithTime.length - 1
                            ? "none"
                            : "1px solid #EDF1ED",
                      }}
                    >
                      <span
                        style={{
                          width: 52,
                          flexShrink: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#32805B",
                          paddingTop: 2,
                        }}
                      >
                        {activity.startTime}
                      </span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            lineHeight: 1.4,
                            margin: "0 0 7px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {activity.name}
                        </p>

                        <p
                          style={{
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: missing > 0 ? "#A36A24" : "#60776A",
                            margin: 0,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {responsibleNames.length
                            ? responsibleNames.join(", ")
                            : "Sem responsável"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* RODAPÉ */}

      <footer
        style={{
          marginTop: 24,
          padding: "20px 12px 4px",
          textAlign: "center",
          fontSize: 14,
          color: "#60776A",
        }}
      >
        Que Deus abençoe nossos encontros!
      </footer>
    </div>
  );
}
