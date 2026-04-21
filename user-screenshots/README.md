# Drop your own screenshots here

The gallery HTML (`../Sharing UX gallery.html`) auto-loads any images you put in these folders and shows them in a "Your screenshots" section for the matching tool.

## How it works

- Each tool has its own folder (matching the id used in the gallery): `stormboard`, `miro`, `figjam`, `lucidspark`, `whimsical`, `tldraw`, `notion`, `evernote`, `canva`, `lovable`, `perplexity`, `claude`.
- Put PNG, JPG, or WEBP files in the folder for that tool.
- Name them with a two-digit prefix so the order is predictable: `01-share-dialog.png`, `02-permissions.png`, `03-guest-invite.png`, etc. The prefix is what the gallery uses to sort; the rest of the name becomes the caption.
- Up to 20 images per tool are auto-loaded. Anything beyond that is ignored.

## Filename → caption

`03-guest-invite.png` renders as caption **"Guest invite"** (kebab/underscore → spaces, title-cased).

## After dropping files

Just reload the gallery in your browser. No other action needed.
