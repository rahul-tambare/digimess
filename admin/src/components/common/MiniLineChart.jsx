import { useEffect, useRef } from 'react';

export default function MiniLineChart({ data, color = '#6366f1', height = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.length) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 20, right: 20, bottom: 30, left: 45 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    const maxVal = Math.max(...data.map(d => d.value)) * 1.15;
    const minVal = 0;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    const gridLines = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#5a6478';
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + (chartH / gridLines) * i;
      const val = Math.round(maxVal - (maxVal / gridLines) * i);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      ctx.fillText(val, pad.left - 8, y + 4);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      const x = pad.left + (chartW / (data.length - 1)) * i;
      ctx.fillText(d.label, x, h - 8);
    });

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, color + '30');
    grad.addColorStop(1, 'transparent');

    const getX = i => pad.left + (chartW / (data.length - 1)) * i;
    const getY = d => pad.top + chartH - ((d.value - minVal) / (maxVal - minVal)) * chartH;

    ctx.beginPath();
    ctx.moveTo(getX(0), pad.top + chartH);
    data.forEach((d, i) => {
      if (i === 0) ctx.lineTo(getX(0), getY(d));
      else {
        const prevX = getX(i - 1), prevY = getY(data[i - 1]);
        const curX = getX(i), curY = getY(d);
        const cpX = (prevX + curX) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, curY, curX, curY);
      }
    });
    ctx.lineTo(getX(data.length - 1), pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((d, i) => {
      if (i === 0) ctx.moveTo(getX(0), getY(d));
      else {
        const prevX = getX(i - 1), prevY = getY(data[i - 1]);
        const curX = getX(i), curY = getY(d);
        const cpX = (prevX + curX) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, curY, curX, curY);
      }
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots
    data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#141b2d';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [data, color, height]);

  return (
    <div className="chart-container">
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
}
