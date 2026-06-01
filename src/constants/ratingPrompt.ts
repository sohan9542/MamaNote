/** Ask for a rating after this many saved logs (once per cooldown). */
export const RATING_PROMPT_AFTER_LOGS = 5;
export const RATING_PROMPT_COOLDOWN_DAYS = 7;

export const RATING_PROMPT = {
  title: 'Enjoying MamaNote?',
  message:
    'You’ve been logging like a pro. A quick rating on the App Store or Play Store helps other mamas find us.',
  rateCta: 'Rate MamaNote',
  feedbackCta: 'Send feedback instead',
  dismiss: 'Not now',
  storeUnavailable:
    'Store ratings will be available once MamaNote is published. You can still send us feedback anytime.',
} as const;
