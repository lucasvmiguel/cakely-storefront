import type { Route } from "./+types/return-policy";
import { PolicyPage, policyMeta } from "~/components/PolicyPage";
import { policies } from "~/content/policies";

const policy = policies["return-policy"];

export function meta({ matches }: Route.MetaArgs) {
  return policyMeta(policy, matches);
}

export default function ReturnPolicy() {
  return <PolicyPage policy={policy} />;
}
