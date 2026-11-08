const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * A calendar entry for a home visit. It carries the area, never the exact address, so sharing or syncing the file
 * does not spread the address. The exact address stays inside the account.
 */
export function visitIcs(input: { id: string; start: Date; title: string; area: string; representative?: string | null }): string {
  const end = new Date(input.start.getTime() + 45 * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gharmatch//Visit//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${input.id}@gharmatch`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(input.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`Home visit: ${input.title}`)}`,
    `LOCATION:${esc(input.area)}`,
    `DESCRIPTION:${esc(`${input.representative ? `You will meet ${input.representative}. ` : ""}Tell someone you trust. Meet at the gate first. Call 112 in an emergency.`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Home visit in one hour",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
