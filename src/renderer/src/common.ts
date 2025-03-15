export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function snowflakeDate(snowflake: string) {
  return new Date(parseInt(snowflake) / 4194304 + 1420070400000);
}

export function dateSnowflake(date: Date) {
  return String((date.getTime() - 1420070400000) * 4194304);
}
