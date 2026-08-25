import { computed, ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  isValidVerificationEmail,
  parseVerificationRecord,
  SignedTokenVerificationStrategy,
  verificationStorageKey,
  type VerificationStrategy,
  type VerificationRecord,
} from "../domain/verification";

export function useVerification(
  surveyId: string,
  surveyVersion: string,
  strategy: VerificationStrategy = new SignedTokenVerificationStrategy(),
) {
  const serializer = {
    read(value: string): VerificationRecord | null {
      try {
        return parseVerificationRecord(JSON.parse(value), strategy);
      } catch {
        return null;
      }
    },
    write(value: VerificationRecord | null): string {
      return JSON.stringify(value);
    },
  };
  const stored = useLocalStorage<VerificationRecord | null>(
    verificationStorageKey(surveyId, surveyVersion, strategy.id),
    null,
    { serializer },
  );
  const email = ref(stored.value?.email ?? "");
  const code = ref(stored.value?.code ?? "");
  const requested = ref(Boolean(stored.value?.email));
  const error = ref("");
  const verified = computed(() => Boolean(stored.value));

  // Keep a valid entered code available when the respondent leaves and returns
  // to Review & submit, including when they do not click Confirm first.
  watch([email, code], ([currentEmail, currentCode]) => {
    const record = parseVerificationRecord({ email: currentEmail, code: currentCode }, strategy);
    stored.value = record;
  });

  function requestCode() {
    error.value = "";
    if (!isValidVerificationEmail(email.value)) {
      error.value = "Enter a valid email address.";
      return false;
    }
    requested.value = true;
    code.value = "";
    stored.value = null;
    return true;
  }

  function confirmCode() {
    error.value = "";
    if (!strategy.isValidToken(code.value)) {
      error.value = strategy.tokenErrorMessage;
      return false;
    }
    if (!isValidVerificationEmail(email.value)) {
      error.value = "Enter the email address used for verification.";
      return false;
    }
    const record = { email: email.value.trim(), code: code.value.trim() };
    stored.value = record;
    return true;
  }

  function clearVerification() {
    stored.value = null;
    code.value = "";
    requested.value = false;
    error.value = "";
  }

  return { email, code, requested, error, verified, requestCode, confirmCode, clearVerification };
}
