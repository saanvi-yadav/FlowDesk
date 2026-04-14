import { useEffect } from "react";

export default function CursorSparkle() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    canvas.style.position = "fixed";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = 9999;

    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    window.addEventListener("mousemove", (e) => {
      for (let i = 0; i < 4; i++) {
        particles.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 4 + 1,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          life: 100
        });
      }
    });

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,180,255,${p.life / 100})`;
        ctx.fill();

        if (p.life <= 0) particles.splice(i, 1);
      });

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      document.body.removeChild(canvas);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return null;
}
