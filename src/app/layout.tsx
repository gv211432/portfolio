"use client";
import "./globals.css";
import { Inter } from "next/font/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef, useEffect } from "react";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import "@/index.css";

const inter = Inter({ subsets: ["latin"] });

const metadata = {
  title: "Gaurav Vishwakaram",
  description:
    "Gaurav Vishwakarma, a Full Stack Developer from Mumbai works on ReactJS, NodeJS and Blockchain Technologies.",
  author: "Gaurav Vishwakarma",
  charset: "UTF-8",
  keywords:
    `Fullstack Developer, web3 developer, typescript, HTML, CSS, JavaScript, solidity,
    React, Next.js, Node.js, Express.js, MongoDB, PostgreSQL, MySQL,
    Ethereum, Web3, Solidity, Smart Contracts, Blockchain, Python, FastAPI, Django,
    Eth-Brownie, Hardhat, Truffle, Ganache, Mocha, Chai, Jest, React Native, Expo,
    TailwindCSS, MaterialUI, Styled-Components, Git, Github, Gitlab, Bitbucket,
    AWS, Heroku, Vercel, Netlify, Firebase, Google Cloud, Digital Ocean,
    Docker, Kubernetes, Linux, Ubuntu, Debian, Windows, MacOS, Raspberry Pi, Arduino,
    C, C++, Rust, D3.js, Webpack, Babel, Gatsby, GraphQL, Apollo, Prisma,
    Socket.io, WebSockets, REST API, OAuth, JWT, OAuth2, SAML, OpenID Connect, Gemini,
    OpenAI, ChatGPT, AI, Machine Learning, Deep Learning
    `
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { darkMode, setDarkMode } = useDarkModeStore();
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
    // console.log("Changed mode", JSON.stringify(darkMode));
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
    <html lang="en" id="root-node" className=" lg:overflow-hidden">
      <head>
        <meta name="title" content={metadata.title} />
        <meta name="author" content={metadata.author} />
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
      </head>
      <body className={inter.className}>
        <div className="relative bg-white">
          <div className="star-bg z-0">
            <div id='stars'></div>
            <div id='stars3'></div>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
