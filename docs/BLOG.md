# Blog (updates)

News and updates live at `/blog`. There is no database and no admin screen: posts are plain data in `src/content/posts.ts`, so adding one is an edit and a push.

## Pages

- `/blog` lists posts, newest first, each with a one-sentence summary and two buttons.
- `/blog/<slug>/summary` is the 30-second page: the summary, 3 to 5 key points, and links to the full post or to one section of it.
- `/blog/<slug>` is the full post. It opens with an "In 30 seconds" box, a row of jump links, numbered sections, and a thin reading-progress bar.

## Add a post

Add an object to the `posts` list in `src/content/posts.ts`:

- `slug` (lowercase words joined by dashes), `title`, `date` (`2026-11-15`), `tag` (Update, Safety, Product or News).
- `summary`: one sentence, up to 200 characters.
- `keyPoints`: 3 to 5 short points, each up to 140 characters.
- `sections`: each has an `id`, a `heading` and `body` blocks: `p` (paragraph), `list` (bullets) or `callout` (highlighted line). Put `**double stars**` around a few words to make them bold.

`src/blog.test.ts` fails if a post breaks the readability rules (long summary, paragraph over 320 characters, list over 7 items, repeated section ids), so posts stay quick to read. Text is shown as plain text: HTML and links are not supported, on purpose.

Posts are built when the site is built, so a new post appears after the push deploys.
