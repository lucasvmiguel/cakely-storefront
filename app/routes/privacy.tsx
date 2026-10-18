import type { Route } from "./+types/privacy";
import { PolicyPage, policyMeta } from "~/components/PolicyPage";
import { policies } from "~/content/policies";

const policy = policies["privacy"];

export function meta({ matches }: Route.MetaArgs) {
  return policyMeta(policy, matches);
}

export default function Privacy() {
  return <PolicyPage policy={policy} />;
}
