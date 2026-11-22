// astroCalcService.ts
import { DateTime } from 'luxon';
import { CityLocation } from './locationService';

export interface BirthDetails {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  location: CityLocation;
}

/** Преобразува местното време на раждане в UTC дата */
export function getUTCBirthDate(birth: BirthDetails): Date {
  const [year, month, day] = birth.date.split('-').map(Number);
  const [hours, minutes] = birth.time.split(':').map(Number);

  // Създаване на дата в специфичния часов пояс на града
  const dt = DateTime.fromObject(
    { year, month, day, hour: hours, minute: minutes },
    { zone: birth.location.timezone }
  );

  return dt.toJSDate(); // Връща JS Date обект в UTC
}