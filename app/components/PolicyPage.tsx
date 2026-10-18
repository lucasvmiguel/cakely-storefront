import type { MetaDescriptor } from "react-router";
import { Markdown } from "~/components/Markdown";
import type { Policy } from "~/content/policies";
import { breadcrumbLd, pageMeta, siteUrlFrom } from "~/lib/seo";

// Shared by the /return-policy, /terms and /privacy routes. The content is
// static (app/content/policies.ts), so those routes need no loader.

export function policyMeta(policy: Policy, matches: Parameters<typeof siteUrlFrom>[0]): MetaDescriptor[] {
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

export function PolicyPage({ policy }: { policy: Policy }) {
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
