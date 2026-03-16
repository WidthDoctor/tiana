# Tiana

`https://widthdoctor.github.io/tiana/`

## Appointment calendar setup

- Service account JSON is expected at `src/server/google/service-account.json`
- Set calendar id in `.env.local`:

```bash
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
```

- Share the target Google Calendar with service account email from the JSON and grant at least "See all event details".
