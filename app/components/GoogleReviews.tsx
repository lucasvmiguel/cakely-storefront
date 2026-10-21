import { Star } from "lucide-react";
import { GoogleIcon } from "~/components/icons";
import type { GoogleReviews as Data } from "~/lib/google-reviews.server";

function Stars({ rating, className = "size-4" }: { rating: number; className?: string }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${className} ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-border text-border"}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/** Homepage section with the Google Business Profile rating and latest reviews. */
export function GoogleReviews({ data }: { data: Data }) {
  return (
    <section className="container">
      <div className="mb-8 flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:justify-between md:text-left">
        <div>
          <p className="text-sm text-muted-foreground">What Amsterdam says</p>
          <h2 className="text-3xl font-bold md:text-4xl">Loved by cake lovers</h2>
        </div>
        <a
          href={data.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-muted"
        >
          <GoogleIcon className="size-6" />
          <span className="text-left">
            <span className="flex items-center gap-2">
              <span className="text-xl font-semibold">{data.rating.toFixed(1)}</span>
              <Stars rating={data.rating} />
            </span>
            <span className="block text-xs text-muted-foreground">
              Based on {data.count} Google {data.count === 1 ? "review" : "reviews"}
            </span>
          </span>
        </a>
      </div>

      {data.reviews.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {data.reviews.slice(0, 3).map((r) => (
            <figure key={`${r.author}-${r.when}`} className="flex flex-col gap-3 rounded-xl bg-peach/40 p-5">
              <figcaption className="flex items-center gap-3">
                {r.authorPhoto ? (
                  <img
                    src={r.authorPhoto}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="size-9 rounded-full"
                  />
                ) : (
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                    {r.author.charAt(0)}
                  </span>
                )}
                <span>
                  {r.authorUrl ? (
                    <a href={r.authorUrl} target="_blank" rel="noreferrer" className="block text-sm font-semibold hover:underline">
                      {r.author}
                    </a>
                  ) : (
                    <span className="block text-sm font-semibold">{r.author}</span>
                  )}
                  <span className="block text-xs text-muted-foreground">{r.when}</span>
                </span>
              </figcaption>
              <Stars rating={r.rating} className="size-3.5" />
              <blockquote className="line-clamp-5 text-sm leading-relaxed text-foreground/80">{r.text}</blockquote>
            </figure>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
        <a
          href={data.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Read all reviews on Google
        </a>
        <a
          href={data.writeReviewUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-primary px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Write a review
        </a>
      </div>
    </section>
  );
}
