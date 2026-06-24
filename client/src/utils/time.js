import { format, isToday, isYesterday, formatDistanceToNowStrict } from "date-fns";

export const formatMessageTime = (date) => {
  const d = new Date(date);
  return format(d, "h:mm a");
};

export const formatConversationTime = (date) => {
  const d = new Date(date);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
};

export const formatLastSeen = (date) => {
  if (!date) return "";
  return `last seen ${formatDistanceToNowStrict(new Date(date), { addSuffix: true })}`;
};
