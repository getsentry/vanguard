import dayjs from "dayjs";
import DayJsRelativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(DayJsRelativeTime);

export default function TimeSince({
  date,
  ...props
}: { date: string | Date } & React.ComponentProps<"time">) {
  if (!date) return null;
  return (
    <time
      dateTime={date instanceof Date ? date.toISOString() : date}
      title={dayjs(date).format("MMMM D, YYYY h:mm A")}
      {...props}
    >
      {dayjs(date).fromNow()}
    </time>
  );
}
