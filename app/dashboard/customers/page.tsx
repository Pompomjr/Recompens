import { StepPlaceholder } from "@/components/merchant/step-placeholder";

// cf SPEC §6 — liste des clients du commerce.
export default function CustomersPage() {
  return (
    <StepPlaceholder
      title="Clients"
      step="étape 06"
      description="La liste de vos clients et leur compteur de visites, une fois le parcours d'inscription client en place."
    />
  );
}
