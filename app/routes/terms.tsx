import type { Route } from "./+types/terms";
import { PolicyPage, policyMeta } from "~/components/PolicyPage";
import { policies } from "~/content/policies";

const policy = policies["terms"];

export function meta({ matches }: Route.MetaArgs) {
  return policyMeta(policy, matches);
}

export default function Terms() {
  return <PolicyPage policy={policy} />;
}
