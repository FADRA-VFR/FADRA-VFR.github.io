# FADRA

Project page for **FADRA: Frequency-Aware Diffusion with Residual Adaptation for Video Face Restoration**.

**[Project page](https://fadra-vfr.github.io/)** · **[Paper (arXiv)](https://arxiv.org/abs/2607.06389)**

Jin Jiang, Jia Wang, Panwen Hu, Weiran Zhao, Shengcai Liao  
United Arab Emirates University (UAEU) · Ocean University of China · MBZUAI

FADRA adapts a frozen text-to-video diffusion prior (Wan2.1-T2V-1.3B) to video
face restoration with LoRA and LQ pixel-alignment fusion, a Repeated Residual
Adaptation Head that re-examines the degraded input at every flow-matching
step, and a Frequency-Aware Loss that supervises perceptually important
spectral bands.

## Citation

```bibtex
@article{jiang2026fadra,
  title   = {FADRA: Frequency-Aware Diffusion with Residual Adaptation
             for Video Face Restoration},
  author  = {Jiang, Jin and Wang, Jia and Hu, Panwen and Zhao, Weiran and Liao, Shengcai},
  journal = {arXiv preprint arXiv:2607.06389},
  year    = {2026}
}
```

## Running the page locally

The site is static, with no build step.

```bash
python3 -m http.server 8000   # http://localhost:8000
```

## Adding a demo example

Each example in the Interactive Demo is one folder under `static/videos/{vfhq,celebv,real}/NN/`
holding `lq, rfpp, diffbir, keep, pgtformer, svfr, ours[, hq].mp4` plus `poster.jpg` and
`poster_lq.jpg`. All clips in a folder must share resolution, frame rate and length. Add a
matching `<button class="thumb">` in `index.html` (with `data-hq="1"` if `hq.mp4` exists), and
encode clips with one keyframe per second so switching and scrubbing stay responsive:

```bash
ffmpeg -i in.mp4 -an -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -g 16 -movflags +faststart out.mp4
```
