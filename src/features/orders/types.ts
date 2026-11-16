/** Partner shape passed to client components. Never includes the access token. */
export type PartnerOption = { id: string; name: string; phone: string; active: boolean };

export type Selection = { selected: ReadonlySet<string>; toggle: (id: string) => void };
