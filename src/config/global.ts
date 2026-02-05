import path from "path";

// Domain configuration
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'gaurav.one';
const isLocalDev = ROOT_DOMAIN.includes('localhost') || ROOT_DOMAIN.includes('127.0.0.1') || ROOT_DOMAIN.includes('lvh.me');
const PROTOCOL = isLocalDev ? 'http' : 'https';

// Helper function to build subdomain URLs
export const getSubdomainUrl = (subdomain: string): string => {
  return `${PROTOCOL}://${subdomain}.${ROOT_DOMAIN}`;
};

// Helper function to get the root domain URL
export const getRootUrl = (): string => {
  return `${PROTOCOL}://${ROOT_DOMAIN}`;
};

// Predefined subdomain URLs
export const domainUrls = {
  root: getRootUrl(),
  me: getSubdomainUrl('me'),
  blogs: getSubdomainUrl('blogs'),
  casestudy: getSubdomainUrl('casestudy'),
  whitelabel: getSubdomainUrl('whitelabel'),
  ngo: getSubdomainUrl('ngo'),
  opensource: getSubdomainUrl('opensource'),
  vision: getSubdomainUrl('vision'),
  careers: getSubdomainUrl('careers'),
};

// Email uses the domain without protocol
export const domainEmail = `hi@${ROOT_DOMAIN.replace(/:\d+$/, '')}`;

export const globalConfig = {
  displayName: "Gaurav.one",
  email: domainEmail,
  email2: "gaurav.ram@hotmail.com",
  github: "https://github.com/gv211432",
  linkedin: "https://linkedin.com/in/vishwakarmagaurav",
  twitter: "https://twitter.com/formal_gaurav",
  telegram: "https://t.me/gaaaalileo",
  leetcode: ""
};

export const OUTPUT_DIR = path.join(process.cwd(), 'public', 'img', 'websites');

export const SCREENSHOT_CONFIG = {
  width: 640,
  height: 400
};