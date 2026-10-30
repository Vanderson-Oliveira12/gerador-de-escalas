import { describe, expect, it } from "vitest";

import {
  formatMeetingDate,
  formatMonthLabel,
  getWhatsAppShareUrl,
} from "./schedule-share.utils";

describe("schedule-share.utils", () => {
  describe("formatMeetingDate", () => {
    it("deve formatar uma quinta-feira em português", () => {
      expect(formatMeetingDate("2026-11-12")).toBe(
        "quinta-feira, 12 de novembro de 2026",
      );
    });
  });

  describe("formatMonthLabel", () => {
    it("deve formatar o mês e ano", () => {
      expect(formatMonthLabel("2026-11-12")).toBe("novembro de 2026");
    });
  });

  describe("getWhatsAppShareUrl", () => {
    it("deve gerar uma URL com o texto codificado", () => {
      const message = "Olá! Escala de novembro.";

      const url = getWhatsAppShareUrl(message);

      expect(url).toBe(`https://wa.me/?text=${encodeURIComponent(message)}`);
    });

    it("deve preservar quebras de linha na codificação", () => {
      const message = "João\nMaria";

      const url = getWhatsAppShareUrl(message);

      expect(url).toContain("%0A");
    });
  });
});
