<script>
    import { t } from "$lib/i18n";
    import { Icon } from "$lib/utils/icons";
    import { MessageDialog } from "$lib/utils/dialog";
    import { tabletMode } from "./tabletMode.svelte.js";

    // Local UI state is fine here: this is a `.svelte` component, so the Svelte
    // compiler injects the $state rune. The shared `tabletMode` store lives in
    // `./tabletMode.svelte.js` (also a rune module).
    let showDialog = $state(false);
</script>

{#if tabletMode.active}
    <!-- Bottom-right floating pill; opens the project's standard message dialog -->
    <button
        class="tablet-banner"
        type="button"
        title={t("tablet.banner")}
        onclick={() => showDialog = true}
    >
        <Icon src="/icons/sym-info.svg" size="1rem" />
        <span class="tablet-label">{t("tablet.modeLabel")}</span>
    </button>

    <MessageDialog
        bind:shown={showDialog}
        title={t("tablet.title")}
        buttons={{
            OK: () => {}
        }}
    >
        <p>{t("tablet.body")}</p>
        <p class="tablet-suggestion">{t("tablet.switchSuggestion")}</p>
    </MessageDialog>
{/if}

<style>
    .tablet-banner {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        background: var(--base);
        border: 1px solid var(--overlay);
        border-radius: 20px;
        cursor: pointer;
        font-family: var(--body);
        font-size: 12px;
        font-weight: 500;
        color: var(--text);
        opacity: 0.85;
        transition: opacity 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
        user-select: none;
    }
    .tablet-banner:hover {
        opacity: 1;
        background: var(--base);
        border-color: var(--blue);
    }
    .tablet-banner:focus-visible {
        outline: none;
        border-color: var(--blue);
    }
    .tablet-label {
        font-weight: 500;
    }
    /* Emphasis line uses the project accent; inherits --text from the dialog. */
    .tablet-suggestion {
        color: var(--blue);
    }
</style>
