import React, { useEffect, useState } from 'react';

export default function DashboardTabs({ items, label = 'Dashboard sections' }) {
  const ids = items.map((item) => item.id);
  const idsKey = ids.join('|');
  const [activeId, setActiveId] = useState(ids[0] || '');

  useEffect(() => {
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!targets.length || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-130px 0px -62% 0px', threshold: [0.05, 0.2, 0.45] }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  // idsKey intentionally captures the section ids, not the caller's array identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return (
    <nav className="dashboard-tabs" aria-label={label}>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          aria-current={activeId === item.id ? 'location' : undefined}
          onClick={() => setActiveId(item.id)}
          className="dashboard-tab"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
