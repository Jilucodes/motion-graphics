# The keynote-reveal formula

A short-form narration formula: a product-launch keynote applied to something that isn't a product.
Studied from the three biggest reels on @spearpointpro (480K, 182K and 77K plays, October 2026),
broken down with vidIQ for script, pauses and word-picture timing. Use the structure; write your own
character, jokes and lines.

## The storyline: five acts

| Act | What happens | Length |
|---|---|---|
| 1. Problem | One blunt line, 3–5 words. Hard stop. | 2–3s |
| 2. Vision | "So we asked ourselves… what if…" | 3–5s |
| 3. Reveal | "Introducing… [beat] *Name*." The reveal happens ON the name. Applause or a hit. | 4–5s |
| 4. Features | 2–3 traits pitched as specs; the picture proves each one on its word | 15–25s |
| 5. One more thing | An escalation: a new tier (Mini, Pro, Pro Max) or a "never offered before" feature | 5–10s |
| 6. Silent beat + button | 3–7s of no words while the picture carries the payoff, then one flat line to camera | 5–10s |

Hits run 45–60s. Under 25s underperforms.

## The words

- Short sentences, 3–8 words. One idea each.
- Keynote vocabulary: *introducing, we asked ourselves, entirely new, smaller package, for the first time,
  exclusive to, we think you're going to love it.*
- **Literalized tech terms:** a digital phrase becomes a physical act (a cat knocking a cup off is a
  "push notification").
- **Flaw as feature:** the worst limitation, announced proudly.
- **Parallel two-beat lines:** "Same X… different Y."
- **Customer defiance:** "You asked for X… [beat] We did not listen."
- **The deadpan disclaimer button:** the fatal flaw read like release notes, fast and clipped.
- The presenter never laughs. Earnest delivery is the joke.

## The pauses (measured)

| Pause | Where | Mark in script |
|---|---|---|
| 0.2–0.3s | Before the key word in a line | `[·]` |
| 0.4–0.5s | Before every punchline | `[beat]` |
| 0.8–1.0s | Before the product name or top tier; after the opening line | `[hold]` |
| 3–7s silence | The visual gag | `(silence Ns: …)` |
| Fast, clipped | The final disclaimer | `(clipped)` |

Speech fills about 70–80% of the runtime; the rest is deliberate silence, applause or gag.

## Word–picture rules

1. **The picture acts on the word**, not the sentence: the cover comes off on the name, the swat lands
   on "neutralized".
2. **Pauses are filled with reactions**: an animal, a look to camera, an assistant's blank face.
3. **The visual punchline comes after the words stop.**
4. **The last line is said over the aftermath**, straight to camera.

In Hypit, write the pauses into `<script>` and bind each reveal to its word, not to a second count;
a re-take of the voice re-times the picture.

## Voice

A warm, calm, deliberate keynote presenter, designed as an original voice (ElevenLabs voice design).
Never a clone or imitation of a real person's voice.

## Scope: history only

This formula is used for history videos only.

| History topic | How |
|---|---|
| Inventions, odd firsts, schemes, plans that backfired | The full formula: "Introducing… the Trojan Horse." Features come from the record; the silent beat is the historical outcome |
| Tragic events (disasters, wars, deaths) | Structure, pauses and word–picture timing only. Drop the parody register; it reads as mocking the people who died |

Every feature line is a claim about the past: check it against a source and keep the source with
the script.

## Template

```
[0.0]  <Problem, 3–5 words.>                                (hold)
[2.0]  So we asked ourselves… [beat] what if <vision>?
[6.5]  Introducing… [hold] <Name>.                         → reveal ON <Name>, applause/hit 2s
[11.5] <Trait as spec.> [·] <twist>.                        → picture proves it ON <key word>
[15.5] <Flaw as feature…> [beat] <payoff word>.             → picture acts ON <payoff word>
[19.0] (silence 3s: <consequence plays out>)
[22.5] And for those who need more… [hold] <Name Pro>.
[27.5] <Two-beat parallel line.>
[31.0] (silence 4s: <bigger consequence>)
[36.0] <Fatal flaw as release note.>                        (clipped, to camera)
```
