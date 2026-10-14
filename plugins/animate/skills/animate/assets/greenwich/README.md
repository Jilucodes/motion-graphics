# Greenwich photo library

The user's own photos from Greenwich Park and the National Maritime Museum, London. They were resized to 1440px on the long edge (JPEG q82) and their EXIF/GPS data was removed. All 20 together come to about 5.3 MB, below the 12 MB that `build.mjs` warns at.

**Using them:** copy the ones a beat needs into `pieces/<name>/assets/`. The build embeds everything in that folder, so copy only what the piece uses. Then draw them with `drawAsset('09-ship-model-deck-closeup.jpg', x, y, w, h, { fit: 'cover' })` inside the style's own framing (a torn-paper print, an inked frame, a riso card). All are 3:4 portrait except `08`, which is 4:3 landscape.

| file | what it shows | good for |
|---|---|---|
| `01-greenwich-park-skyline.jpg` | Canary Wharf seen from Greenwich Park hill, framed by an oak branch, under an overcast sky | an opening or establishing shot, then and now |
| `02-museum-atrium-blue.jpg` | the museum's glass-roofed atrium in saturated blue: a Georgian facade, the "Polar Worlds" and "Pacific Encounters" gallery signs, roof-lattice shadows | arriving at the museum, a blue world |
| `03-blue-string-curtain-painting.jpg` | royal-blue string curtain with a gilt-framed sea painting and a ship model behind it | a reveal or wipe through the strings |
| `04-rodney-jug-1782.jpg` | porcelain jug with a naval officer's head in a tricorn hat, inscribed "April the 12th 1782" (Battle of the Saintes) | a date card, 18th-century naval history |
| `05-bronze-figure-claw-foot.jpg` | gilt-bronze bust of an African man in a slave collar, set on a bird's claw foot | **sensitive:** an object depicting an enslaved person. Use it only with its history (slavery and empire), never as decoration or a joke |
| `06-red-wall-texture.jpg` | smooth red-to-coral gradient wall, no detail | a background plate, a colour field, a transition fill |
| `07-string-curtain-frame.jpg` | navy timber frame hung with blue strings, a warm ceiling, and an "Adinkra symbols" panel below | a section divider, West African textiles and symbols |
| `08-ship-model-hull-painting.jpg` | **landscape.** Hull model of a ship of the line with red gunport lids, under a gilt-framed battle painting | a hero object for a ship or navy era, a 16:9 plate |
| `09-ship-model-deck-closeup.jpg` | rigged model close-up: deck planking, cannons on red carriages, gratings, rope lines | a push-in on detail, "life on board" |
| `10-ship-model-rigging.jpg` | the same model from higher: full deck, masts, rigging, the base inlaid with a compass star | a ship establishing shot, a pull-out |
| `11-flintlock-pistol.jpg` | flintlock pistol lock: hammer, frizzen, crown and "GR" mark, walnut stock | weapons or conflict, Georgian Royal Navy |
| `12-portrait-mural-headwrap.jpg` | painted mural of a woman in a red headwrap, gold earrings and coral beads, with red, yellow, green and blue colour blocks behind | an African diaspora voice, a bold colour beat |
| `13-floor-screen-water.jpg` | a floor projection of water with a fish and ripples, a sneaker visible at the bottom | an ocean or water transition, "beneath the surface" |
| `14-jim-cook-mugshot.jpg` | Reg Mombassa, *Jim Cook Mugshot* (2013): Cook drawn as a criminal, "executed for armed robbery by the people of the South Pacific" | Captain Cook from the other side. **Third-party artwork:** credit "Reg Mombassa, courtesy Australian National Maritime Museum" and use it only for commentary or education |
| `15-tapa-costume-detail-blur.jpg` | soft-focus detail of a Pacific tapa-cloth costume: shell and lace breastplate, fabric flowers | a soft background, a rack-focus transition |
| `16-tapa-costume-flowers.jpg` | the costume in sharp focus: feathers, tapa patterns, a fabric-flower belt, a "COOK" label | Pacific Encounters, a counter-narrative |
| `17-tapa-costume-cook.jpg` | the costume from the front, with labels reading "COOK", "GODDESS", "ENDEAVOUR", "BANKS" and a belt of nails | Cook's voyage seen by Pacific artists. **Third-party artwork:** credit the artist |
| `18-maori-cabinet-lit.jpg` | a wooden museum cabinet filled with Māori-pattern panels (blue koru and figures, copper triangles, fish and sharks), shown bright | Aotearoa / New Zealand, a pattern plate |
| `19-maori-cabinet-dark.jpg` | the same cabinet with lower lighting and richer contrast | the moody version of `18`, for a lights-down beat |
| `20-bell-and-arm.jpg` | a brass ship's bell ("JOHN WILLIAMS") and a gilded carved arm holding a book, in amber light, with a visitor's face in the glass | missionaries in the Pacific. **Shows a real person:** crop out the visitor or ask before showing her |

Some exhibits are other artists' work (`12`, `14`, `16`, `17`, `18`, `19`, and the paintings in `03` and `08`). Credit them on screen when they are the subject of a beat.
