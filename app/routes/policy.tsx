import { data } from "react-router";
import type { Route } from "./+types/policy";
import { Markdown } from "~/components/Markdown";
import { policies } from "~/content/policies";
import { breadcrumbLd, pageMeta, siteUrlFrom } from "~/lib/seo";

// One module serves /return-policy, /terms and /privacy (see routes.ts).
export function loader({ request }: Route.LoaderArgs) {
  const slug = new URL(request.url).pathname.replace(/^\/|\/$/g, "");
  const policy = policies[slug];
  if (!policy) throw data("Not Found", { status: 404 });
  return { policy };
}

export function meta({ matches, loaderData }: Route.MetaArgs) {
  if (!loaderData) return [];
  const { policy } = loaderData;
  const siteUrl = siteUrlFrom(matches);
  return pageMeta({
    siteUrl,
    title: `${policy.metaTitle} | Cakely`,
    description: policy.description,
    path: `/${policy.slug}`,
    markdownPath: `/${policy.slug}.md`,
    type: "article",
    jsonLd: [
      breadcrumbLd(siteUrl, [
        { name: "Home", path: "/" },
        { name: policy.title, path: `/${policy.slug}` },
      ]),
    ],
  });
}

export default function Policy({ loaderData }: Route.ComponentProps) {
  const { policy } = loaderData;

  if (policy.layout === "centered") {
    return (
      <section className="container py-16">
        <h1 className="text-center text-4xl font-bold">{policy.heading}</h1>
        <Markdown
          source={policy.body}
          className="prose-cakely mx-auto mt-8 max-w-3xl text-center text-muted-foreground [&_ul]:list-none [&_ul]:pl-0"
        />
      </section>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{policy.heading}</h1>
      {policy.lastUpdated && <p className="mb-8 mt-2 text-sm text-muted-foreground">Last updated: {policy.lastUpdated}</p>}
      <Markdown source={policy.body} className="prose-cakely leading-relaxed text-muted-foreground" />
    </article>
  );
}
