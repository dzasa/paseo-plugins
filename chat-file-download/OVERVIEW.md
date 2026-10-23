# Chat file download

Adds a row of download chips under every agent reply that mentions a file, so you can save a file
the agent wrote or pointed at without leaving the chat. Paseo's built-in Files download only covers
the workspace folder; this plugin downloads any regular file the daemon user can read, such as
/tmp/report.csv or a file under the home folder.

When a turn ends, the plugin scans the reply text for path-like tokens, keeps the ones that exist
as regular files on the daemon machine, and appends one row with a chip per file (name and size).
Pressing a chip pulls the bytes through the daemon and opens the browser's save prompt. The
`/download <path>` command does the same for any path, relative to the agent's folder.

Limits: chips appear on the web and desktop apps only (mobile shows an error). Rows live in the
daemon's memory, so they disappear after a daemon restart; use `/download` for older replies.
Paths that contain spaces are not detected.
