export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
