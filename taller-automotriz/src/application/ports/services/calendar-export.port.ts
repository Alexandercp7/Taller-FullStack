export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
}

export interface CalendarExport {
  createEvent(event: CalendarEvent): Promise<string>;
  deleteEvent(eventId: string): Promise<void>;
}
