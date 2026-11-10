const fs = require('fs');

const mockup = fs.readFileSync('surge-marketplace-mockup (1).html', 'utf8');
const styleMatch = mockup.match(/<style>([\s\S]*?)<\/style>/);

if (!styleMatch) {
  console.error('Style tag not found in mockup!');
  process.exit(1);
}

let css = styleMatch[1];

// Additional styles for Switcher, Lightbox, and enhancements
const extraCss = `
/* Top Switcher Bar Integration */
.switcher {
  background: #000;
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 38px;
  font-family: var(--font);
  font-size: 12px;
  z-index: 100;
  border-bottom: 1px solid #222;
}
.switcher .brandmark {
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.5px;
  margin-right: 18px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.switcher .brandmark span {
  color: #B3262E;
  font-size: 11px;
}
.switcher .switcher-link, .switcher button {
  background: transparent;
  border: 0;
  color: #C8C8C8;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  border-radius: 3px;
  transition: all .15s ease;
}
.switcher .switcher-link:hover, .switcher button:hover {
  color: #fff;
  background: rgba(255,255,255,.08);
}
.switcher button.active, .switcher .switcher-link.active {
  background: #0B3C75;
  color: #fff;
  font-weight: 600;
}
.switcher .switcher-signout {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-left: auto;
  margin-right: 0;
  padding: 4px 11px;
  border: 1px solid rgba(224, 85, 92, 0.45);
  border-radius: 4px;
  background: rgba(224, 85, 92, 0.08);
  color: #F08B90 !important;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}
.switcher .switcher-signout:hover {
  background: #B3262E;
  border-color: #B3262E;
  color: #FFFFFF !important;
}
.switcher .switcher-signout .ico {
  width: 13px;
  height: 13px;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Photo Full Screen Hover Badge on Cards */
.card .img {
  position: relative;
  overflow: hidden;
}
.card .img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .25s ease;
}
.card:hover .img img {
  transform: scale(1.03);
}
.card .img-fullscreen-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all .2s ease;
  cursor: pointer;
  z-index: 5;
}
.card:hover .img-fullscreen-btn {
  opacity: 1;
  transform: translateY(0);
}
.card .img-fullscreen-btn:hover {
  background: #0B3C75;
  border-color: #0B3C75;
}

/* Detail Gallery Full Screen Button */
.gal .img {
  position: relative;
  cursor: pointer;
}
.gal .img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.gal .gal-fs-btn {
  position: absolute;
  bottom: 14px;
  right: 14px;
  background: rgba(11, 60, 117, 0.88);
  backdrop-filter: blur(4px);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all .15s ease;
  z-index: 5;
}
.gal .gal-fs-btn:hover {
  background: #B3262E;
  border-color: #B3262E;
}
.thumbs div {
  cursor: pointer;
  overflow: hidden;
  position: relative;
}
.thumbs div img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Fullscreen Lightbox Modal */
#lightbox-modal {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: lbFadeIn .2s ease-out;
}
@keyframes lbFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.lb-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(10, 15, 25, 0.96);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.lb-stage {
  max-width: 94vw;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 100001;
}
.lb-photo {
  max-width: 92vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 16px 56px rgba(0,0,0,0.85);
  user-select: none;
}
.lb-close {
  position: absolute;
  top: 20px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 28px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  z-index: 100002;
}
.lb-close:hover {
  background: #B3262E;
  border-color: #B3262E;
  transform: scale(1.05);
}
.lb-prev, .lb-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 38px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  z-index: 100002;
}
.lb-prev { left: 24px; }
.lb-next { right: 24px; }
.lb-prev:hover, .lb-next:hover {
  background: #0B3C75;
  border-color: #0B3C75;
  transform: translateY(-50%) scale(1.05);
}
.lb-bar {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 92vw;
  color: #E2E8F0;
  font-size: 13.5px;
  padding: 8px 16px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  backdrop-filter: blur(6px);
}
.lb-caption {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lb-count {
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
  margin-left: 16px;
  white-space: nowrap;
  font-weight: 600;
}
`;

css += '\n' + extraCss;

fs.writeFileSync('marketplace.css', css, 'utf8');
if (fs.existsSync('public')) {
  fs.writeFileSync('public/marketplace.css', css, 'utf8');
}
console.log('Successfully wrote marketplace.css and public/marketplace.css');
