import React, { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

const COLORS = ['#38bdf8', '#60a5fa', '#f59e0b', '#fb923c', '#a78bfa'];

function isLiteDevice() {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768)
  );
}

function makeParticles(count) {
  let seed = 29;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  return Array.from({ length: count }, (_, index) => {
    const angle = random() * Math.PI * 2;
    const radius = 20 + Math.sqrt(random()) * 48;
    const size = random() > 0.9 ? 2.8 + random() * 1.6 : 0.9 + random() * 1.3;
    return {
      id: index,
      left: 50 + Math.cos(angle) * radius,
      top: 50 + Math.sin(angle) * radius * 0.64,
      size,
      color: COLORS[Math.floor(random() * COLORS.length)],
      delay: random() * 6,
      duration: 4 + random() * 7,
      glow: size > 2.6,
    };
  });
}

export default function DashboardBackground() {
  const stageRef = useRef(null);
  const lite = useMemo(isLiteDevice, []);
  const reduced = useReducedMotion();
  const particles = useMemo(() => makeParticles(lite ? 38 : 78), [lite]);

  useEffect(() => {
    if (reduced) return undefined;
    const stage = stageRef.current;
    if (!stage) return undefined;

    const current = { x: 0, y: 0, rx: 0, ry: 0, rz: 0 };
    const target = { x: 0, y: 0, rx: 0, ry: 0, rz: 0 };
    let frame = 0;

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(tick);
    };

    const tick = () => {
      frame = 0;
      current.x += (target.x - current.x) * 0.075;
      current.y += (target.y - current.y) * 0.075;
      current.rx += (target.rx - current.rx) * 0.075;
      current.ry += (target.ry - current.ry) * 0.075;
      current.rz += (target.rz - current.rz) * 0.075;
      stage.style.transform =
        `perspective(1300px) translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0) ` +
        `rotateX(${current.rx.toFixed(3)}deg) rotateY(${current.ry.toFixed(3)}deg) rotateZ(${current.rz.toFixed(3)}deg)`;

      const settled =
        Math.abs(target.x - current.x) < 0.04 &&
        Math.abs(target.y - current.y) < 0.04 &&
        Math.abs(target.rx - current.rx) < 0.02 &&
        Math.abs(target.ry - current.ry) < 0.02 &&
        Math.abs(target.rz - current.rz) < 0.02;
      if (!settled) schedule();
    };

    const updateScroll = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1) - 0.5;
      target.y = progress * 9;
      target.rz = progress * 5;
      schedule();
    };

    const updatePointer = (event) => {
      if (lite || event.pointerType === 'touch') return;
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      target.x = x * 10;
      target.y = y * 7;
      target.rx = -y * 2.4;
      target.ry = x * 3.4;
      schedule();
    };

    const resetPointer = () => {
      target.x = 0;
      target.rx = 0;
      target.ry = 0;
      updateScroll();
    };

    window.addEventListener('pointermove', updatePointer, { passive: true });
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    document.documentElement.addEventListener('mouseleave', resetPointer);
    updateScroll();

    return () => {
      window.removeEventListener('pointermove', updatePointer);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      document.documentElement.removeEventListener('mouseleave', resetPointer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [lite, reduced]);

  return (
    <div
      className={`dashboard3d${lite ? ' dashboard3d--lite' : ''}${reduced ? ' dashboard3d--reduced' : ''}`}
      aria-hidden="true"
    >
      <div ref={stageRef} className="dashboard3d__scene">
        <div className="dashboard3d__cloud dashboard3d__cloud--blue" />
        <div className="dashboard3d__cloud dashboard3d__cloud--orange" />
        <div className="dashboard3d__core">
          <div className="dashboard3d__core-light" />
          <div className="dashboard3d__core-edge" />
        </div>
        <div className="dashboard3d__orbit dashboard3d__orbit--outer" />
        <div className="dashboard3d__orbit dashboard3d__orbit--inner" />
        <div className="dashboard3d__particle-field">
          {particles.map((particle) => (
            <span
              key={particle.id}
              className="dashboard3d__particle"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                boxShadow: particle.glow ? `0 0 ${particle.size * 4}px ${particle.color}` : undefined,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="dashboard3d__veil" />
    </div>
  );
}
