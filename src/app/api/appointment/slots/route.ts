import { NextResponse } from "next/server";
import { google } from "googleapis";
import serviceAccount from "@/server/google/service-account.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APPOINTMENT_DURATION_HOURS = 2;
const BUFFER_DURATION_HOURS = 1;
const SLOT_OCCUPIED_HOURS = APPOINTMENT_DURATION_HOURS + BUFFER_DURATION_HOURS;
const WORKDAY_START_HOUR = 10;
const WORKDAY_END_HOUR = 20;

type CalendarEventRange = {
  start: Date;
  end: Date;
};

type SlotsDay = {
  date: string;
  slots: string[];
};

function isMonthValid(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseEventDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function hasOverlap(
  start: Date,
  end: Date,
  ranges: CalendarEventRange[],
): boolean {
  const startTime = start.getTime();
  const endTime = end.getTime();

  return ranges.some((range) => {
    const rangeStart = range.start.getTime();
    const rangeEnd = range.end.getTime();
    return startTime < rangeEnd && endTime > rangeStart;
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");

  if (!month || !isMonthValid(month)) {
    return NextResponse.json(
      { error: "Параметр month обязателен в формате YYYY-MM" },
      { status: 400 },
    );
  }

  const [yearString, monthString] = month.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex)) {
    return NextResponse.json(
      { error: "Некорректное значение month" },
      { status: 400 },
    );
  }

  const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);

  const calendarId = (process.env.GOOGLE_CALENDAR_ID ?? "primary").trim();

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    const eventsResponse = await calendar.events.list({
      calendarId,
      singleEvents: true,
      orderBy: "startTime",
      timeMin: monthStart.toISOString(),
      timeMax: monthEnd.toISOString(),
      maxResults: 2500,
    });

    const busyRanges: CalendarEventRange[] =
      eventsResponse.data.items
        ?.map((eventItem) => {
          const start = parseEventDate(
            eventItem.start?.dateTime ?? eventItem.start?.date,
          );
          const end = parseEventDate(
            eventItem.end?.dateTime ?? eventItem.end?.date,
          );

          if (!start || !end) {
            return null;
          }

          return { start, end };
        })
        .filter((value): value is CalendarEventRange => value !== null) ?? [];

    const now = new Date();
    const slotsByDate: SlotsDay[] = [];
    const cursor = new Date(monthStart);

    while (cursor < monthEnd) {
      const dateKey = formatDateKey(cursor);
      const slots: string[] = [];

      for (
        let hour = WORKDAY_START_HOUR;
        hour <= WORKDAY_END_HOUR - SLOT_OCCUPIED_HOURS;
        hour += 1
      ) {
        const slotStart = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          cursor.getDate(),
          hour,
          0,
          0,
          0,
        );
        const slotEnd = new Date(
          slotStart.getTime() + SLOT_OCCUPIED_HOURS * 60 * 60 * 1000,
        );

        if (slotStart <= now) {
          continue;
        }

        if (!hasOverlap(slotStart, slotEnd, busyRanges)) {
          slots.push(formatTime(slotStart));
        }
      }

      slotsByDate.push({ date: dateKey, slots });
      cursor.setDate(cursor.getDate() + 1);
    }

    return NextResponse.json({
      month,
      appointmentDurationHours: APPOINTMENT_DURATION_HOURS,
      breakDurationHours: BUFFER_DURATION_HOURS,
      occupiedDurationHours: SLOT_OCCUPIED_HOURS,
      slotsByDate,
    });
  } catch (error) {
    const maybeError = error as {
      message?: string;
      response?: {
        status?: number;
        data?: {
          error?: {
            message?: string;
          };
        };
      };
    };

    const providerMessage = maybeError.response?.data?.error?.message;
    const providerStatus = maybeError.response?.status;
    const fallbackMessage =
      maybeError.message ?? "Unknown calendar provider error";

    console.error("[appointment:slots] calendar error", {
      calendarId,
      month,
      providerStatus,
      providerMessage,
      fallbackMessage,
    });

    return NextResponse.json(
      {
        error: "Не удалось загрузить свободные слоты календаря",
        details:
          providerMessage ??
          (providerStatus
            ? `Google Calendar HTTP ${providerStatus}: ${fallbackMessage}`
            : fallbackMessage),
      },
      { status: 500 },
    );
  }
}
