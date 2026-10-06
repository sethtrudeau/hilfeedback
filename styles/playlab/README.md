# Playlab design system tokens

Copied unchanged from the v3 Playlab Design System bundle (`tokens/`), built from
`playlab-education/playlab-design` **v3.1.0**. Edit them only by re-copying from a newer release.

`fonts.css` is the one adapted file: the Adobe Fonts kit is linked from `app/layout.tsx` instead of
being `@import`ed. `base.css` is imported into the `base` cascade layer (see `app/globals.css`) so
component classes can override its element defaults.

Component styles that implement the system's specs (buttons, cards, tags, badges, fields, tabs,
tables) live in `app/globals.css`.
