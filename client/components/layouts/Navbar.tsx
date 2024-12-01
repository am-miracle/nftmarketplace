"use client"
import React, { useState } from 'react';
import { Menu, X, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Storefront from "../../assets/Storefront.svg"
import Link from 'next/link';
import { Button } from '../ui/button';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navLinks = [
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/rankings', label: 'Rankings' },
    { href: '/wallet', label: 'Connect a wallet' }
  ];

  return (
    <nav className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-5 py-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={"/"} className='text-3xl font-bold flex items-center gap-2'>
              <Image
                  src={Storefront}
                  alt="Neflex logo"
                  width={100}
                  height={100}
                  className='h-[32px] w-[32px]'
                  style={{width: "auto", height: "auto"}}
              />
              <h1 className={`text-foreground font-mono`}>NEFLEX</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className=" hover:scale-95 text-base font-medium transition duration-300"
              >
                {link.label}
             </Link>
            ))}
            
            {/* Desktop Signup Button */}
            <Button className='lg:h-[60px] bg-accent text-white px-7 py-2 rounded-[20px] text-base font-medium hover:scale-95 transition duration-300'>
              <Link
                href="/signup"
                className="lg:h-[60px] flex items-center "
              >
                <UserPlus size={16} className="mr-2" />
                Sign Up
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMenu}
        />
      )}

      {/* Mobile Slide-in Menu */}
      <div 
        className={`
          fixed top-0 right-0 md:w-1/2 w-full h-full bg-secondary shadow-lg z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="flex justify-between items-center p-4 border-b border-primary-foreground">
            <Link href={"/"} className='text-2xl font-bold flex items-center gap-2'>
              <Image
                  src={Storefront}
                  alt="Neflex logo"
                  width={100}
                  height={100}
                  className='h-[32px] w-[32px]'
                  style={{width: "auto", height: "auto"}}
              />
              <h1 className={`text-foreground font-mono`}>NEFLEX</h1>
            </Link>
            <button 
              onClick={toggleMenu}
              className="text-primary-foreground hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-grow p-4">
            {navLinks.map((link) => {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center py-3 hover:scale-95 transition duration-300 group"
                  onClick={toggleMenu}
                >
                  <span className="text-primary-foreground group-hover:scale-95 font-semibold">
                    {link.label}
                  </span>
                </Link>
              );
            })}

            {/* Mobile Signup Button */}
            <Button className='mt-8 h-[60px] bg-accent w-full text-white px-7 py-2 rounded-[20px] text-base font-medium hover:scale-95 transition duration-300 group'>
              <Link
                href="/signup"
                className="flex items-center group"
                onClick={toggleMenu}
              >
                <UserPlus 
                  size={20} 
                  className="mr-3"
                />
                <span>
                  Sign Up
                </span>
              </Link>
            </Button>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;