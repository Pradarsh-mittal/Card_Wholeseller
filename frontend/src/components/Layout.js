import React from 'react';
import { Sidebar } from './Sidebar';

export const Layout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="main-content">
        <div className="px-4 md:px-8 py-6 md:py-8">
          {(title || subtitle) && (
            <div className="mb-8">
              {title && (
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-slate-600">{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
