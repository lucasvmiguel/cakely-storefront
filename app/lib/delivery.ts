// Delivery dates offered at checkout: Saturdays and Sundays in Amsterdam.
// Orders placed Monday–Wednesday can be delivered that same weekend; from
// Thursday on, the earliest date is the following weekend.

const TIME_ZONE = "Europe/Amsterdam";
const DELIVERY_WEEKDAYS = [6, 0]; // Saturday, Sunday
// Last day (Mon=0 … Sun=6) to order for delivery that same weekend: Wednesday.
const SAME_WEEK_CUTOFF = 2;
const WEEKENDS_SHOWN = 8;

// Days from order to the earliest delivery, for structured data: a Wednesday
// order arrives Saturday (3), a Thursday order the following Saturday (9).
export const HANDLING_DAYS = { min: 3, max: 9 };

export type DeliveryDate = { iso: string };

/** Today's calendar date in Amsterdam, as a UTC-midnight Date for date math. */
function amsterdamToday(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // YYYY-MM-DD
  return new Date(`${parts}T00:00:00Z`);
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

export function deliveryDates(now = new Date()): DeliveryDate[] {
  const today = amsterdamToday(now);
  const weekday = today.getUTCDay(); // 0 = Sunday
  // Monday-based day index: Mon=0 … Sun=6.
  const mondayIndex = (weekday + 6) % 7;
  const thisMonday = addDays(today, -mondayIndex);
  const sameWeek = mondayIndex <= SAME_WEEK_CUTOFF;
  const firstMonday = sameWeek ? thisMonday : addDays(thisMonday, 7);

  const dates: DeliveryDate[] = [];
  for (let week = 0; week < WEEKENDS_SHOWN; week++) {
    for (const day of DELIVERY_WEEKDAYS) {
      const offset = (day + 6) % 7; // days after Monday
      const date = addDays(firstMonday, week * 7 + offset);
      if (date <= today) continue;
      dates.push({ iso: date.toISOString().slice(0, 10) });
    }
  }
  return dates;
}

export function isValidDeliveryDate(iso: string, now = new Date()) {
  return deliveryDates(now).some((d) => d.iso === iso);
}

/** "Saturday 24 October 2026" */
export function formatDeliveryDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// The calendar works with local-time Dates; noon keeps the calendar day stable
// in any time zone.
export const fromIso = (iso: string) => new Date(`${iso}T12:00:00`);

export const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
