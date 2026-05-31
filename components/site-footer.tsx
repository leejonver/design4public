"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { ContactFormModal } from "./contact-form-modal";

const footerLinks = {
  explore: {
    title: "탐색하기",
    links: [
      { href: "/projects", label: "프로젝트" },
      { href: "/items", label: "아이템" },
      { href: "/brands", label: "브랜드" },
    ],
  },
};

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-neutral-200 bg-white">
        {/* Main Footer Content */}
        <div className="mx-auto w-full max-w-[1920px] px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand & Description */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-block">
                <span className="font-logo text-xl lg:text-2xl font-bold tracking-tight text-neutral-900">
                  design4public
                </span>
              </Link>
              <p className="mt-4 text-sm lg:text-base text-neutral-600 leading-relaxed max-w-md">
                한국 공공조달 가구 납품사례를 탐색하는 콘텐츠 사이트입니다.
                프로젝트, 아이템, 브랜드별로 필터링하고 원하는 정보를 찾아보세요.
              </p>

              {/* Contact Info */}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <a
                  href="mailto:d4p@design4public.com"
                  className="flex items-center gap-2 text-sm text-neutral-600 hover:text-sage-700 transition-colors"
                >
                  <Mail className="h-4 w-4 text-neutral-400" />
                  <span>d4p@design4public.com</span>
                </a>
                <a
                  href="tel:+82315992662"
                  className="flex items-center gap-2 text-sm text-neutral-600 hover:text-sage-700 transition-colors"
                >
                  <Phone className="h-4 w-4 text-neutral-400" />
                  <span>T 031 599 2662</span>
                </a>
              </div>
            </div>

            {/* Navigation Links */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                {footerLinks.explore.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.explore.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-600 hover:text-sage-700 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support - Contact Form */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                고객지원
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <button
                    onClick={() => setIsContactOpen(true)}
                    className="text-sm text-neutral-600 hover:text-sage-700 transition-colors"
                  >
                    문의하기
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Copyright only, centered */}
        <div className="border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto w-full max-w-[1920px] px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 py-6">
            <p className="text-xs text-neutral-500 text-center">
              © {currentYear} design4public. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </>
  );
}
