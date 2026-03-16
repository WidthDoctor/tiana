"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { erasLight } from "../../../app/fonts";
import styles from "./Appointment.module.css";

type SlotsByDateItem = {
  date: string;
  slots: string[];
};

type AppointmentSlotsResponse = {
  month: string;
  appointmentDurationHours: number;
  breakDurationHours: number;
  occupiedDurationHours: number;
  slotsByDate: SlotsByDateItem[];
};

type AppointmentSlotsErrorResponse = {
  error?: string;
  details?: string;
};

type AppointmentBookingErrorResponse = {
  error?: string;
  details?: string;
};

const MONTH_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
  year: "numeric",
});

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function buildMonthDate(offset: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

function buildMonthKey(offset: number): string {
  const monthDate = buildMonthDate(offset);
  const year = monthDate.getFullYear();
  const month = String(monthDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function createDayLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  return DAY_LABEL_FORMATTER.format(date);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isFutureSlotToday(time: string, now: Date): boolean {
  const [hoursString, minutesString] = time.split(":");
  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return false;
  }

  const slotDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0,
  );

  return slotDate > now;
}

export default function Appointment() {
  const searchParams = useSearchParams();
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<0 | 1>(0);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotsData, setSlotsData] = useState<AppointmentSlotsResponse | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const hasAppointmentHistoryEntryRef = useRef(false);
  const skipHistoryPushRef = useRef(false);

  const nowDate = useMemo(() => new Date(nowTick), [nowTick]);
  const todayKey = useMemo(() => formatDateKey(nowDate), [nowDate]);

  const monthKey = useMemo(
    () => buildMonthKey(selectedMonthOffset),
    [selectedMonthOffset],
  );

  const monthTitle = useMemo(() => {
    const date = buildMonthDate(selectedMonthOffset);
    const formatted = MONTH_FORMATTER.format(date);
    return formatted[0].toUpperCase() + formatted.slice(1);
  }, [selectedMonthOffset]);

  const availableDates = useMemo(() => {
    if (!slotsData) {
      return [] as SlotsByDateItem[];
    }

    const now = new Date();
    const todayKey = formatDateKey(now);

    return slotsData.slotsByDate
      .map((item) => {
        if (item.date < todayKey) {
          return { ...item, slots: [] };
        }

        if (item.date > todayKey) {
          return item;
        }

        const filteredSlots = item.slots.filter((time) =>
          isFutureSlotToday(time, now),
        );

        return { ...item, slots: filteredSlots };
      })
      .filter((item) => item.slots.length > 0);
  }, [slotsData]);

  const selectedDay = useMemo(
    () => availableDates.find((item) => item.date === selectedDate) ?? null,
    [availableDates, selectedDate],
  );

  const canSubmitBooking =
    Boolean(selectedDate) &&
    Boolean(selectedTime) &&
    clientName.trim().length > 0 &&
    clientPhone.trim().length > 0 &&
    clientEmail.trim().length > 0;

  const openAppointment = useCallback(() => {
    setIsAppointmentOpen(true);
  }, []);

  const closeAppointment = useCallback(() => {
    setIsAppointmentOpen(false);
    hasAppointmentHistoryEntryRef.current = false;
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      openAppointment();
    };

    window.addEventListener("tiana:open-appointment", handleOpen);

    return () => {
      window.removeEventListener("tiana:open-appointment", handleOpen);
    };
  }, [openAppointment]);

  useEffect(() => {
    if (searchParams.get("section") !== "appointment") {
      return;
    }

    const frame = requestAnimationFrame(() => {
      openAppointment();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [openAppointment, searchParams]);

  useEffect(() => {
    const handleLogoClose = () => {
      closeAppointment();
    };

    const handlePortfolioOpen = () => {
      closeAppointment();
    };

    const handleJournalOpen = () => {
      closeAppointment();
    };

    const handleAccessoriesOpen = () => {
      closeAppointment();
    };

    window.addEventListener("tiana:logo-close-content", handleLogoClose);
    window.addEventListener("tiana:open-portfolio", handlePortfolioOpen);
    window.addEventListener("tiana:open-journal", handleJournalOpen);
    window.addEventListener("tiana:open-accessories", handleAccessoriesOpen);

    return () => {
      window.removeEventListener("tiana:logo-close-content", handleLogoClose);
      window.removeEventListener("tiana:open-portfolio", handlePortfolioOpen);
      window.removeEventListener("tiana:open-journal", handleJournalOpen);
      window.removeEventListener(
        "tiana:open-accessories",
        handleAccessoriesOpen,
      );
    };
  }, [closeAppointment]);

  useEffect(() => {
    const className = "appointment-open";

    document.documentElement.classList.toggle(className, isAppointmentOpen);
    document.body.classList.toggle(className, isAppointmentOpen);

    return () => {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    };
  }, [isAppointmentOpen]);

  useEffect(() => {
    if (!isAppointmentOpen) {
      hasAppointmentHistoryEntryRef.current = false;
      return;
    }

    if (skipHistoryPushRef.current) {
      skipHistoryPushRef.current = false;
      return;
    }

    if (hasAppointmentHistoryEntryRef.current) {
      return;
    }

    window.history.pushState(
      { tianaAppointment: true, view: "stage" },
      "",
      window.location.href,
    );

    hasAppointmentHistoryEntryRef.current = true;
  }, [isAppointmentOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (!isAppointmentOpen) {
        return;
      }

      skipHistoryPushRef.current = true;
      closeAppointment();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [closeAppointment, isAppointmentOpen]);

  useEffect(() => {
    if (!selectedDay) {
      setSelectedTime(null);
      return;
    }

    setSelectedTime((previous) =>
      previous && selectedDay.slots.includes(previous) ? previous : null,
    );
  }, [selectedDay]);

  useEffect(() => {
    if (!isAppointmentOpen) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAppointmentOpen]);

  useEffect(() => {
    if (availableDates.length === 0) {
      setSelectedDate(null);
      return;
    }

    setSelectedDate((previous) => {
      const stillAvailable = availableDates.some(
        (item) => item.date === previous,
      );
      return stillAvailable ? previous : availableDates[0].date;
    });
  }, [availableDates]);

  useEffect(() => {
    if (!isAppointmentOpen) {
      return;
    }

    const controller = new AbortController();

    const loadSlots = async () => {
      setIsLoadingSlots(true);
      setSlotsError(null);

      try {
        const response = await fetch(
          `/api/appointment/slots?month=${monthKey}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          const errorPayload = (await response
            .json()
            .catch(() => null)) as AppointmentSlotsErrorResponse | null;
          const message =
            errorPayload?.details ??
            errorPayload?.error ??
            `HTTP ${response.status}`;
          throw new Error(message);
        }

        const data = (await response.json()) as AppointmentSlotsResponse;
        setSlotsData(data);

        const firstAvailableDate =
          data.slotsByDate.find((item) => item.slots.length > 0)?.date ?? null;

        setSelectedDate((previous) => {
          const hasPreviousDate = data.slotsByDate.some(
            (item) => item.date === previous && item.slots.length > 0,
          );

          if (hasPreviousDate) {
            return previous;
          }

          return firstAvailableDate;
        });
        setSelectedTime(null);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setSlotsData(null);
        setSelectedDate(null);
        setSlotsError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить свободное время",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSlots(false);
        }
      }
    };

    loadSlots();

    return () => {
      controller.abort();
    };
  }, [isAppointmentOpen, monthKey, reloadTick]);

  const visibleSelectedDaySlots = useMemo(() => {
    if (!selectedDay) {
      return [] as string[];
    }

    if (selectedDay.date !== todayKey) {
      return selectedDay.slots;
    }

    return selectedDay.slots.filter((time) => isFutureSlotToday(time, nowDate));
  }, [nowDate, selectedDay, todayKey]);

  const handleBookingSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedDate || !selectedTime) {
      setBookingError("Сначала выберите день и время");
      return;
    }

    setBookingError(null);
    setBookingSuccess(null);
    setIsBookingSubmitting(true);

    try {
      const response = await fetch("/api/appointment/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          name: clientName,
          phone: clientPhone,
          email: clientEmail,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response
          .json()
          .catch(() => null)) as AppointmentBookingErrorResponse | null;
        const message =
          errorPayload?.details ??
          errorPayload?.error ??
          `HTTP ${response.status}`;
        throw new Error(message);
      }

      setBookingSuccess("Запись успешно создана.");
      setSelectedTime(null);
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setReloadTick((previous) => previous + 1);
    } catch (error) {
      setBookingError(
        error instanceof Error ? error.message : "Не удалось создать запись",
      );
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <section
      className={`${styles.appointmentStage} ${isAppointmentOpen ? styles.appointmentStageVisible : ""}`}
      aria-hidden={!isAppointmentOpen}
    >
      <div className={styles.appointmentInner}>
        <p className={styles.appointmentKicker}>Запись на приём</p>
        <h2 className={`${styles.appointmentTitle} ${erasLight.className}`}>
          Выберите дату и удобное время
        </h2>

        <form className={styles.bookingForm} onSubmit={handleBookingSubmit}>
          <div className={styles.formFields}>
            <label className={styles.fieldLabel}>
              Имя *
              <input
                className={styles.fieldInput}
                type="text"
                name="name"
                required
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
              />
            </label>

            <label className={styles.fieldLabel}>
              Телефон *
              <input
                className={styles.fieldInput}
                type="tel"
                name="phone"
                required
                value={clientPhone}
                onChange={(event) => setClientPhone(event.target.value)}
              />
            </label>

            <label className={styles.fieldLabel}>
              Email *
              <input
                className={styles.fieldInput}
                type="email"
                name="email"
                required
                value={clientEmail}
                onChange={(event) => setClientEmail(event.target.value)}
              />
            </label>
          </div>

          <div className={styles.controlsRow}>
            <div
              className={styles.monthSwitch}
              role="tablist"
              aria-label="Выбор месяца"
            >
              <button
                type="button"
                className={`${styles.monthButton} ${selectedMonthOffset === 0 ? styles.monthButtonActive : ""}`}
                onClick={() => setSelectedMonthOffset(0)}
              >
                Текущий месяц
              </button>
              <button
                type="button"
                className={`${styles.monthButton} ${selectedMonthOffset === 1 ? styles.monthButtonActive : ""}`}
                onClick={() => setSelectedMonthOffset(1)}
              >
                Следующий месяц
              </button>
            </div>
            <p className={styles.monthTitle}>{monthTitle}</p>
          </div>

          {isLoadingSlots ? (
            <p className={styles.statusText}>Загружаем свободные даты…</p>
          ) : null}

          {slotsError ? (
            <p className={styles.errorText}>Ошибка: {slotsError}</p>
          ) : null}

          {!isLoadingSlots && !slotsError ? (
            <div className={styles.bookingLayout}>
              <div>
                <h3 className={styles.sectionTitle}>Выберите день</h3>
                {availableDates.length > 0 ? (
                  <div className={styles.dayGrid}>
                    {availableDates.map((item) => (
                      <button
                        key={item.date}
                        type="button"
                        className={`${styles.dayButton} ${selectedDate === item.date ? styles.dayButtonActive : ""}`}
                        onClick={() => {
                          setSelectedDate(item.date);
                          setSelectedTime(null);
                          setBookingError(null);
                          setBookingSuccess(null);
                        }}
                      >
                        <span>{createDayLabel(item.date)}</span>
                        <span className={styles.daySlotsCount}>
                          {item.slots.length} слотов
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className={styles.statusText}>
                    Свободных дней в этом месяце нет.
                  </p>
                )}
              </div>

              <div>
                <h3 className={styles.sectionTitle}>Доступное время</h3>
                {selectedDay ? (
                  <div className={styles.slotsGrid}>
                    {visibleSelectedDaySlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`${styles.slotButton} ${selectedTime === time ? styles.slotButtonActive : ""}`}
                        onClick={() => {
                          setSelectedTime(time);
                          setBookingError(null);
                          setBookingSuccess(null);
                        }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className={styles.statusText}>Сначала выберите день.</p>
                )}
                {selectedDay && visibleSelectedDaySlots.length === 0 ? (
                  <p className={styles.statusText}>
                    На выбранный день свободного времени больше нет.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {selectedDate && selectedTime ? (
            <div className={styles.submitRow}>
              <p className={styles.selectedSlotText}>
                Выбрано: {createDayLabel(selectedDate)} в {selectedTime}
              </p>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={!canSubmitBooking || isBookingSubmitting}
              >
                {isBookingSubmitting ? "Отправка..." : "Записаться"}
              </button>
            </div>
          ) : null}

          {bookingError ? (
            <p className={styles.errorText}>{bookingError}</p>
          ) : null}
          {bookingSuccess ? (
            <p className={styles.successText}>{bookingSuccess}</p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
