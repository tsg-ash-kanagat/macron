// ABOUTME: Type definitions for cron job structures
// ABOUTME: Provides type safety for job objects throughout the application

export interface CronJob {
  minute: () => string;
  hour: () => string;
  dom: () => string;
  month: () => string;
  dow: () => string;
  command: () => string;
  comment: () => string;
  render: () => string;
  isValid: () => boolean;
}

export interface Job {
  job: CronJob;
  key: string | null;
  name: string;
}
