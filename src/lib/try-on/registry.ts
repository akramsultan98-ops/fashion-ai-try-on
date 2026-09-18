import 'server-only';

import type { VirtualTryOnProvider } from './provider';
import { GeminiTryOnProvider } from './providers/gemini';
import { ReplicateTryOnProvider } from './providers/replicate';
import { SimulationTryOnProvider } from './providers/simulation';
import type { TryOnProviderInfo, TryOnProviderOption } from './types';

const factories: Record<string, () => VirtualTryOnProvider> = {
  gemini: () => new GeminiTryOnProvider(),
  replicate: () => new ReplicateTryOnProvider(),
  simulation: () => new SimulationTryOnProvider(),
};

export const PROVIDER_IDS = Object.keys(factories);

let cached: VirtualTryOnProvider | undefined;
let cachedFor: string | undefined;

/**
 * Resolves the active provider from `TRYON_PROVIDER`.
 *
 * When the named provider is present but unconfigured we still return it, so
 * the UI can say exactly which environment variables are missing instead of
 * silently degrading to the local preview. Falling back only happens when
 * nothing is named at all.
 */
export function getProvider(): VirtualTryOnProvider {
  const requested = (process.env.TRYON_PROVIDER || '').trim().toLowerCase();
  const id = requested in factories ? requested : 'simulation';

  if (cached && cachedFor === id) return cached;
  cached = factories[id]();
  cachedFor = id;
  return cached;
}

/** How a real generation backend gets connected. Shown by the UI, not used by it. */
const SETUP_OPTIONS: TryOnProviderOption[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    env: ['TRYON_PROVIDER=gemini', 'GEMINI_API_KEY'],
    credentialSource: 'Google AI Studio (aistudio.google.com/apikey)',
    note: 'Layers every selected garment in a single request.',
  },
  {
    id: 'replicate',
    label: 'Replicate',
    env: ['TRYON_PROVIDER=replicate', 'REPLICATE_API_TOKEN', 'REPLICATE_TRYON_MODEL'],
    credentialSource: 'replicate.com/account/api-tokens',
    note: 'Runs a hosted try-on model such as IDM-VTON, one garment per prediction.',
  },
];

export function describeProvider(): TryOnProviderInfo {
  const provider = getProvider();
  const config = provider.configuration();

  // Setup guidance is attached whenever no real model will run: either nothing
  // is connected at all, or the provider that was named is missing its keys.
  // Without this the local preview reports `configured: true` and the UI has
  // nothing concrete to tell the operator.
  const generating = !provider.simulated && config.configured;

  return {
    id: provider.id,
    label: provider.label,
    configured: config.configured,
    simulated: provider.simulated,
    missing: config.missing,
    capabilities: provider.capabilities,
    notice: config.notice,
    setup: generating
      ? undefined
      : {
          headline: provider.simulated
            ? 'AI generation API is not configured'
            : `${provider.label} is not configured`,
          detail: provider.simulated
            ? 'Results below are composited locally from the product artwork. No AI model produced them.'
            : `Set ${config.missing.join(' and ')} to enable generation. Until then nothing can be generated.`,
          options: provider.simulated
            ? SETUP_OPTIONS
            : SETUP_OPTIONS.filter((option) => option.id === provider.id),
        },
  };
}
