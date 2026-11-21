import { Clock, FileText, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router";
import { footerPages, site } from "~/content/site";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "./icons";

const tiles = [
  { icon: Clock, title: "Customer Support", value: site.supportHours },
  { icon: Mail, title: "Email Us", value: site.email, href: `mailto:${site.email}` },
  { icon: Phone, title: "Call Us", value: site.phone, href: site.phoneHref },
  { icon: MapPin, title: "We deliver in", value: site.address.display },
];

const socials = [
  { label: "Instagram", href: site.socials.instagram, Icon: InstagramIcon },
  { label: "TikTok", href: site.socials.tiktok, Icon: TikTokIcon },
  { label: "WhatsApp", href: site.socials.whatsapp, Icon: WhatsAppIcon },
];

export function Footer({ markdownPath }: { markdownPath: string | null }) {
  return (
    <>
      {/* Violet: the navbar's purple, lighter. */}
      <footer className="border-t border-white/10 bg-violet text-peach">
        <div className="container max-w-7xl space-y-10 py-14">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map(({ icon: Icon, title, value, href }) => (
              <li key={title} className="flex items-center gap-4 rounded-3xl bg-white/[0.07] px-5 py-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-peach text-violet">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{title}</p>
                  {href ? (
                    <a href={href} className="break-words text-sm text-peach/90 underline underline-offset-2 hover:text-peach">
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm text-peach/90">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div className="space-y-3">
              <p className="font-display text-5xl uppercase leading-none">{site.name}</p>
              <p className="max-w-md text-peach/90">{site.description}</p>
            </div>
            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-6 gap-y-2 lg:justify-end">
                {footerPages.map((p) => (
                  <li key={p.href}>
                    <Link
                      to={p.href}
                      className="inline-block py-1 text-sm font-medium text-peach/90 underline-offset-4 transition-colors hover:text-peach hover:underline"
                    >
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-peach/90">
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </p>
            <div className="flex gap-2">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex size-11 items-center justify-center rounded-full bg-peach text-violet transition-transform hover:-rotate-6 hover:scale-110"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
      {markdownPath && (
        <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-violet px-4 py-3 text-center text-sm text-peach/90">
          <FileText className="size-4 shrink-0" />
          <span>
            This page is also available in a machine-readable format for LLMs and AI tools.{" "}
            <a href={markdownPath} className="underline underline-offset-2">
              View machine-readable version
            </a>
          </span>
        </div>
      )}
    </>
  );
}
