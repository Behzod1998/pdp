import { chromium } from 'playwright';
import { spawn } from 'child_process';
const [,, html, out, mode, ...times] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto('file://' + html); await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
if (mode === 'stills') {
  for (const t of times) { await p.evaluate(t => render(+t), t); await p.screenshot({ path: `${out}/still_${t}.jpg`, type: 'jpeg', quality: 80 }); }
} else {
  const FPS = 30, DUR = await p.evaluate(() => DUR);
  const ff = spawn('ffmpeg', ['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',out], { stdio: ['pipe','inherit','inherit'] });
  for (let f = 0; f < FPS*DUR; f++) {
    await p.evaluate(t => render(t), f / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log('frame', f);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await b.close();
