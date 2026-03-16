import { NextResponse } from "next/server";
import { google } from "googleapis";
import serviceAccount from "@/server/google/service-account.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APPOINTMENT_DURATION_HOURS = 2;
const BUFFER_DURATION_HOURS = 1;
const SLOT_OCCUPIED_HOURS = APPOINTMENT_DURATION_HOURS + BUFFER_DURATION_HOURS;

type BookingPayload = {
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  email?: string;
};

type CalendarEventRange = {
  start: Date;
  end: Date;
};

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseLocalSlotStart(date: string, time: string): Date | null {
  if (!isValidDate(date) || !isValidTime(time)) {
    return null;
  }

  const [yearString, monthString, dayString] = date.split("-");
  const [hoursString, minutesString] = time.split(":");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;
  const day = Number(dayString);
  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthIndex) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null;
  }

  const parsed = new Date(year, monthIndex, day, hours, minutes, 0, 0);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
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

export async function POST(request: Request) {
  const body = (await request
    .json()
    .catch(() => null)) as BookingPayload | null;

  if (!body) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const date = body.date?.trim() ?? "";
  const time = body.time?.trim() ?? "";

  if (!name || !phone || !email || !date || !time) {
    return NextResponse.json(
      {
        error: "Заполните обязательные поля: имя, телефон, email, дата и время",
      },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Введите корректный email" },
      { status: 400 },
    );
  }

  const slotStart = parseLocalSlotStart(date, time);

  if (!slotStart) {
    return NextResponse.json(
      { error: "Некорректные дата или время записи" },
      { status: 400 },
    );
  }

  if (slotStart <= new Date()) {
    return NextResponse.json(
      { error: "Нельзя записаться на прошедшее время" },
      { status: 400 },
    );
  }

  const slotEnd = new Date(
    slotStart.getTime() + SLOT_OCCUPIED_HOURS * 60 * 60 * 1000,
  );
  const calendarId = (process.env.GOOGLE_CALENDAR_ID ?? "primary").trim();

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
    const calendar = google.calendar({ version: "v3", auth });

    const conflictsResponse = await calendar.events.list({
      calendarId,
      singleEvents: true,
      orderBy: "startTime",
      timeMin: slotStart.toISOString(),
      timeMax: slotEnd.toISOString(),
      maxResults: 250,
    });

    const busyRanges: CalendarEventRange[] =
      conflictsResponse.data.items
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

    if (hasOverlap(slotStart, slotEnd, busyRanges)) {
      return NextResponse.json(
        { error: "Этот слот уже занят. Пожалуйста, выберите другое время" },
        { status: 409 },
      );
    }

    const createdEvent = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `Запись на приём — ${name}`,
        description: [
          `Имя: ${name}`,
          `Телефон: ${phone}`,
          `Email: ${email}`,
          "",
          "Формат слота: 2 часа визит + 1 час технический перерыв.",
        ].join("\n"),
        start: {
          dateTime: slotStart.toISOString(),
        },
        end: {
          dateTime: slotEnd.toISOString(),
        },
      },
    });

    return NextResponse.json({
      ok: true,
      eventId: createdEvent.data.id,
      date,
      time,
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
      maybeError.message ?? "Unknown booking provider error";

    console.error("[appointment:bookings] calendar error", {
      calendarId,
      providerStatus,
      providerMessage,
      fallbackMessage,
      date,
      time,
    });

    return NextResponse.json(
      {
        error: "Не удалось создать запись",
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
