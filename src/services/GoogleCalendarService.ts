import { Task, Event } from '../types';

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
}

export const GoogleCalendarService = {
  /**
   * Google API orqali kalendarga yangi tadbir qo'shish
   */
  async createEvent(
    accessToken: string,
    item: Partial<Task> | Partial<Event>,
  ): Promise<string | null> {
    try {
      const record = item as Record<string, unknown>;
      const title = item.title || String(record.name || '') || 'Sarlavhasiz';
      const description = String(record.description || '') || 'kaiwa.live orqali yaratilgan';

      // Task uchun dueDate, Event uchun eventDate ishlatiladi
      const date = String(record.dueDate || record.eventDate || record.date || '');

      if (!date) return null;

      const event = {
        summary: title,
        description: description,
        start: {
          dateTime: new Date(date).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: new Date(new Date(date).getTime() + 3600000).toISOString(), // +1 soat default
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        },
      );

      const data = await response.json();
      if (data.id) {
        return data.id as string;
      }
      return null;
    } catch (error) {
      console.error('Google Calendar Error:', error);
      return null;
    }
  },

  /**
   * Mavjud tadbirni yangilash
   */
  async updateEvent(
    accessToken: string,
    eventId: string,
    updates: Partial<Task> | Partial<Event>,
  ): Promise<boolean> {
    try {
      const record = updates as Record<string, unknown>;
      const title = updates.title || String(record.name || '');
      const date = String(record.dueDate || record.eventDate || record.date || '');

      const event: {
        summary?: string;
        description?: string;
        start?: { dateTime: string; timeZone: string };
        end?: { dateTime: string; timeZone: string };
      } = {};
      if (title) event.summary = title;
      if (record.description) event.description = String(record.description);
      if (date) {
        event.start = {
          dateTime: new Date(date).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        event.end = {
          dateTime: new Date(new Date(date).getTime() + 3600000).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        },
      );

      return response.ok;
    } catch (error) {
      console.error('Google Calendar Update Error:', error);
      return false;
    }
  },

  /**
   * Tadbirni o'chirish
   */
  async deleteEvent(accessToken: string, eventId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.ok;
    } catch (error) {
      console.error('Google Calendar Delete Error:', error);
      return false;
    }
  },

  /**
   * Google Calendar'dan tadbirlarni olish
   */
  async listEvents(
    accessToken: string,
    timeMin: string,
    timeMax: string,
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) throw new Error('Google API response error');

      const data = await response.json();
      return (data.items || []) as GoogleCalendarEvent[];
    } catch (error) {
      console.error('Google Calendar List Error:', error);
      return [];
    }
  },
};
