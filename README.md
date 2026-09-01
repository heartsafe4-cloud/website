# HeartSafe Singapore — Website

Static marketing site for HeartSafe Singapore: authorised Mindray BeneHeart AED distributor and CPR / AED / choking first response training provider.

**Live domain (planned):** https://www.heartsafe.com.sg

## Stack

Plain HTML / CSS / JS — no build step, no framework. Deploy by serving this folder from any static host (GitHub Pages, Netlify, Vercel, S3, shared hosting).

## Pages

- `index.html` — home (scroll-driven CPR hero: one scroll = one compression), stats, AED feature, logo carousel, training, partner grid, newsletter
- `training.html` + `training-cpr-aed.html`, `training-choking.html`, `training-workplace.html`
- `products.html` + `product-c1a.html`, `product-c2.html`, `product-c2-4g.html`, `product-accessories.html`
- `about.html`, `news.html`, `contact.html`

## Local preview

```bash
python3 -m http.server 8742
```

then open http://localhost:8742

## Notes

- Contact form and quote CTAs open WhatsApp (+65 8845 3764) with a pre-filled message — no backend required.
- Product datasheets served from `assets/docs/`.
- Hero videos in `assets/video/` are encoded all-intra for smooth scroll-seeking; re-encode the same way if the footage is ever replaced.
