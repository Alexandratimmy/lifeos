# LifeOS · Native UI 0.2

A little more room to live.

An interactive React Native + Expo app for iOS and Android. The browser preview uses the same components and application logic. This build develops the complete agreed UI surface with a local demo household; it is not a connected production service.

## Run

Node 22 LTS or newer:

```bash
npm ci
npm start
```

Use a compatible Expo Go client, `npm run ios` with Xcode on macOS, `npm run android` with an Android emulator, or `npm run web` for browser review.

```bash
npx tsc --noEmit
npx expo export --platform all
```

The exports verify iOS/Android JavaScript bundles, not signed IPA/APK binaries. Device installation, native accessibility and physical-device testing are still required.

## Screens and interactive flows

| Screen | Working local interactions |
|---|---|
| Today | Live dates, day selector, filters, search, completion, daily progress, quick capture |
| Responsibility editor | Create/edit/delete, validated date/time, owner, backup, instructions, daily/weekly recurrence |
| My Life | Four area filters, connected responsibility lists, add new, essentials navigation |
| Circle | Add demo members, duplicate-name protection, preview member roles, pending handovers, accept/decline/cancel |
| Support | Reason, today/tomorrow scope, task selection, explicit note-sharing selection, activation, review, ending |
| Chat | Local command examples, due-task summary, handover summary, task draft creation, labelled sample voice animation |
| Essentials | Create/edit/delete contacts/notes/document references, categories, household visibility controls |
| Inbox | Requests for the selected demo member, due tasks, in-app reminder preference |
| Settings | Editable name, reduced motion, native haptics, compact rows, reminders, confirmed reset |
| Onboarding | Three-page walkthrough, accessible from Settings → Meet LifeOS |

## Visual system and motion

Pearly backgrounds, translucent white panels, a glossy jade orbit, floating blurred navigation, press springs, screen entrance transitions and a gently floating orbit. System Reduce Motion and the in-app preference disable optional animation. Native haptics are optional. Safe areas and keyboard-aware sheets are included.

## Important boundaries

- **Local demo:** AsyncStorage persists the native/offline browser demo on one device. The inline conversation preview uses session memory.
- **No AI connection:** Chat uses explicit, deterministic examples. It does not call an LLM. Task drafts require review. Unsupported messages lead to a manual draft; voice is a labelled sample animation with no microphone access or recording.
- **No real recipients:** Adding a member does not send an invitation. Role switching simulates acceptance locally. Ownership changes only after acceptance; the previous owner becomes the backup. Completed tasks clear pending requests.
- **No push delivery:** Inbox reminders are an in-app view of due tasks, not scheduled device notifications.
- **Prototype storage:** Essentials are unencrypted. Only use fictional sample data. Visibility filtering is a UI simulation, not server authorization. It must be replaced by authenticated enforcement before real use.
- **Support:** Ending a plan clears pending requests; accepted ownership changes remain. Notes explicitly shared with the circle remain shared until edited. LifeOS does not contact emergency services.
- **Recurrence:** Completing a daily/weekly task creates the next local occurrence. Reopening and recompleting does not duplicate an existing next occurrence. No background scheduler is used.
- **Sample dates:** Reset the demo in Settings to refresh sample dates after a calendar-day change.

## Code map

- `App.tsx`: connected screens, editor sheets and local UI state.
- `src/ui.tsx`: reusable glass panels, orbit, icons, typography, controls and motion primitives.
- `src/domain.ts`: state types, defaults, date validation, recurrence and command draft parsing.
- `src/model.ts`: base responsibility model and sample tasks.
- `src/theme.ts`: shared branding tokens.
- `assets/lifeos-mark.svg`: editable original orbit mark; `assets/icon.png`: app icon.
- `scripts/build-preview.py`: optional standalone packaging after web export; requires Python `fonttools`.
- `BRAND.md`: updated brand direction.
- `VERIFICATION.md`: actual checks and remaining gates.

## Next implementation stage

Separate screen state into a service-backed store; add authentication, household authorization, secure storage, server-side handover acceptance, sync conflict handling, notification scheduling, speech transcription and a reviewed AI action layer. This UI does not replace those engineering steps.
