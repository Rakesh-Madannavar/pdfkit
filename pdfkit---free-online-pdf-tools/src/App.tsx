import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PrivacyModal } from './components/PrivacyModal';
import { TermsModal } from './components/TermsModal';
import { ContactModal } from './components/ContactModal';

// Pages
import { HomePage } from './pages/HomePage';
import { MergePdfPage } from './pages/MergePdfPage';
import { SplitPdfPage } from './pages/SplitPdfPage';
import { RotatePdfPage } from './pages/RotatePdfPage';
import { OrganizePdfPage } from './pages/OrganizePdfPage';
import { PdfToJpgPage } from './pages/PdfToJpgPage';
import { JpgToPdfPage } from './pages/JpgToPdfPage';
import { PageNumbersPage } from './pages/PageNumbersPage';
import { WatermarkPage } from './pages/WatermarkPage';
import { CompressPdfPage } from './pages/CompressPdfPage';
import { CropPdfPage } from './pages/CropPdfPage';
import { SignPdfPage } from './pages/SignPdfPage';
import { FlattenPdfPage } from './pages/FlattenPdfPage';
import { PdfToTextPage } from './pages/PdfToTextPage';
import { TextToPdfPage } from './pages/TextToPdfPage';
import { MetadataPage } from './pages/MetadataPage';
import { WordToolsPage } from './pages/WordToolsPage';
import { PptToolsPage } from './pages/PptToolsPage';
import { ExcelToolsPage } from './pages/ExcelToolsPage';
import { ImageToolsPage } from './pages/ImageToolsPage';
import { QrGeneratorPage } from './pages/QrGeneratorPage';
import { ZipToolPage } from './pages/ZipToolPage';
import { HubPage } from './pages/HubPage';

import { ToolId } from './types/pdf';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pdfkit_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Routing state
  const [currentTool, setCurrentTool] = useState<ToolId | 'home'>('home');

  // Modal dialog states
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // Sync dark class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pdfkit_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pdfkit_theme', 'light');
    }
  }, [isDark]);

  // Support URL hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const validTools: Array<ToolId> = [
        'merge',
        'split',
        'extract-pages',
        'remove-pages',
        'organize',
        'rotate',
        'crop',
        'compress',
        'repair',
        'flatten',
        'ocr',
        'jpg-to-pdf',
        'text-to-pdf',
        'html-to-pdf',
        'pdf-to-jpg',
        'pdf-to-text',
        'pdf-to-html',
        'page-numbers',
        'watermark',
        'sign',
        'redact',
        'metadata',
        'word-to-text',
        'word-counter',
        'ppt-extract-images',
        'ppt-extract-text',
        'excel-converter',
        'excel-remove-duplicates',
        'image-tools',
        'qr-generator',
        'zip-tool',
        'hub',
      ];
      if (validTools.includes(hash as ToolId)) {
        setCurrentTool(hash as ToolId);
      } else {
        setCurrentTool('home');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (destination: ToolId | 'home') => {
    setCurrentTool(destination);
    if (destination === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = `/${destination}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        currentTool={currentTool}
        onNavigate={navigateTo}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
      />

      <div className="flex-1">
        {currentTool === 'home' && (
          <HomePage
            onSelectTool={(tool) => navigateTo(tool)}
            onOpenPrivacy={() => setPrivacyOpen(true)}
          />
        )}

        {currentTool === 'hub' && (
          <HubPage
            onSelectTool={(tool) => navigateTo(tool)}
          />
        )}

        {/* ORGANIZE */}
        {currentTool === 'merge' && (
          <MergePdfPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {(currentTool === 'split' || currentTool === 'extract-pages') && (
          <SplitPdfPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {(currentTool === 'organize' || currentTool === 'remove-pages') && (
          <OrganizePdfPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {currentTool === 'rotate' && (
          <RotatePdfPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {currentTool === 'crop' && (
          <CropPdfPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {/* OPTIMIZE */}
        {(currentTool === 'compress' || currentTool === 'repair') && (
          <CompressPdfPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {currentTool === 'flatten' && (
          <FlattenPdfPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {currentTool === 'ocr' && (
          <PdfToTextPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {/* CONVERT TO PDF */}
        {currentTool === 'jpg-to-pdf' && (
          <JpgToPdfPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {(currentTool === 'text-to-pdf' || currentTool === 'html-to-pdf') && (
          <TextToPdfPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {/* CONVERT FROM PDF */}
        {currentTool === 'pdf-to-jpg' && (
          <PdfToJpgPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {(currentTool === 'pdf-to-text' || currentTool === 'pdf-to-html') && (
          <PdfToTextPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {/* EDIT & SECURITY */}
        {currentTool === 'page-numbers' && (
          <PageNumbersPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {(currentTool === 'watermark' || currentTool === 'redact') && (
          <WatermarkPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {currentTool === 'sign' && (
          <SignPdfPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {currentTool === 'metadata' && (
          <MetadataPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {/* OFFICE TOOLS */}
        {(currentTool === 'word-to-text' || currentTool === 'word-counter') && (
          <WordToolsPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {(currentTool === 'ppt-extract-images' || currentTool === 'ppt-extract-text') && (
          <PptToolsPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {(currentTool === 'excel-converter' || currentTool === 'excel-remove-duplicates') && (
          <ExcelToolsPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {/* UTILITIES & ADD-ONS */}
        {currentTool === 'image-tools' && (
          <ImageToolsPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {currentTool === 'qr-generator' && (
          <QrGeneratorPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}

        {currentTool === 'zip-tool' && (
          <ZipToolPage
            onBack={() => navigateTo('home')}
            onNavigateToTool={(t) => navigateTo(t)}
          />
        )}
      </div>

      <Footer
        onNavigate={navigateTo}
        onOpenPrivacy={() => setPrivacyOpen(true)}
        onOpenTerms={() => setTermsOpen(true)}
        onOpenContact={() => setContactOpen(true)}
      />

      {/* Information Modals */}
      <PrivacyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />

      <TermsModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
      />

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
