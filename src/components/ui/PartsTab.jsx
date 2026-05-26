/**
 * PartsTab – browse and search all vehicle components.
 * Components can be filtered by subsystem and searched by name or tag.
 * Clicking a part selects it in the 3D scene and loads its detail panel.
 */
import { useState, useMemo } from 'react';
import useAppStore from '../../store/appStore';
import { COMPONENT_LIST } from '../../data/components';
import { SUBSYSTEM_LIST } from '../../data/subsystems';

const FILTER_ALL = 'all';

export default function PartsTab() {
  const { selectedComponent, setSelectedComponent, selectSubsystem } = useAppStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(FILTER_ALL);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return COMPONENT_LIST.filter((comp) => {
      const matchesSearch =
        q === '' ||
        comp.label.toLowerCase().includes(q) ||
        comp.tags.some((t) => t.toLowerCase().includes(q)) ||
        comp.subsystemId.toLowerCase().includes(q);
      const matchesFilter = filter === FILTER_ALL || comp.subsystemId === filter;
      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const handleSelect = (comp) => {
    setSelectedComponent(comp.id);
    selectSubsystem(comp.subsystemId);
  };

  return (
    <div className="tab-content parts-tab">
      <h2 className="section-title">Component Browser</h2>
      <p className="section-hint">
        {COMPONENT_LIST.length} parts across 6 systems — click any part to inspect it.
      </p>

      <input
        className="parts-search"
        type="search"
        placeholder="Search parts or tags…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search components"
      />

      <div className="filter-chips" role="group" aria-label="Filter by subsystem">
        <button
          className={`filter-chip ${filter === FILTER_ALL ? 'active' : ''}`}
          onClick={() => setFilter(FILTER_ALL)}
        >
          All
        </button>
        {SUBSYSTEM_LIST.map((sys) => (
          <button
            key={sys.id}
            className={`filter-chip ${filter === sys.id ? 'active' : ''}`}
            style={{ '--chip-color': sys.color }}
            onClick={() => setFilter(sys.id)}
          >
            {sys.label}
          </button>
        ))}
      </div>

      <div className="parts-list" role="list">
        {filtered.length === 0 && (
          <p className="parts-empty">No parts match your search.</p>
        )}
        {filtered.map((comp) => {
          // Find the system color from SUBSYSTEM_LIST instead of importing the map
          const sys = SUBSYSTEM_LIST.find((s) => s.id === comp.subsystemId);
          const isSelected = selectedComponent === comp.id;
          return (
            <button
              key={comp.id}
              role="listitem"
              className={`part-item ${isSelected ? 'active' : ''}`}
              style={{ '--part-color': sys?.color ?? '#636e72' }}
              onClick={() => handleSelect(comp)}
              aria-pressed={isSelected}
            >
              <span className="part-color-dot" />
              <span className="part-item-label">{comp.label}</span>
              <span className="part-item-sys">{sys?.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
