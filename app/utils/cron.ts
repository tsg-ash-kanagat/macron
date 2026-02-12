// ABOUTME: Cron expression parsing and formatting utilities
// ABOUTME: Provides next run time calculation and human-readable descriptions

import { Cron } from 'croner';

export const CRON_5_REGEX =
  /^(\*(?:\/[0-5]?\d)?|([0-5]?\d)(?:-[0-5]?\d)?(?:\/[0-5]?\d)?(?:,[0-5]?\d(?:-[0-5]?\d)?(?:\/[0-5]?\d?)?)*)\s+(\*(?:\/(?:[01]?\d|2[0-3]))?|([01]?\d|2[0-3])(?:-[01]?\d|2[0-3])?(?:\/([01]?\d|2[0-3]))?(?:,([01]?\d|2[0-3])(?:-[01]?\d|2[0-3])?(?:\/([01]?\d|2[0-3]))?)*)\s+(\*(?:\/(?:[1-9]|[12]\d|3[01]))?|([1-9]|[12]\d|3[01])(?:-([1-9]|[12]\d|3[01]))?(?:\/([1-9]|[12]\d|3[01]))?(?:,([1-9]|[12]\d|3[01])(?:-([1-9]|[12]\d|3[01]))?(?:\/([1-9]|[12]\d|3[01]))?)*)\s+(\*(?:\/(?:1[0-2]|[1-9]))?|(1[0-2]|[1-9])(?:-(1[0-2]|[1-9]))?(?:\/(1[0-2]|[1-9]))?(?:,(1[0-2]|[1-9])(?:-(1[0-2]|[1-9]))?(?:\/(1[0-2]|[1-9]))?)*)\s+(\*(?:\/[0-7])?|[0-7](?:-[0-7])?(?:\/[0-7])?(?:,[0-7](?:-[0-7])?(?:\/[0-7])?)*)$/;

export interface CronValidation {
  isValid: boolean;
  error?: string;
}

export function validateCronExpression(expression: string): CronValidation {
  if (!expression || typeof expression !== 'string') {
    return { isValid: false, error: 'Expression is required' };
  }

  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { isValid: false, error: 'Expression must have 5 fields' };
  }

  try {
    const job = new Cron(expression);
    job.stop();
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid cron expression'
    };
  }
}

export function getNextRunTime(expression: string): Date | null {
  if (!expression || typeof expression !== 'string') {
    return null;
  }

  const trimmed = expression.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const job = new Cron(trimmed);
    const next = job.nextRun();
    job.stop();
    return next;
  } catch (error) {
    console.error('Failed to parse cron expression:', expression, 'Error:', error);
    return null;
  }
}

export function formatNextRunTime(expression: string): string {
  const nextRun = getNextRunTime(expression);
  if (!nextRun) {
    if (CRON_5_REGEX.test(expression?.trim() || '')) {
      return 'Schedule active';
    }
    return 'Invalid schedule';
  }

  const now = new Date();
  const diff = nextRun.getTime() - now.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `in ${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return 'in less than a minute';
  }
}

export function getCronDescription(expression: string): string {
  if (!expression) return '';

  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid expression';

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (expression === '* * * * *') {
    return 'Every minute';
  }

  if (expression === '0 * * * *') {
    return 'Every hour';
  }

  if (expression === '0 0 * * *') {
    return 'Daily at midnight';
  }

  if (expression === '0 0 * * 0') {
    return 'Weekly on Sunday at midnight';
  }

  if (expression === '0 0 * * 1') {
    return 'Weekly on Monday at midnight';
  }

  if (expression === '0 0 1 * *') {
    return 'Monthly on the 1st at midnight';
  }

  if (expression === '*/15 * * * *') {
    return 'Every 15 minutes';
  }

  if (expression === '0 */6 * * *') {
    return 'Every 6 hours';
  }

  if (expression === '0 0 * * 1-5') {
    return 'Weekdays at midnight';
  }

  let description = 'Runs ';
  const parts_desc: string[] = [];

  if (minute !== '*') {
    if (minute.includes('/')) {
      const interval = minute.split('/')[1];
      parts_desc.push(`every ${interval} minutes`);
    } else if (minute.includes(',')) {
      parts_desc.push(`at minutes ${minute}`);
    } else {
      parts_desc.push(`at minute ${minute}`);
    }
  }

  if (hour !== '*') {
    if (hour.includes('/')) {
      const interval = hour.split('/')[1];
      parts_desc.push(`every ${interval} hours`);
    } else if (hour.includes(',')) {
      parts_desc.push(`at hours ${hour}`);
    } else {
      const hourNum = parseInt(hour, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
      parts_desc.push(`at ${displayHour}:${minute === '*' ? '00' : minute.padStart(2, '0')} ${ampm}`);
    }
  }

  if (dayOfMonth !== '*') {
    if (dayOfMonth.includes(',')) {
      parts_desc.push(`on days ${dayOfMonth}`);
    } else {
      parts_desc.push(`on day ${dayOfMonth}`);
    }
  }

  if (month !== '*') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (month.includes(',')) {
      const monthNames = month.split(',').map(m => months[parseInt(m, 10) - 1]).join(', ');
      parts_desc.push(`in ${monthNames}`);
    } else {
      parts_desc.push(`in ${months[parseInt(month, 10) - 1]}`);
    }
  }

  if (dayOfWeek !== '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (dayOfWeek === '1-5') {
      parts_desc.push('on weekdays');
    } else if (dayOfWeek.includes(',')) {
      const dayNames = dayOfWeek.split(',').map(d => days[parseInt(d, 10)]).join(', ');
      parts_desc.push(`on ${dayNames}`);
    } else if (dayOfWeek.includes('-')) {
      parts_desc.push(`on ${dayOfWeek}`);
    } else {
      parts_desc.push(`on ${days[parseInt(dayOfWeek, 10)]}`);
    }
  }

  if (parts_desc.length === 0) {
    return 'Every minute';
  }

  return description + parts_desc.join(', ');
}

export interface FrequencyBadge {
  type: 'success' | 'processing' | 'default' | 'warning' | 'error';
  text: string;
}

export function getFrequencyBadge(expression: string): FrequencyBadge {
  const nextRun = getNextRunTime(expression);
  if (!nextRun) {
    if (CRON_5_REGEX.test(expression?.trim() || '')) {
      return { type: 'default', text: 'Scheduled' };
    }
    return { type: 'error', text: 'Invalid' };
  }

  const now = new Date();
  const diff = nextRun.getTime() - now.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 1) {
    return { type: 'success', text: 'Frequent' };
  } else if (hours < 24) {
    return { type: 'processing', text: 'Hourly' };
  } else if (hours < 168) {
    return { type: 'default', text: 'Daily' };
  } else if (hours < 720) {
    return { type: 'warning', text: 'Weekly' };
  } else {
    return { type: 'warning', text: 'Monthly' };
  }
}
