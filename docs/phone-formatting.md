# Phone Formatting & Country Code Selection Guide

## Overview

Issue #162 introduces explicit country code selection and canonical phone normalization in the registration flow. This ensures that users from all supported application locales can register using familiar national formatting while guaranteeing that the backend receives clean, standardized E.164 phone numbers (`+<country-code><digits>`).

---

## Display vs. Stored/API Formats

The registration form supports two primary input patterns:

### 1. Local Phone Number with Selected Country Code

- **Display & Input**:
  - The user selects their country code from the dropdown (default: `+1`).
  - The user enters their local/national phone number into the phone field.
  - The input field accepts common formatting characters such as spaces, hyphens, parentheses, and dots (e.g., `(555) 123-4567` or `912 34 56 78`). Letters and disallowed characters are stripped.
- **Validation**:
  - The local portion is stripped of formatting characters and validated against the expected digit length for the selected country:
    - **+1** (US / Canada): 10 digits
    - **+34** (Spain): 9 digits
    - **+91** (India): 10 digits
    - **+86** (China): 11 digits
    - **+971** (UAE): 9 digits
- **Stored / API Payload**:
  - The client combines the selected country code and the cleaned local digits into canonical format: `+<country-code><local-digits>`.

### 2. Pasted E.164 International Number

- **Display & Input**:
  - Users may paste a complete international number starting with `+` (e.g., `+15551234567` or `  +34 912345678  `), including surrounding whitespace or formatting characters.
- **Normalization**:
  - Surrounding whitespace and internal formatting characters are stripped.
  - The parser identifies the country prefix without prepending the dropdown country code, preventing duplicate prefixes (e.g., `+1` is not prepended to `+34912345678`).
  - If the prefix matches one of the supported countries, the country code dropdown is synchronized, and the local digits are validated against that country's national rule.

---

## Examples

| Country | User Input | Selected Code | Stored / API Payload (`phone`) |
| :--- | :--- | :--- | :--- |
| **US / Canada (+1)** | `(555) 123-4567` | `+1 (US)` | `+15551234567` |
| **US / Canada (+1)** | `+15551234567` (pasted) | Any | `+15551234567` |
| **Spain (+34)** | `912 34 56 78` | `+34 (ES)` | `+34912345678` |
| **Spain (+34)** | `  +34 912345678  ` (pasted) | Any | `+34912345678` |
| **UAE (+971)** | `50 123 4567` | `+971 (AE)` | `+971501234567` |
| **UAE (+971)** | `+971 50 123 4567` (pasted) | Any | `+971501234567` |

---

## Handling Invalid & Unsupported Numbers

### 1. Invalid Local Lengths for Supported Countries
If the entered local number has too few or too many digits for the selected country (e.g., `91234567` with 8 digits for Spain, or `555123456` with 9 digits for US):
- The submit button is disabled.
- An accessible, localized validation error is displayed: *"Enter a valid phone number for the selected country"*.

### 2. Unsupported International Prefixes
If a user pastes an international number with a country calling code not in the supported dropdown (e.g., `+44 20 7946 0958`):
- The client applies a standard fallback E.164 length check: total digits must be between 10 and 15 digits (`^\+[1-9]\d{9,14}$`).
- If within standard E.164 bounds, the canonical number is preserved.
- If fewer than 10 or more than 15 digits, the number is rejected and marked invalid.

---

## Implementation Reference

The normalization and validation logic is centralized in the pure helper module:
- [`frontend/src/utils/phoneFormatting.js`](../frontend/src/utils/phoneFormatting.js)
  - Exports `parsePhoneNumber(input, selectedCountryCode)` which returns `{ isValid, canonical, countryCode, localDigits, isInternational, matchedSupportedCountry }`.
  - Ensures validation and submission logic share a single implementation path without divergence.
