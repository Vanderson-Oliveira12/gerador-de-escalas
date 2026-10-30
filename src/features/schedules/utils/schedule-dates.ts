import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
} from "date-fns";

export function getThursdaysOfMonth(year: number, month: number): string[] {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Ano ou mês inválido.");
  }

  const date = new Date(year, month - 1, 1);

  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  })
    .filter((day) => getDay(day) === 4)
    .map((day) => format(day, "yyyy-MM-dd"));
}
