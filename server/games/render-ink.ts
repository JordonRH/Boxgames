import type { InkStroke } from "../../shared/arcade.js";
const colors = ["#182510", "#e16f56", "#7760ad", "#258c99", "#ffffff"];
export function renderInk(ink: InkStroke[]) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 255 255"><rect width="255" height="255" rx="8" fill="#f2f3e8"/>${ink.map((s) => (s.points.length === 1 ? `<circle cx="${s.points[0][0]}" cy="${s.points[0][1]}" r="2" fill="${colors[s.color]}"/>` : `<polyline points="${s.points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${colors[s.color]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`)).join("")}</svg>`;
}
