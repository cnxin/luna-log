# Luna Log v1.0.14

## Intimacy record sheet reliability

- Fix the Android layout regression that could collapse the intimacy record sheet to the bottom of the screen.
- Allow the sheet handle to respond to upward drags as well as downward dismissal gestures.
- Start the opening animation only after the native sheet content is mounted.

## Search, shared UI, and verification

- Add local keyword search to recent records and keep timeline filtering compact.
- Consolidate repeated fields, option sections, empty states, icon buttons, and list rows into shared UI components.
- Add multi-viewport Web E2E coverage for sheet dragging, duration selection, details expansion, and record saving.
- Add GitHub Actions verification and signed Android release workflows.

## Release

- Android versionCode: 15
- Supports upgrade from 1.0.13
- Signed with the Luna Log release certificate.
- APK SHA-256: 46251ED4B0EE04A2822F619EBC7B406EE421E5C34A00547FDC5DAD102B6A6BD0
- APK Size: 88528990 bytes
