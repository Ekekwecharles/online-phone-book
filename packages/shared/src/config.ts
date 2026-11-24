// The product name lives here only. Change it here to rename the product.
export const APP_NAME = "Phone Book";
export const APP_TITLE = "Phone Book – Online Phone Book for your contacts";
export const APP_DESCRIPTION =
  "Online Phone Book keeps a safe copy of your phone contacts online. Phone spoiled or lost? Log in from any phone and get any number.";

// TODO(owner): put the real support email here before launch.
export const CONTACT_EMAIL = "hello@example.com";

// Web session rules (rule 3: short sessions, no "remember me").
export const SESSION_IDLE_MINUTES = 30;
export const SESSION_MAX_MINUTES = 60;

// Login notice rule: at most one login email per account in this window.
export const NOTICE_EMAIL_COOLDOWN_MINUTES = 10;

export const CONTACTS_PAGE_SIZE = 50;

// Plan limits. Everything is free and unlimited for now (LIMITS_ON = false).
// When Pro starts, set LIMITS_ON to true. Then the Free plan keeps up to FREE_CONTACT_LIMIT contacts,
// and only real phone numbers (codes and short or random numbers are not saved).
export const LIMITS_ON = false;
export const FREE_CONTACT_LIMIT = 5000;
