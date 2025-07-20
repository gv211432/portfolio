"use client";
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin, faTelegram, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faHeart, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { globalConfig } from '@/config/global';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'GitHub',
      icon: faGithub,
      url: globalConfig.github,
      color: ' hover:scale-110'
    },
    {
      name: 'LinkedIn',
      icon: faLinkedin,
      url: globalConfig.linkedin,
      color: ' hover:scale-110'
    },
    {
      name: 'Twitter',
      icon: faTwitter,
      url: globalConfig.twitter,
      color: ' hover:scale-110'
    },
    {
      name: 'Telegram',
      icon: faTelegram,
      url: globalConfig.telegram,
      color: ' hover:scale-110'
    },
    {
      name: 'Email',
      icon: faEnvelope,
      url: `mailto:${globalConfig.email}`,
      color: ' hover:scale-110'
    }
  ];

  const quickLinks = [
    { name: 'About', href: '#about' },
    { name: 'Projects', href: '#projects' },
    { name: 'Skills', href: '#skills' },
    { name: 'Contact', href: '#contact' }
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Check if we're on mobile (window scroll) or desktop (container scroll)
      const isMobile = window.innerWidth < 1024;
      const rightSection = document.querySelector('[data-scroll-container]');
      
      if (isMobile || !rightSection) {
        // Mobile: use window scroll
        targetElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        // Desktop: use container scroll
        const container = rightSection as HTMLElement;
        const targetTop = targetElement.offsetTop;
        
        container.scrollTo({
          top: targetTop - 20, // Small offset for better positioning
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Gaurav Vishwakarma
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
              Full Stack Developer specializing in React, Node.js, and Blockchain technologies.
              Passionate about building scalable web applications and decentralized solutions.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-500 dark:text-gray-400 ${link.color} transition-colors duration-200`}
                  aria-label={link.name}
                >
                  <FontAwesomeIcon icon={link.icon} className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors duration-200 cursor-pointer"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Get In Touch
            </h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>
                <a
                  href={`mailto:${globalConfig.email}`}
                  className="hover:text-primary dark:hover:text-primary transition-colors duration-200"
                >
                  {globalConfig.email}
                </a>
              </li>
              <li>Mumbai, India</li>
              <li className="text-sm">
                Available for freelance & full-time opportunities
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {currentYear} Gaurav Vishwakarma. All rights reserved.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 md:mt-0">
              Made with <FontAwesomeIcon icon={faHeart} className="text-red-500 mx-1" />
              and lots of <span className="text-green-500 font-mono">{'<code/>'}</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
