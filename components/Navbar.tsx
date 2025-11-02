'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { MouseEvent, KeyboardEvent, TouchEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 定义菜单项类型
interface MenuItem {
  id: string;
  label: string;
  href: string;
  children?: MenuItem[];
}

// 自定义Hook：管理菜单状态
const useMenuState = () => {
  // 从localStorage加载初始状态
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 保存状态到localStorage
  useEffect(() => {
    localStorage.setItem('isMobileMenuOpen', JSON.stringify(isMobileMenuOpen));
  }, [isMobileMenuOpen]);
  
  // 加载状态从localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('isMobileMenuOpen');
    if (savedState) {
      setIsMobileMenuOpen(JSON.parse(savedState));
    }
  }, []);
  
  // 防抖函数，防止菜单快速切换
  const debounce = useCallback((func: () => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(func, delay);
    };
  }, []);
  
  // 切换移动端菜单
  const toggleMobileMenu = useCallback(debounce(() => {
    setIsAnimating(true);
    setIsMobileMenuOpen((prev: boolean) => !prev);
  }, 150), [debounce]);
  
  // 关闭移动端菜单
  const closeMobileMenu = useCallback(() => {
    setIsAnimating(true);
    setIsMobileMenuOpen(false);
  }, []);
  
  // 切换下拉菜单
  const toggleDropdown = useCallback((id: string) => {
    setActiveDropdown((prev: string | null) => prev === id ? null : id);
  }, []);
  
  // 关闭所有下拉菜单
  const closeAllDropdowns = useCallback(() => {
    setActiveDropdown(null);
  }, []);
  
  // 监听过渡结束
  const handleTransitionEnd = useCallback(() => {
    setIsAnimating(false);
  }, []);
  
  return {
    isMobileMenuOpen,
    activeDropdown,
    isAnimating,
    toggleMobileMenu,
    closeMobileMenu,
    toggleDropdown,
    closeAllDropdowns,
    handleTransitionEnd
  };
};

// 导航栏组件
const Navbar: React.FC = () => {
  // 菜单项数据
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: '首页',
      href: '/'
    },
    {
      id: 'products',
      label: '产品',
      href: '/products',
      children: [
        {
          id: 'productA',
          label: '产品A',
          href: '/products/a'
        },
        {
          id: 'productB',
          label: '产品B',
          href: '/products/b'
        }
      ]
    },
    {
      id: 'services',
      label: '服务',
      href: '/services'
    },
    {
      id: 'about',
      label: '关于我们',
      href: '/about'
    },
    {
      id: 'contact',
      label: '联系我们',
      href: '/contact'
    }
  ];
  
  // 使用自定义Hook管理菜单状态
  const { 
    isMobileMenuOpen, 
    activeDropdown, 
    isAnimating, 
    toggleMobileMenu, 
    closeMobileMenu, 
    toggleDropdown, 
    closeAllDropdowns, 
    handleTransitionEnd 
  } = useMenuState();
  
  // 获取当前路径
  const pathname = usePathname();
  
  // 点击外部关闭菜单的Ref
  const navbarRef = useRef<HTMLDivElement>(null);
  
  // 监听窗口大小变化，在桌面端关闭移动端菜单
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        closeMobileMenu();
        closeAllDropdowns();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeMobileMenu, closeAllDropdowns]);
  
  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        closeAllDropdowns();
        if (window.innerWidth <= 768) {
          closeMobileMenu();
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [closeAllDropdowns, closeMobileMenu]);
  
  // 键盘导航处理
  useEffect(() => {
    const handleKeyDown = (event: Event) => {
      // 确保是KeyboardEvent
      if (!(event instanceof KeyboardEvent)) return;
      
      // 关闭移动端菜单
      if (event.key === 'Escape') {
        closeAllDropdowns();
        if (isMobileMenuOpen) {
          closeMobileMenu();
        }
      }
      
      // 处理Tab键导航
      if (event.key === 'Tab') {
        // 如果在移动端菜单中，并且没有更多焦点元素，关闭菜单
        if (isMobileMenuOpen && document.activeElement === document.querySelector('.mobile-menu a:last-child')) {
          closeMobileMenu();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, closeMobileMenu, closeAllDropdowns]);
  
  // 检查菜单项是否激活
  const isMenuItemActive = useCallback((item: MenuItem) => {
    if (pathname === item.href) {
      return true;
    }
    
    // 检查子菜单项是否激活
    if (item.children) {
      return item.children.some(child => pathname === child.href);
    }
    
    return false;
  }, [pathname]);
  
  // 处理菜单项点击
  const handleMenuItemClick = useCallback(() => {
    closeAllDropdowns();
    if (window.innerWidth <= 768) {
      closeMobileMenu();
    }
  }, [closeAllDropdowns, closeMobileMenu]);
  
  // 处理下拉菜单键盘导航
  const handleDropdownKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>, id: string) => {
    const dropdown = document.getElementById(`dropdown-${id}`);
    if (!dropdown) return;
    
    const focusableElements = dropdown.querySelectorAll('a');
    const currentElement = document.activeElement;
    let currentIndex = -1;
    
    if (currentElement && currentElement.tagName === 'A') {
      currentIndex = Array.from(focusableElements).indexOf(currentElement as HTMLAnchorElement);
    }
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex === -1 || currentIndex === focusableElements.length - 1) {
          focusableElements[0]?.focus();
        } else {
          const nextIndex = currentIndex + 1;
          focusableElements[nextIndex]?.focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex === -1 || currentIndex === 0) {
          focusableElements[focusableElements.length - 1]?.focus();
        } else {
          const prevIndex = currentIndex - 1;
          focusableElements[prevIndex]?.focus();
        }
        break;
      case 'Escape':
        event.preventDefault();
        closeAllDropdowns();
        break;
      case 'Tab':
        // 如果在最后一个元素，关闭下拉菜单
        if (currentIndex === focusableElements.length - 1) {
          closeAllDropdowns();
        }
        break;
    }
  }, [closeAllDropdowns]);
  
  return (
    <nav ref={navbarRef} className="navbar bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          {/* 品牌标志 */}
          <Link href="/" className="text-xl font-bold text-blue-600">
            TypingGame
          </Link>
          
          {/* 桌面端菜单 */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  className={`flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-md px-2 py-1 ${isMenuItemActive(item) ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'}`}
                  onClick={() => {
                    if (item.children) {
                      toggleDropdown(item.id);
                    }
                  }}
                  onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                    if (e.key === 'Enter' || e.key === 'Space') {
                      e.preventDefault();
                      if (item.children) {
                        toggleDropdown(item.id);
                      } else {
                        handleMenuItemClick();
                      }
                    }
                  }}
                  aria-expanded={activeDropdown === item.id}
                  aria-haspopup={!!item.children}
                >
                  <span className="truncate max-w-xs">{item.label}</span>
                  {item.children && (
                    <svg
                      className="w-4 h-4 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ transform: activeDropdown === item.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </button>
                
                {/* 下拉菜单 */}
                {item.children && activeDropdown === item.id && (
                  <div
                    id={`dropdown-${item.id}`}
                    className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-10 transition-all duration-200 transform origin-top"
                    onKeyDown={(e) => handleDropdownKeyDown(e, item.id)}
                    tabIndex={-1}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 focus:outline-none focus:bg-blue-200 ${isMenuItemActive(child) ? 'bg-blue-50 font-medium' : ''}`}
                        onClick={handleMenuItemClick}
                        onKeyDown={(e: KeyboardEvent<HTMLAnchorElement>) => {
                          if (e.key === 'Enter' || e.key === 'Space') {
                            handleMenuItemClick();
                          }
                        }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* 移动端汉堡菜单按钮 */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-md p-2"
              onClick={toggleMobileMenu}
              onTouchStart={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
            >
              {/* 汉堡菜单图标 */}
              <svg
                className={`w-6 h-6 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* 移动端菜单 */}
      {isMobileMenuOpen && (
        <div
          className={`md:hidden bg-white shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${isAnimating ? '' : 'max-h-[500px]'}`}
          style={{ 
            maxHeight: isAnimating ? (isMobileMenuOpen ? '0' : '500px') : (isMobileMenuOpen ? '500px' : '0')
          }}
          onTransitionEnd={handleTransitionEnd}
          >
          <div className="container mx-auto px-4 py-2 space-y-2 mobile-menu">
            {menuItems.map((item) => (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  className={`flex justify-between items-center w-full px-4 py-3 rounded-md ${isMenuItemActive(item) ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => {
                    if (item.children) {
                      toggleDropdown(item.id);
                    }
                  }}
                  onTouchStart={() => {
                    if (item.children) {
                      toggleDropdown(item.id);
                    }
                  }}
                  onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                    if (e.key === 'Enter' || e.key === 'Space') {
                      e.preventDefault();
                      if (item.children) {
                        toggleDropdown(item.id);
                      } else {
                        handleMenuItemClick();
                      }
                    }
                  }}
                  aria-expanded={activeDropdown === item.id}
                  aria-haspopup={!!item.children}
                >
                  <span>{item.label}</span>
                  {item.children && (
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === item.id ? 'rotate-180' : 'rotate-0'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </button>
                
                {/* 移动端下拉菜单 */}
                {item.children && activeDropdown === item.id && (
                  <div
                    id={`dropdown-${item.id}`}
                    className="ml-4 mt-2 space-y-1 transition-all duration-200"
                    onKeyDown={(e) => handleDropdownKeyDown(e, item.id)}
                    tabIndex={-1}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={`block px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-blue-100 focus:outline-none focus:bg-blue-200 ${isMenuItemActive(child) ? 'bg-blue-50 font-medium' : ''}`}
                        onClick={handleMenuItemClick}
                        onTouchStart={handleMenuItemClick}
                        onKeyDown={(e: KeyboardEvent<HTMLAnchorElement>) => {
                          if (e.key === 'Enter' || e.key === 'Space') {
                            handleMenuItemClick();
                          }
                        }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;