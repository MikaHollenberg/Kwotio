import { ArrangementForm } from "../arrangement-form";

export default function NieuwArrangementPage() {
  return (
    <ArrangementForm
      mode="create"
      initial={{
        name: "",
        description: "",
        category: "",
        colorCode: "#B87F2A",
        basePrice: 0,
        pricingMode: "vast",
        inclusiefSections: [],
        highlightTitle: "",
        highlightText: "",
        extras: [],
      }}
      initialTiers={[]}
      initialSeasons={[]}
    />
  );
}
