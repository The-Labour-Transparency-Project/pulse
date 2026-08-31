import { computed, ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { requestToken } from "../api/client";
import {
    consumeVerificationTokenUrl,
    isValidVerificationEmail,
    parseVerificationRecord,
    SignedTokenVerificationStrategy,
    type VerificationRecord,
    verificationStorageKey,
    type VerificationStrategy,
} from "../domain/verification";

export function useVerification(
    waveId: string,
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
        verificationStorageKey(waveId, surveyId, surveyVersion, strategy.id),
        null,
        { serializer },
    );
    const email = ref(stored.value?.email ?? "");
    const code = ref(stored.value?.code ?? "");
    const requested = ref(Boolean(stored.value?.email));
    const error = ref("");
    const requesting = ref(false);
    const verified = computed(() => Boolean(stored.value));

    // Keep a valid entered code available when the respondent leaves and returns
    // to Review & submit, including when they do not click Confirm first.
    watch([email, code], ([currentEmail, currentCode]) => {
        const record = parseVerificationRecord({ email: currentEmail, code: currentCode }, strategy);
        stored.value = record;
    });

    function consumeTokenFromUrl() {
        if (typeof window === "undefined") {
            return false;
        }

        const consumed = consumeVerificationTokenUrl(window.location.href);
        if (!consumed) {
            return false;
        }

        window.history.replaceState(window.history.state, document.title,
            consumed.cleanUrl);

        if (!strategy.isValidToken(consumed.token)) {
            error.value = strategy.tokenErrorMessage;
            return false;
        }

        code.value = consumed.token;
        stored.value = { email: email.value.trim(), code: consumed.token };
        requested.value = false;
        error.value = "";
        return true;
    }

    consumeTokenFromUrl();

    async function requestCode() {
        error.value = "";
        if (!isValidVerificationEmail(email.value)) {
            error.value = "Enter a valid email address.";
            return false;
        }
        requesting.value = true;
        try {
            await requestToken(waveId, surveyId, surveyVersion, email.value.trim());
            requested.value = true;
            code.value = "";
            stored.value = null;
            return true;
        } catch (exception) {
            error.value = exception instanceof Error ? exception.message : "We could not send the access link.";
            return false;
        } finally {
            requesting.value = false;
        }
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

    return { email, code, requested, requesting, error, verified, requestCode, confirmCode, clearVerification };
}
