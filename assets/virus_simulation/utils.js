function gaussianRand() {
  let rand = 0;
  let cnt = 6;

  for (let i = 0; i < cnt; i += 1) {
      rand += Math.random();
  }

  return (rand / cnt) - 0.5;
}

function randomCircle(rad) {
  pt_angle = Math.random() * 2 * Math.PI;
  pt_radius_sq = Math.sqrt(Math.abs(gaussianRand()) * rad * rad);
  pt_x = pt_radius_sq * Math.cos(pt_angle);
  pt_y = pt_radius_sq * Math.sin(pt_angle);
  return [pt_x, pt_y];
}