/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Share, PlusSquare, ExternalLink, MoreVertical } from 'lucide-react';
import { useI18n } from '../../i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type PromptType = 'none' | 'native' | 'ios-safari' | 'ios-other' | 'wechat' | 'android-fallback';

// Detect platform
const detectPlatform = (): { promptType: PromptType; isStandalone: boolean } => {
  const ua = navigator.userAgent;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;

  if (isStandalone) return { promptType: 'none', isStandalone: true };

  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // WeChat / QQ / WeCom / DingTalk / Weibo in-app browsers
  const isInApp = /MicroMessenger|QQ\/|wxwork|DingTalk|Weibo/i.test(ua);
  if (isInApp) return { promptType: 'wechat', isStandalone: false };

  if (isIOS) {
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    if (isSafari) return { promptType: 'ios-safari', isStandalone: false };
    // iOS Chrome / Firefox / Edge etc — can't install PWA, guide to open in Safari
    return { promptType: 'ios-other', isStandalone: false };
  }

  // Android & desktop — will try native beforeinstallprompt first
  // If it doesn't fire, we show a fallback guide for Android
  return { promptType: 'native', isStandalone: false };
};

const DISMISS_KEY = 'pwa-install-dismissed';

// Shared wrapper component
const PromptWrapper: React.FC<{ children: React.ReactNode; bottom?: boolean }> = ({ children, bottom = true }) => (
  <div className={`fixed ${bottom ? 'bottom-6' : 'top-6'} left-1/2 -translate-x-1/2 z-[200] pointer-events-auto w-[90vw] max-w-sm`}>
    {children}
  </div>
);

const CardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-gray-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.15)] px-5 py-4">
    {children}
  </div>
);

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [promptType, setPromptType] = useState<PromptType>('none');
  const { language } = useI18n();
  const isZh = language === 'zh';

  useEffect(() => {
    const { promptType: detected, isStandalone } = detectPlatform();

    if (isStandalone) return;

    // Check 24h dismiss cooldown
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 24 * 60 * 60 * 1000) return;

    if (detected === 'wechat' || detected === 'ios-safari' || detected === 'ios-other') {
      setPromptType(detected);
      setTimeout(() => setVisible(true), 2500);
      return;
    }

    // Native (Android Chrome, desktop Chrome/Edge, Samsung Browser, etc.)
    let nativeFired = false;

    const handler = (e: Event) => {
      e.preventDefault();
      nativeFired = true;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPromptType('native');
      setTimeout(() => setVisible(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setVisible(false);
      setDeferredPrompt(null);
      setPromptType('none');
    });

    // If beforeinstallprompt doesn't fire within 3s on Android, show fallback
    const isAndroid = /Android/i.test(navigator.userAgent);
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    if (isAndroid) {
      fallbackTimer = setTimeout(() => {
        if (!nativeFired) {
          setPromptType('android-fallback');
          setVisible(true);
        }
      }, 3500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setPromptType('none');
    }
    setVisible(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  if (!visible || promptType === 'none') return null;

  // Header with title and close button
  const Header = () => (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
        <Download className="w-5 h-5 text-cyan-400 shrink-0" />
        <p className="text-white font-bold text-sm">
          {isZh ? '安装 Gemini Runner' : 'Install Gemini Runner'}
        </p>
      </div>
      <button onClick={handleDismiss} className="p-1 text-gray-500 hover:text-white transition-colors" aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const StepRow: React.FC<{ num: string; children: React.ReactNode }> = ({ num, children }) => (
    <div className="flex items-center gap-3 bg-gray-800/60 rounded-lg px-3 py-2.5">
      <span className="text-lg shrink-0">{num}</span>
      <div className="flex items-center gap-1.5 flex-wrap text-gray-300 text-xs">{children}</div>
    </div>
  );

  // ========== WeChat / QQ / in-app browser ==========
  if (promptType === 'wechat') {
    return (
      <PromptWrapper bottom={false}>
        <CardShell>
          <Header />
          <p className="text-gray-400 text-xs mb-3">
            {isZh
              ? '当前浏览器不支持安装，请用系统浏览器打开：'
              : 'This in-app browser cannot install apps. Open in system browser:'}
          </p>
          <div className="space-y-2.5">
            <StepRow num="①">
              {isZh ? '点击右上角' : 'Tap'}
              <MoreVertical className="w-4 h-4 text-cyan-400" />
              {isZh ? '菜单' : 'menu at top-right'}
            </StepRow>
            <StepRow num="②">
              {isZh ? '选择' : 'Select'}
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              {isZh ? '"在浏览器中打开"' : '"Open in Browser"'}
            </StepRow>
          </div>
        </CardShell>
        {/* Arrow pointing up to top-right corner */}
        <div className="flex justify-end mr-8 -mt-0.5 rotate-180">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-gray-900/90"></div>
        </div>
      </PromptWrapper>
    );
  }

  // ========== iOS Safari ==========
  if (promptType === 'ios-safari') {
    return (
      <PromptWrapper>
        <CardShell>
          <Header />
          <div className="space-y-2.5">
            <StepRow num="①">
              {isZh ? '点击底部' : 'Tap the'}
              <Share className="w-4 h-4 text-cyan-400" />
              {isZh ? '分享按钮' : 'Share button below'}
            </StepRow>
            <StepRow num="②">
              {isZh ? '向下滑动，选择' : 'Scroll down, select'}
              <PlusSquare className="w-4 h-4 text-cyan-400" />
              {isZh ? '"添加到主屏幕"' : '"Add to Home Screen"'}
            </StepRow>
          </div>
        </CardShell>
        <div className="flex justify-center mt-2">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-gray-900/90"></div>
        </div>
      </PromptWrapper>
    );
  }

  // ========== iOS non-Safari (Chrome/Firefox/Edge on iOS) ==========
  if (promptType === 'ios-other') {
    return (
      <PromptWrapper>
        <CardShell>
          <Header />
          <p className="text-gray-400 text-xs mb-3">
            {isZh
              ? 'iOS 上只有 Safari 支持安装 PWA 应用，请：'
              : 'Only Safari supports PWA install on iOS:'}
          </p>
          <div className="space-y-2.5">
            <StepRow num="①">
              {isZh ? '复制当前网址' : 'Copy the current URL'}
            </StepRow>
            <StepRow num="②">
              {isZh ? '用 Safari 浏览器打开' : 'Open it in Safari'}
            </StepRow>
            <StepRow num="③">
              {isZh ? '点击' : 'Tap'}
              <Share className="w-4 h-4 text-cyan-400" />
              {isZh ? '→ "添加到主屏幕"' : '→ "Add to Home Screen"'}
            </StepRow>
          </div>
        </CardShell>
      </PromptWrapper>
    );
  }

  // ========== Android fallback (browser doesn't support beforeinstallprompt) ==========
  if (promptType === 'android-fallback') {
    return (
      <PromptWrapper>
        <CardShell>
          <Header />
          <div className="space-y-2.5">
            <StepRow num="①">
              {isZh ? '点击浏览器右上角' : 'Tap browser'}
              <MoreVertical className="w-4 h-4 text-cyan-400" />
              {isZh ? '菜单' : 'menu'}
            </StepRow>
            <StepRow num="②">
              {isZh ? '选择 "添加到主屏幕" 或 "安装应用"' : 'Select "Add to Home Screen" or "Install App"'}
            </StepRow>
          </div>
        </CardShell>
      </PromptWrapper>
    );
  }

  // ========== Native install (Android Chrome, desktop Chrome/Edge, Samsung) ==========
  return (
    <PromptWrapper>
      <CardShell>
        <div className="flex items-center gap-4">
          <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20 shrink-0">
            <Download className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">
              {isZh ? '安装 Gemini Runner' : 'Install Gemini Runner'}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              {isZh ? '添加到主屏幕，获得更好体验' : 'Add to home screen for the best experience'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold rounded-lg hover:brightness-110 transition-all"
            >
              {isZh ? '安装' : 'Install'}
            </button>
            <button onClick={handleDismiss} className="p-1.5 text-gray-500 hover:text-white transition-colors" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardShell>
    </PromptWrapper>
  );
};
