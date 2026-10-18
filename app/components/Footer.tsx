import { ChevronDown, Clock, FileText, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router";
import { footerPages, site } from "~/content/site";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "./icons";

const tiles = [
  { icon: Clock, title: "Customer Support", value: site.supportHours },
  { icon: Mail, title: "Email Us", value: site.email, href: `mailto:${site.email}` },
  { icon: Phone, title: "Call Us", value: site.phone, href: site.phoneHref },
  { icon: MapPin, title: "Address", value: site.address.display },
];

const socials = [
  { label: "Instagram", href: site.socials.instagram, Icon: InstagramIcon },
  { label: "TikTok", href: site.socials.tiktok, Icon: TikTokIcon },
  { label: "WhatsApp", href: site.socials.whatsapp, Icon: WhatsAppIcon },
];

export function Footer({ markdownPath }: { markdownPath: string | null }) {
  return (
    <>
      <footer className="border-t bg-background pt-10 pb-12">
        <div className="space-y-10 px-4 md:px-12">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map(({ icon: Icon, title, value, href }) => (
              <div key={title} className="flex items-center gap-3 rounded-lg border px-5 py-4">
                <Icon className="size-5 shrink-0" />
                <div>
                  <p className="text-sm font-bold">{title}</p>
                  {href ? (
                    <a href={href} className="text-sm text-muted-foreground underline underline-offset-2">
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <img src={site.logo} alt="Cakely" className="-ml-6 h-24 w-auto -my-6" loading="lazy" />
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{site.description}</p>
            </div>
            <div>
              {/* Collapsible on mobile, open by default; plain column on desktop. */}
              <details open className="group lg:pointer-events-none">
                <summary className="flex list-none items-center justify-between border-b pb-3 text-sm font-bold lg:border-0 [&::-webkit-details-marker]:hidden">
                  Pages
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180 lg:hidden" />
                </summary>
                <ul className="mt-3 space-y-3 lg:pointer-events-auto">
                  {footerPages.map((p) => (
                    <li key={p.href}>
                      <Link to={p.href} className="text-sm text-muted-foreground hover:underline">
                        {p.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </div>

          <hr />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
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
                  className="flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
      {markdownPath && (
        <div className="flex items-center justify-center gap-2 bg-muted px-4 py-2 text-center text-sm text-muted-foreground">
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
