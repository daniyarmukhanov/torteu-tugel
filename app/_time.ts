export const ASTANA_TIME_ZONE = "Asia/Almaty";

const ASTANA_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: ASTANA_TIME_ZONE,
});

const ASTANA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: ASTANA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const getAstanaDateTimeParts = (): DateTimeParts => {
  const parts = ASTANA_DATE_TIME_FORMATTER.formatToParts(new Date());

  const getPartValue = (type: Intl.DateTimeFormatPart["type"]) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: getPartValue("year"),
    month: getPartValue("month"),
    day: getPartValue("day"),
    hour: getPartValue("hour"),
    minute: getPartValue("minute"),
    second: getPartValue("second"),
  };
};

export const getAstanaDate = () => ASTANA_DATE_FORMATTER.format(new Date());

export const getMsUntilNextAstanaMidnight = () => {
  const now = new Date();
  const { year, month, day, hour, minute, second } = getAstanaDateTimeParts();

  const astanaNowAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = astanaNowAsUtc - now.getTime();
  const nextMidnightAsUtc = Date.UTC(year, month - 1, day + 1, 0, 0, 0);
  const midnightUtc = nextMidnightAsUtc - offset;

  return Math.max(midnightUtc - now.getTime(), 0);
};

export const getAstanaDayOfYear = () => {
  const { year, month, day } = getAstanaDateTimeParts();
  const startOfYearUtc = Date.UTC(year, 0, 0);
  const currentUtc = Date.UTC(year, month - 1, day);

  return Math.floor((currentUtc - startOfYearUtc) / (24 * 60 * 60 * 1000));
};
