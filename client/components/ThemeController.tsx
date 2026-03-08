"use client";

import { useEffect } from "react";

export default function ThemeController() {
    useEffect(() => {
        // Check localStorage first
        const savedTheme = localStorage.getItem("darkMode");
        const isDark = savedTheme === "true";

        if (isDark) {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
        } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
        }
    }, []);

    return null;
}
