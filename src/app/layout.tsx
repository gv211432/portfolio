"use client";
import "./globals.css";
import { Inter } from "next/font/google";
import { useAtom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef, useEffect } from "react";
import { darkModeAtom } from "@/Atoms/globalAtoms";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gaurav Vishwakaram",
  description:
    "Portfolio of Gaurav Vishwakarma, Full Stack Developer from Mumbai",
  author: "Gaurav Vishwakarma",
  charset: "UTF-8",
  keywords:
    "Fullstack Developer, web3 developer, typescript, HTML, CSS, JavaScript",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);
  const readStoredModeRef = useRef(false);

  const loadMode = () => {
    const root = document.getElementById("root-node");
    if (darkMode) {
      root?.classList.add("dark");
      AsyncStorage.setItem("dark", "true");
    } else {
      root?.classList.remove("dark");
      AsyncStorage.setItem("dark", "false");
    }
  };

  useEffect(() => {
    console.log("Changed mode", JSON.stringify(darkMode));
    if (readStoredModeRef.current) {
      loadMode();
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      AsyncStorage.getItem("dark")?.then((d) => {
        readStoredModeRef.current = true;
        if ((d === "true") !== darkMode) {
          setDarkMode(false);
        }
        loadMode();
      });
    } catch (error) {
      console.log(error);
    }
  }, []);

  return (
    <html lang="en" id="root-node">
      <head>
        <meta name="title" content={metadata.title} />
        <meta name="author" content={metadata.author} />
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
