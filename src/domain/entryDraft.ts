export type EntryDraftType = 'partneredSex' | 'soloSex' | 'period' | 'periodDay' | 'symptom';

export type EntryDraftData = {
  date: string;
  time: string;
  count: string;
  duration: string;
  partnerAlias: string;
  sexTypes: string[];
  protectionMethods: string[];
  place: string;
  mood: string;
  satisfaction: string;
  arousal: boolean;
  partnerArousal: boolean;
  orgasm: boolean;
  toyUsed: boolean;
  lingerie: boolean;
  watchedAdultMovie: boolean;
  syncedWithPartner: boolean;
  ejaculationPlace: string;
  initiator: 'self' | 'partner';
  positions: string[];
  soloTools: string[];
  notes: string;
  periodEnd: string;
  flow: string;
  pain: string;
  symptoms: string[];
};

export type EntryDraft = {
  version: 1;
  type: EntryDraftType;
  savedAt: string;
  data: EntryDraftData;
};

export function parseEntryDraft(raw: string, expectedType: EntryDraftType): EntryDraftData | null {
  try {
    const draft = JSON.parse(raw) as Partial<EntryDraft>;
    if (!draft || typeof draft !== 'object' || draft.version !== 1 || draft.type !== expectedType) return null;

    const data = draft.data;
    if (!data || typeof data !== 'object' || typeof data.date !== 'string' || typeof data.notes !== 'string') return null;
    return data as EntryDraftData;
  } catch {
    return null;
  }
}
