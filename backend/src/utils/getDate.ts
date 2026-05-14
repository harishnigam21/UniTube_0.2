import { formatInTimeZone } from "date-fns-tz";
import {
  parse,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  addDays,
} from "date-fns";

//This function gives the days between dates and format in valid format like in sec, in min, in hrs, in days
export const getDaysBetween = (dateString:string) => {
  const formatPattern = "dd-MM-yyyy_HH:mm:ss";
  const parsedDate = parse(dateString, formatPattern, new Date());
  const now = new Date();

  // Calculating all possible differences
  const seconds = differenceInSeconds(now, parsedDate);
  const minutes = differenceInMinutes(now, parsedDate);
  const hours = differenceInHours(now, parsedDate);
  const days = differenceInDays(now, parsedDate);
  const weeks = differenceInWeeks(now, parsedDate);
  const months = differenceInMonths(now, parsedDate);
  const years = differenceInYears(now, parsedDate);

  // 1. Years
  if (years >= 1) {
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }

  // 2. Months
  if (months >= 1) {
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }

  // 3. Weeks
  if (weeks >= 1) {
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }

  // 4. Days
  if (days >= 1) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  // 5. Hours
  if (hours >= 1) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  // 6. Minutes
  if (minutes >= 1) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }

  // 7. Seconds or "Just now"
  if (seconds >= 10) {
    return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
  }

  return "Just now";
};

//Mostly used to get Date in format I configured, but can also be used to get date of after 'n' days
export const getNextDate = (daysToAdd = 0) => {
  const now = new Date();
  const futureDate = addDays(now, daysToAdd);
  const timeZone = "Asia/Kolkata";

  return formatInTimeZone(futureDate, timeZone, "dd-MM-yyyy_HH:mm:ss");
};
