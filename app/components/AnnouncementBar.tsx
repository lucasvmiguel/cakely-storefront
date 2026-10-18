import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { announcements } from "~/content/site";

export function AnnouncementBar() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % announcements.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-9 overflow-hidden bg-banner px-4 text-center text-sm font-medium text-banner-foreground">
      {announcements.map((a, i) => (
        <div
          key={a.text}
          aria-hidden={i !== active}
          className={`absolute inset-0 flex items-center justify-center px-4 transition-opacity duration-500 ${
            i === active ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {"href" in a ? (
            <Link to={a.href} className="inline-flex items-center gap-1 hover:underline" tabIndex={i === active ? 0 : -1}>
              {a.text}
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <span>{a.text}</span>
          )}
        </div>
      ))}
    </div>
  );
}
