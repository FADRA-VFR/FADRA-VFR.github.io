# FADRA project page

Static site (plain HTML/CSS/JS), ready for GitHub Pages.

## Videos

The Interactive Demo reads one folder per example:

    static/videos/{vfhq,celebv,real}/NN/
      lq.mp4 rfpp.mp4 diffbir.mp4 keep.mp4 pgtformer.mp4 svfr.mp4 ours.mp4 [hq.mp4]
      poster.jpg poster_lq.jpg

| Folder | Source (ECCV supplementary) |
|---|---|
| `vfhq/01`–`03` | MainPaper-Fig3 / Video1–3 |
| `celebv/01`, `02` | Appendix-FigA1, A2 |
| `real/01`, `02` | Appendix-FigA3, A4 (no HQ) |

All clips in one example must share resolution, frame rate and length. To add an example,
create the folder, add a `<button class="thumb">` in `index.html` (set `data-hq="1"` if
`hq.mp4` exists), and encode with:

    ffmpeg -i in.mp4 -an -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -g 16 -movflags +faststart out.mp4

`-g 16` (one keyframe per second at 16 fps) keeps switching and scrubbing snappy.

## Still to fill in
- Code link (button is disabled in `index.html`)
- Author homepage links (`href="#"`)
