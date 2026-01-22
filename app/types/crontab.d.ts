declare module 'crontab' {
  export interface CrontabJob {
    command(): string;
    comment(): string;
    render(): string;
    minute(): string;
    hour(): string;
    dom(): string;
    month(): string;
    dow(): string;
    isValid(): boolean;
  }

  export interface CrontabAPI {
    jobs(): CrontabJob[];
    create(command: string, schedule: string, comment?: string): CrontabJob;
    remove(job: CrontabJob): void;
    save(callback: (err?: Error) => void): void;
    reset(): void;
  }

  export function load(callback: (err: Error | null, api: CrontabAPI) => void): void;
}
