---
name: new-game-integration
description: Analyzes a new game's rules (a single .md rulebook, a folder of .md/.csv reference files, or a pasted rules summary) and translates them into a concrete, file-by-file implementation plan for this repo — mapping setup, scoring, and win conditions onto the existing config.js / rules.js / data/*.js / Calculator.jsx pattern used by flip7 and happy-little-dinosaurs. Runs a Ponytail reuse gate before any new code is proposed, so PlayerSetup, ShareCard, useSessionStorage, and the phase-machine shape get reused instead of rebuilt.
when-to-use: When the user says "add a new game", "implement <game>", "here are the rules for X", or drops a rules file/folder under resources/new-games/<Game Name>/ and wants it turned into a playable calculator.
user-invocable: true
paths: ["resources/new-games/**/*.md", "resources/new-games/**/*.csv"]
effort: high
---

# New Game Integration

You are adding a game to a Vite + React board-game-helper app that already has a
working shape (`flip7`, `happy-little-dinosaurs`). The job is translation, not
invention: read the rules once, find where they already fit an existing
pattern, and write only the sliver that's actually new. Apply
`.agents/rules/ponytail.md` throughout — the ladder (does it exist already? →
stdlib/native? → installed dep? → one line? → minimum new code) governs every
file below.

## Step 0 — Read the whole source before writing anything

- Source files live at `resources/new-games/<Game Name>/` (the `.md`
  rulebook) and `resources/new-games/<Game Name>/images/` (extracted page
  images). Read them in place — never copy, move, or reference them in the
  output. The only files the skill produces are under `src/`.
- Single `.md` file → read it fully, don't skim for a scoring section.
- Folder → read **every** `.md` and `.csv` inside. This repo's existing card
  data (`dinosaurs.js`, `instantCards.js`, `hazardCards.js`) was hand-parsed
  from CSVs like `Localizacion_Hazard_Cards_Final.csv`. Expect the same shape
  for a new game: one CSV/table per card or character type, an EN/ES pair of
  columns for name/effect.
- Do not open an editor until you can fill in the checklist in Step 1 from
  the source material alone. Guessing a scoring rule and fixing it twice later
  costs more than reading it twice now.

### Images in the resource folder — read, then discard from context

Images at `resources/new-games/<Game Name>/images/` are a disambiguation
tool only. Read them silently during Step 0; never cite them, link them, or
mention them in the Step 5 output.

| Image type | Read it? | Why |
|---|---|---|
| Card face — shows category badge, bonus value, trigger timing, discard rule | **Yes** | OCR may mislabel the badge or drop the timing clause; image settles it |
| Rules-text paragraph (even partially cut off) | **Yes, if the adjacent `.md` text looks wrong** | Cross-check for misread numbers or keyword casing |
| Pure illustration — character art, logo, game photo without text | **No** | Zero implementation signal; skip |

When image and `.md` disagree, trust the image for **structure** (field
names, categories, bonus sign) and the `.md` for **prose effect text**.
Once the ambiguity is resolved, move on — the image has done its job.

## Step 1 — Extraction checklist

Pull these out of the rules and note where each one lands:

| From the rules | Lands in |
|---|---|
| Name, player count, est. time, theme/tags, icon | `config.js` |
| Round/turn structure, any pre-round setup step (e.g. picking a character) | `Calculator.jsx` phase list |
| The scoring formula, in the exact order operations apply | `rules.js` — one pure function |
| Named characters/roles with situational bonuses or penalties | `data/<x>.js`, trait-lookup style |
| Persistent penalties attached to a player across rounds | `data/<x>.js`, hazard-card style |
| One-shot playable effect cards | `data/<x>.js`, instant-card style |
| Win condition: race to a target score | `checkWinner(players, target)` style |
| Win condition: race to a track position / elimination | `checkWin(position)` + `checkElimination(...)` style |
| Round outcome (who "wins"/"loses" a round, ties) | `determineRoundOutcome(scores)` style |
| Thematic noun for a player role ("Dino", "Architect", "Adventurer"…) | `config.js` → `playerNoun: { en: '...', es: '...' }` |

## Step 2 — Common rule-text → repo-pattern map

Use this to avoid re-deriving a shape that already exists in `rules.js`:

- **"You bust/are eliminated for the round if you get a duplicate/matching X"**
  → `checkBust()` in `flip7/rules.js`. Copy the `Set`-based duplicate check.
- **"Each character/role gets +N or -N against a certain condition"**
  → the `traits` lookup object + `traitBonus` calc in
  `happy-little-dinosaurs/rules.js::calculateRoundScore`.
- **"A card attaches to a player and modifies their score every round until removed"**
  → `hazardCards.js` shape (`scoringModifier` string ID) consumed via a
  `hazardModifiers` array param, exactly like `calculateRoundScore` does.
- **"Play this card once for an immediate effect"**
  → `instantCards.js` shape (`category`, `scoringPhase` boolean, `modifier`).
- **"First to reach N points wins, ties broken by highest score"**
  → `checkWinner()` in `flip7/rules.js`.
- **"Move along a track to space 50/N to win, or be eliminated for 3 penalty cards"**
  → `advanceEscapeRoute()` + `checkWin()` + `checkElimination()` in
  `happy-little-dinosaurs/rules.js`.
- **"Swap high/low score", "double an effect", "halve an effect"**
  → small standalone pure functions like `applyScoreInversion()` — one
  function per special effect, not a generic effect-engine.

If a rule doesn't match any row above, write the smallest new pure function
that captures it — don't build a general-purpose rules engine to cover one
game's one weird card.

## Step 3 — Ponytail gate (run before proposing any new file)

1. Does this exact mechanic already exist in `flip7/rules.js` or
   `happy-little-dinosaurs/rules.js`? → Adapt that function's signature and
   shape, don't reinvent it.
2. Does `PlayerSetup.jsx` cover player entry + colors? → Yes, always. Only
   pass `renderPlayerExtra` if the game needs a pre-round per-player choice
   (mirrors the dinosaur-picker phase).
3. Does `ShareCard.jsx` cover the end screen? → Yes, always. Map the final
   standings into `{ name, score, color, isWinner }` and pass a `funStat`
   string, same as both existing calculators.
4. Does `useSessionStorage` cover mid-game persistence? → Yes, always. Every
   piece of calculator state (`phase`, `players`, `roundNum`, `roundData`,
   any selection map) goes through it with the `<gameId>-<field>` key
   convention. No new persistence hook.
5. Do `i18n/en.js` / `i18n/es.js` already have the string you need (`round`,
   `score`, `nextRound`, `finishRound`, `gameOver`, `playAgain`,
   `shareResults`, `players`, `playerPlaceholder`, ...)? → Reuse it. Only add
   new keys prefixed `<gameId>_` for genuinely game-specific text.
   `playerNoun` (the themed label shown instead of "Player N") lives in
   `config.js`, not i18n — no new i18n key needed for it.
6. Does this need a new npm dependency (shuffling, RNG, a state-machine lib,
   a UI kit)? → No. `react`, `react-router-dom`, and `html-to-image` are
   already enough for every game shape seen so far. Don't add one.

Only what survives this gate gets written. For a typical game that's:
`config.js`, `rules.js`, `Calculator.jsx`, optionally one `data/*.js`, a
handful of new i18n keys, and one registry entry.

## Step 4 — File-by-file plan

**`src/games/<game-id>/config.js`**
Same shape as `flip7/config.js` / `happy-little-dinosaurs/config.js`:
`id`, `name`, `minPlayers`, `maxPlayers`, `estimatedTime`, `tags`,
`description` (an i18n key, not literal text), `icon`,
`playerNoun: { en: '...', es: '...' }` (the thematic role label shown instead
of "Player N" when a name is left blank — e.g. `{ en: 'Dino', es: 'Dino' }`),
plus any single game-specific constant the win condition needs (`targetScore`,
`maxEscapeRoute`-equivalent, etc.).

**`src/games/<game-id>/data/<x>.js`** — only if Step 1 found a named table.
- Plain array of plain objects, no classes, no builder pattern.
- Localized text as `nameEN`/`nameES` or `effectEN`/`effectES` pairs.
- Export exactly the getters needed (`getXName(x, locale)`,
  `getXEffect(x, locale)`), matching `dinosaurs.js`/`instantCards.js`.
- Skip this file entirely for score-only games — `flip7` has none.

**`src/games/<game-id>/rules.js`**
- Pure functions, zero React/DOM imports, importable in isolation.
- Same JSDoc style as the existing two files (`@param`, `@returns`) —
  copy the format, not the content.
- Ponytail self-check: leave one runnable, assert-based check for the core
  scoring formula. `vitest` is already a devDependency — a small
  `rules.test.js` with a couple of `expect()` calls is enough. No fixtures,
  no per-function suite unless the game's scoring has several genuinely
  distinct branches.

**`src/games/<game-id>/Calculator.jsx`**
- Copy the phase-machine shape verbatim:
  `PHASES = { SETUP, [optional pre-round phase], PLAYING, ROUND_RESULT, GAME_OVER }`.
- `useSessionStorage('<game-id>-phase', ...)` etc., same key convention.
- `SETUP` → `<PlayerSetup minPlayers={config.minPlayers} maxPlayers={config.maxPlayers} onStart={...} playerNoun={config.playerNoun?.[locale]} />`. Always destructure `locale` from `useI18n()` and pass `playerNoun` so placeholder and fallback names are themed.
- `GAME_OVER` → final standings + `<ShareCard .../>` unmodified, same
  `funStat` string pattern as the two existing calculators.
- Every interactive element gets an `id="btn-<action>-<idx>"` /
  `id="<field>-<idx>"` following the existing convention exactly (other
  parts of the app rely on these ids for hooks/tests).
- All user-facing text goes through `useI18n()` — no hardcoded strings.

**`src/i18n/en.js` and `src/i18n/es.js`**
Add only the missing `<game-id>_`-prefixed keys, in both files, in the same
relative position (end of file works fine). Add the `description` key
referenced by `config.js`.

**`src/games/index.js`**
Three-line diff only: one config import, one entry in the `games` array, one
entry in the `loaders` map inside `loadCalculator`. Nothing else in the file
changes.

## Step 5 — Output format when this skill runs

1. A short table: rule text → mapped repo concept (one row per major rule,
   using the Step 2 map where it applies).
2. The concrete file list to create/edit — paths only.
3. Full code for `config.js`, `rules.js` (with its self-check), and
   `data/*.js` if one is warranted.
4. `Calculator.jsx` — write only the genuinely game-specific parts; call out
   explicitly where a block is copy-pasted from `flip7`/`happy-little-dinosaurs`
   verbatim versus adapted.
5. The exact diff for `games/index.js` and the new i18n lines.
6. One `skipped: [X], reuse [existing thing] instead` line per abstraction
   that was NOT built, so the reasoning is visible without an essay.

Keep the prose in step 5 to that list — the code is the deliverable.