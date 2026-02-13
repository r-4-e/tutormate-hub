import { useState, useEffect } from "react";

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem("trackly_theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("trackly_theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
