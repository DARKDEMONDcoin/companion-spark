// RichAds Telegram Mini App ads controller helper.
// The SDK script + initialize() live in index.html.

const AD_METHODS = [
  "triggerRewardedVideo",
  "triggerRewardedInterstitial",
  "triggerInterstitialVideo",
  "triggerInterstitialBanner",
  "triggerPushStyleAd",
  "triggerPush",
] as const;

export const isAdsReady = () => {
  const controller = (window as any).TelegramAdsController;
  if (!controller) return false;
  return AD_METHODS.some((m) => typeof controller[m] === "function");
};

/** Shows one ad. Resolves true when the ad was shown/finished. */
export const showAd = async (): Promise<boolean> => {
  const controller = (window as any).TelegramAdsController;
  if (!controller) return false;

  for (const method of AD_METHODS) {
    if (typeof controller[method] !== "function") continue;
    try {
      await controller[method]();
      return true;
    } catch {
      // try the next available ad format
    }
  }
  return false;
};
