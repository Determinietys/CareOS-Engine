import { createEvent } from 'ics';

export interface CalendarEvent {
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
  attendees: Array<{ name: string; email: string }>;
}

/**
 * Generate calendar invite (.ics file) for lead acceptance meeting
 */
export async function generateCalendarInvite(
  event: CalendarEvent
): Promise<{ fileContent: string; fileName: string }> {
  const { error, value } = createEvent({
    title: event.title,
    description: event.description,
    start: [
      event.start.getFullYear(),
      event.start.getMonth() + 1,
      event.start.getDate(),
      event.start.getHours(),
      event.start.getMinutes(),
    ],
    end: [
      event.end.getFullYear(),
      event.end.getMonth() + 1,
      event.end.getDate(),
      event.end.getHours(),
      event.end.getMinutes(),
    ],
    location: event.location,
    attendees: event.attendees.map((a) => ({
      name: a.name,
      email: a.email,
    })),
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: {
      name: 'CareOS',
      email: 'noreply@careos.app',
    },
  });

  if (error) {
    throw new Error(`Failed to generate calendar invite: ${error}`);
  }

  return {
    fileContent: value || '',
    fileName: `careos-meeting-${Date.now()}.ics`,
  };
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const start = event.start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = event.end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    dates: `${start}/${end}`,
    location: event.location || '',
  });

  event.attendees.forEach((attendee) => {
    params.append('add', attendee.email);
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const start = event.start.toISOString();
  const end = event.end.toISOString();
  
  const params = new URLSearchParams({
    subject: event.title,
    body: event.description,
    startdt: start,
    enddt: end,
    location: event.location || '',
  });

  event.attendees.forEach((attendee) => {
    params.append('attendee', attendee.email);
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

