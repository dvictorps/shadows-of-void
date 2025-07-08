import { useEffect } from "react";

export default function useDisableContextMenu() {
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);

    // Preserve previous styles to restore later
    const prevUserSelect = document.body.style.userSelect;
    type StyleWithWebkit = CSSStyleDeclaration & { webkitUserSelect?: string };
    const style = document.body.style as StyleWithWebkit;
    const prevWebkitUserSelect = style.webkitUserSelect;

    document.body.style.userSelect = "none";
    style.webkitUserSelect = "none";

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.body.style.userSelect = prevUserSelect;
      (document.body.style as StyleWithWebkit).webkitUserSelect = prevWebkitUserSelect;
    };
  }, []);
} 