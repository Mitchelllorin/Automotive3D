/**
 * SidebarResizeHandle – a thin draggable seam between the 3D scene and the
 * sidebar. Dragging left widens the panel; dragging right shrinks it (and hands
 * more of the viewport to the scene). The width is clamped + persisted by the
 * store. Double-click resets to the default width.
 */
import { useCallback } from 'react';
import useAppStore from '../../store/appStore';

export default function SidebarResizeHandle() {
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);

  const onPointerDown = useCallback(
    (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = useAppStore.getState().sidebarWidth;
      // Suspend the width transition on the parent .app-body so the panel
      // tracks the pointer 1:1 instead of easing a frame behind.
      const appBody = e.currentTarget.parentElement;
      appBody?.classList.add('sidebar-resizing');

      const onMove = (ev) => {
        // Sidebar is docked right, so moving the pointer left grows it.
        setSidebarWidth(startWidth + (startX - ev.clientX));
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        appBody?.classList.remove('sidebar-resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [setSidebarWidth]
  );

  return (
    <div
      className="sidebar-resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel"
      title="Drag to resize · double-click to reset"
      onPointerDown={onPointerDown}
      onDoubleClick={() => setSidebarWidth(320)}
    />
  );
}
