import { StepPlaceholder } from "@/components/merchant/step-placeholder";

// cf SPEC §6 — paramètres du commerce.
export default function SettingsPage() {
  return (
    <StepPlaceholder
      title="Paramètres"
      step="étape 12"
      description="Nom, logo et adresse de votre commerce."
    />
  );
}
