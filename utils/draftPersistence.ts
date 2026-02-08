import { FormAnalysis } from '../types';

export const DRAFT_STORAGE_KEY = 'autoform_ai_draft_v1';

export type DraftPayload = {
    version: 1;
    savedAt: number;
    url: string;
    step: 1 | 2 | 3;
    analysis: FormAnalysis | null;
    targetCount: number;
    delayMin: number;
    nameSource: 'auto' | 'indian' | 'custom';
    customNamesRaw: string;
    customResponses: Record<string, string>;
    aiPromptData: string;
};

export const isDraftPayload = (value: unknown): value is DraftPayload => {
    if (!value || typeof value !== 'object') return false;

    const draft = value as Partial<DraftPayload>;
    return draft.version === 1
        && typeof draft.savedAt === 'number'
        && Number.isFinite(draft.savedAt)
        && typeof draft.url === 'string'
        && (draft.step === 1 || draft.step === 2 || draft.step === 3)
        && (draft.nameSource === 'auto' || draft.nameSource === 'indian' || draft.nameSource === 'custom')
        && typeof draft.customNamesRaw === 'string'
        && typeof draft.targetCount === 'number'
        && Number.isFinite(draft.targetCount)
        && typeof draft.delayMin === 'number'
        && Number.isFinite(draft.delayMin)
        && typeof draft.aiPromptData === 'string'
        && !!draft.customResponses
        && typeof draft.customResponses === 'object';
};

export const formatDraftAge = (savedAt: number) => {
    const diffMs = Date.now() - savedAt;
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hours = Math.floor(mins / 60);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
};
