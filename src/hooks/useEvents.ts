import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Event } from '../types';
import { DatabaseEvent, DatabaseEventUpdate } from '../types/supabase-types';
import { GoogleCalendarService, GoogleCalendarEvent } from '../services/GoogleCalendarService';
import { PushNotificationService } from '../services/PushNotificationService';
import { generateUUID, isUuid } from '../utils/uuid';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

const getActiveUserId = (): string => {
  const cachedUser = safeLocalStorage.getJSON<{ id?: string } | null>(
    'study_planner_user_cache',
    null,
  );
  return cachedUser?.id && isUuid(cachedUser.id) ? cachedUser.id : 'guest';
};

export const useEvents = (notificationsEnabled: boolean = true) => {
  const [events, setEvents] = useState<Event[]>(() => {
    const activeId = getActiveUserId();
    return safeLocalStorage.getJSON<Event[]>(`study_planner_events_cache_${activeId}`, []);
  });
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);

  const syncGoogleEvents = useCallback(async () => {
    if (typeof supabase?.auth?.getSession !== 'function') return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (session?.provider_token) {
        const now = new Date();
        const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 1).toISOString();

        const fetchedEvents = await GoogleCalendarService.listEvents(
          session.provider_token,
          timeMin,
          timeMax,
        );
        setGoogleEvents(fetchedEvents);
      }
    } catch (error) {
      console.error('Google Calendar sync error:', error);
    }
  }, []);

  const addEvent = useCallback(async (eventData: Partial<Event>): Promise<Event | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    let activeUserId = 'local_user';
    if (session?.user?.id) activeUserId = session.user.id;
    const eventId = eventData.id || generateUUID();

    const newEvent: Event = {
      id: eventId,
      userId: activeUserId,
      title: eventData.title || '',
      description: eventData.description,
      eventType: eventData.eventType || 'personal',
      eventDate: eventData.eventDate || '',
      notifyBeforeMinutes: eventData.notifyBeforeMinutes || 60,
      isNotified: false,
      repetitionType: eventData.repetitionType || 'none',
      repetitionEndDate: eventData.repetitionEndDate,
      repetitionDays: eventData.repetitionDays,
      googleEventId: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEvents((prev) => {
      const updated = [...prev, newEvent];
      const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
      safeLocalStorage.setJSON(`study_planner_events_cache_${activeId}`, updated);
      return updated;
    });

    if (session?.user) {
      const dbEvent: Omit<DatabaseEvent, 'id' | 'created_at' | 'updated_at'> & {
        id?: string;
        google_event_id?: string;
      } = {
        id: eventId,
        user_id: session.user.id,
        title: eventData.title || '',
        description: eventData.description,
        event_type: (eventData.eventType === 'google'
          ? 'personal'
          : eventData.eventType || 'personal') as 'jdu' | 'career' | 'jlpt' | 'personal',
        event_date: eventData.eventDate || '',
        notify_before_minutes: eventData.notifyBeforeMinutes || 60,
        repetition_type: (eventData.repetitionType || 'none') as
          'none' | 'daily' | 'weekly' | 'monthly',
        repetition_end_date: eventData.repetitionEndDate,
        repetition_days: eventData.repetitionDays,
        is_notified: false,
      };

      // Google Calendar Sync
      if (session.provider_token && eventData.eventDate) {
        const googleEventId = await GoogleCalendarService.createEvent(
          session.provider_token,
          eventData,
        );
        if (googleEventId) {
          dbEvent.google_event_id = googleEventId;
        }
      }

      try {
        const { data } = await supabase.from('events').insert(dbEvent).select().single();
        if (data) {
          const returnedEvent: Event = {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            description: data.description,
            eventType: data.event_type,
            eventDate: data.event_date,
            notifyBeforeMinutes: data.notify_before_minutes,
            isNotified: data.is_notified,
            repetitionType: data.repetition_type || 'none',
            repetitionEndDate: data.repetition_end_date,
            repetitionDays: data.repetition_days,
            googleEventId: data.google_event_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          setEvents((prev) => {
            const updated = prev.map((e) => (e.id === eventId ? returnedEvent : e));
            const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
            safeLocalStorage.setJSON(`study_planner_events_cache_${activeId}`, updated);
            return updated;
          });
          return returnedEvent;
        }
      } catch (error) {
        console.warn('addEvent DB notice (local event preserved):', error);
      }
    }
    return newEvent;
  }, []);

  const updateEvent = useCallback(
    async (id: string, updates: Partial<Event>) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      let activeUserId = 'local_user';
      if (session?.user?.id) activeUserId = session.user.id;

      const currentEvent = events.find((e) => e.id === id);
      if (currentEvent?.googleEventId && session?.provider_token) {
        await GoogleCalendarService.updateEvent(
          session.provider_token,
          currentEvent.googleEventId,
          updates,
        );
      }

      const dbUpdates: DatabaseEventUpdate = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.eventType) dbUpdates.event_type = updates.eventType;
      if (updates.eventDate) dbUpdates.event_date = updates.eventDate;
      if (updates.notifyBeforeMinutes !== undefined)
        dbUpdates.notify_before_minutes = updates.notifyBeforeMinutes;
      if (updates.isNotified !== undefined) dbUpdates.is_notified = updates.isNotified;
      if (updates.repetitionType) dbUpdates.repetition_type = updates.repetitionType;
      if (updates.repetitionEndDate) dbUpdates.repetition_end_date = updates.repetitionEndDate;
      if (updates.repetitionDays) dbUpdates.repetition_days = updates.repetitionDays;

      await supabase.from('events').update(dbUpdates).eq('id', id);
      setEvents((prev) => {
        const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
        const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
        safeLocalStorage.setJSON(`study_planner_events_cache_${activeId}`, updated);
        return updated;
      });
    },
    [events],
  );

  const updateEventRef = useRef(updateEvent);
  useEffect(() => {
    updateEventRef.current = updateEvent;
  }, [updateEvent]);

  useEffect(() => {
    if (notificationsEnabled && events.length > 0) {
      PushNotificationService.requestPermission().then((granted) => {
        if (granted === 'granted') {
          PushNotificationService.startMonitoring(events, (eventId) => {
            updateEventRef.current(eventId, { isNotified: true });
          });
        }
      });
    }
    return () => {
      PushNotificationService.stopMonitoring();
    };
  }, [events, notificationsEnabled]);

  const deleteEvent = useCallback(
    async (id: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      let activeUserId = 'local_user';
      if (session?.user?.id) activeUserId = session.user.id;

      const currentEvent = events.find((e) => e.id === id);
      if (currentEvent?.googleEventId && session?.provider_token) {
        await GoogleCalendarService.deleteEvent(session.provider_token, currentEvent.googleEventId);
      }

      setEvents((prev) => {
        const updated = prev.filter((e) => e.id !== id);
        const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
        safeLocalStorage.setJSON(`study_planner_events_cache_${activeId}`, updated);
        return updated;
      });
      await supabase.from('events').delete().eq('id', id);
    },
    [events],
  );

  return {
    events,
    setEvents,
    googleEvents,
    setGoogleEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    syncGoogleEvents,
  };
};
