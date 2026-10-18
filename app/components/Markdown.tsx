import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";

// A tiny renderer for the subset of Markdown used in app/content (headings,
// paragraphs, bullet lists, **bold** and [links](url)). Keeping the legal
// copy in Markdown lets the same text power the HTML and the .md pages.

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={key++} className="font-semibold text-foreground">{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      const href = m[3];
      out.push(
        href.startsWith("/") ? (
          <Link key={key++} to={href} className="underline underline-offset-2">
            {m[2]}
          </Link>
        ) : (
          <a key={key++} href={href} className="underline underline-offset-2" target="_blank" rel="noreferrer">
            {m[2]}
          </a>
        ),
      );
    } else if (m[4] !== undefined) {
      out.push(<em key={key++}>{m[4]}</em>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = source.trim().split(/\n{2,}/);
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        const h = /^(#{2,4}) (.*)$/.exec(block);
        if (h) {
          const Tag = (`h${h[1].length}` as "h2" | "h3" | "h4");
          return <Tag key={i}>{inline(h[2])}</Tag>;
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
