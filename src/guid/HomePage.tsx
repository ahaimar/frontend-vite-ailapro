import React from 'react';
import { Link, useNavigate } from 'react-router';
import SEO from '../components/layout/SEO.tsx';
import AiliIcon from '../assets/LOGO_page-0001.jpg';
import { Button } from '../ui/UI.tsx';


// ─── Sub-components ──────────────────────────────────────────────────────────

const LogoMark: React.FC = () => (
    <div
        style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 900,
            fontSize: 14,
            flexShrink: 0,
        }}
    >
        A
    </div>
);

type IconColor = 'blue' | 'purple' | 'teal';
const iconBg: Record<IconColor, string> = {
    blue: '#dbeafe',
    purple: '#ede9fe',
    teal: '#ccfbf1',
};
const iconColor: Record<IconColor, string> = {
    blue: '#1d4ed8',
    purple: '#6d28d9',
    teal: '#0f766e',
};

const ProgramIcon: React.FC<{ label: string; color: IconColor }> = ({ label, color }) => (
    <div
        style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: iconBg[color],
            color: iconColor[color],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: '-0.5px',
        }}
    >
        {label}
    </div>
);

const ContactIcon: React.FC<{ emoji: string; bg: string }> = ({ emoji, bg }) => (
    <div
        style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
        }}
    >
        {emoji}
    </div>
);

// ─── Data ────────────────────────────────────────────────────────────────────

const STATS = [
    { num: '2,000+', label: 'Students trained' },
    { num: '94%', label: 'Target score achieved' },
    { num: '10+', label: 'Years of experience' },
    { num: '3', label: 'Certified programs' },
];

const PROGRAMS = [
    {
        color: 'blue' as IconColor,
        label: 'IELTS',
        title: 'IELTS Preparation',
        badge: 'Popular',
        description:
            'Comprehensive coverage of all four components — Listening, Reading, Writing, and Speaking — with personalised feedback and targeted practice.',
        features: [
            'Expert techniques for each section',
            'Full-length practice tests',
            'Score improvement guaranteed',
        ],
    },
    {
        color: 'purple' as IconColor,
        label: 'TCF',
        title: 'TCF Preparation',
        badge: null,
        description:
            'French proficiency certification for Canada immigration, university admission, or professional purposes. Native-speaker instructors throughout.',
        features: [
            'Native French-speaking instructors',
            'All TCF modules covered',
            'Authentic practice materials',
        ],
    },
    {
        color: 'teal' as IconColor,
        label: 'TOEFL',
        title: 'TOEFL & TOEIC',
        badge: '✦ Study abroad',
        description:
            'Your pathway to English-speaking universities and the workplace. Master academic reading, academic listening, and business communication.',
        features: [
            'Academic reading & listening',
            'Business English skills',
            'Professional context mastery',
        ],
    },
];

const WHY_ITEMS = [
    {
        emoji: '🏆',
        title: 'Proven results',
        body: '94% of our students reach their target band score on the first attempt.',
    },
    {
        emoji: '👨‍🏫',
        title: 'Expert instructors',
        body: 'Certified native and bilingual teachers with 10+ years of exam coaching.',
    },
    {
        emoji: '📚',
        title: 'Rich materials',
        body: 'Official past papers, mock tests, and exclusive study guides included.',
    },
    {
        emoji: '🤝',
        title: 'Personal support',
        body: 'Small class sizes and 1-on-1 feedback sessions to keep you on track.',
    },
];

const CONTACT_ITEMS = [
    {
        emoji: '📍',
        bg: '#fef3c7',
        title: 'Location',
        content: (
            <p className="text-sm text-gray-600 leading-relaxed">
                Deido Ancient Ises (Immeuble Ketch)
                <br />
                Douala, Cameroon
            </p>
        ),
    },
    {
        emoji: '📞',
        bg: '#d1fae5',
        title: 'Phone',
        content: (
            <ul className="text-sm text-blue-700 font-medium space-y-1">
                <li>+237 6 92 51 77 21</li>
                <li>+237 6 78 14 77 39</li>
                <li>+237 6 53 90 20 37</li>
            </ul>
        ),
    },
    {
        emoji: '✉️',
        bg: '#dbeafe',
        title: 'Email',
        content: (
            <>
                <a
                    href="mailto:ailainstitut7@gmail.com"
                    className="text-sm text-blue-700 font-medium hover:underline"
                >
                    ailainstitut7@gmail.com
                </a>
                <p className="text-xs text-gray-400 mt-1">We reply within 24 hours</p>
            </>
        ),
    },
    {
        emoji: '🕐',
        bg: '#ede9fe',
        title: 'Hours',
        content: (
            <div className="text-sm text-gray-600 space-y-1">
                <p>Mon – Fri: 8:00 AM – 6:00 PM</p>
                <p>Saturday: 9:00 AM – 4:00 PM</p>
                <p>Closed on Sundays</p>
            </div>
        ),
    },
];

function Nav (){
    const navigate = useNavigate();
    return(
        <>
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        {/*<LogoMark />*/}
                        <img width={50} height={30} alt='img' src={AiliIcon} />
                        <span className="font-bold text-base tracking-wide text-gray-900">
                            AILA Pro
                        </span>
                    </Link>

                    <nav>
                        <ul className="flex items-center gap-7">
                            <li>
                                <a href="#" className="text-sm font-medium text-blue-600">
                                    Home
                                </a>
                            </li>
                            <li>
                                <a href="/about" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                                    About Us
                                </a>
                            </li>
                            <li>
                                <a href="#programs" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                                    Programs
                                </a>
                            </li>
                            <li>
                                <a href="#contact" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                                    Contact
                                </a>
                            </li>
                            {/*<li>
                                <Link
                                    to="/login"
                                    className="text-sm font-semibold bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Get Started
                                </Link>
                            </li>*/}
                            <li>
                                <Button
                                    label='Get Started'
                                    onClick={() => navigate('/login')}
                                />
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>
        </>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const HomePage: React.FC = () => (
    <>
        <SEO
            title="IELTS & TCF Preparation in Douala"
            description="Achieve your target band score with AILA Institute. Expert IELTS, TCF, and TOEFL preparation in Douala, Cameroon."
            canonicalUrl="https://www.ailainstitute.com/"
        />

        <div className="font-sans text-gray-800 bg-base-100">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <Nav/>
            <main>
                {/* ── Hero ───────────────────────────────────────────────────────── */}
                <section className="bg-linear-to-b from-slate-50 to-white pt-20 pb-16 text-center">
                    <div className="container mx-auto px-6">
                        <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
                        ★ Trusted by 2,000+ students in Douala
                        </span>

                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-950 tracking-tight leading-tight max-w-2xl mx-auto mb-5">
                            Ace Your{' '}
                            <span className="text-blue-600">Language Tests</span>
                            <br />
                            With Confidence
                        </h1>

                        <p className="text-gray-500 text-base max-w-lg mx-auto mb-9 leading-relaxed">
                            Expert IELTS, TCF, and TOEFL preparation in Douala. Personalised
                            coaching, authentic practice materials, and guaranteed results.
                        </p>

                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            <Link
                                to="/login"
                                className="text-sm font-semibold bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Start Your Journey →
                            </Link>
                            <a
                                href="#programs"
                                className="text-sm font-semibold text-blue-600 border border-blue-600 px-6 py-2.5 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                View Programs
                            </a>
                        </div>

                        {/* Stats row */}
                        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mt-14 pt-8 border-t border-gray-100">
                            {STATS.map(({ num, label }) => (
                                <div key={label} className="text-center">
                                    <div className="text-2xl font-extrabold text-gray-950">{num}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Programs ───────────────────────────────────────────────────── */}
                <section id="programs" className="py-20 bg-gray-50">
                    <div className="container mx-auto px-6">
                        <SectionHeader
                            title="Our Programs"
                            subtitle="Structured preparation for every major English and French certification exam."
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {PROGRAMS.map(({ color, label, title, badge, description, features }) => (
                                <div
                                    key={title}
                                    className={`bg-white rounded-2xl border p-7 flex flex-col gap-4 hover:shadow-md transition-shadow ${
                                        badge === 'Popular'
                                            ? 'border-blue-500 border-2'
                                            : 'border-gray-100'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <ProgramIcon label={label} color={color} />
                                        {badge && (
                                            <span
                                                className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                    badge === 'Popular'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-violet-100 text-violet-700'
                                                }`}
                                            >
                                                {badge}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-base font-bold text-gray-950">{title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed grow">
                                        {description}
                                    </p>

                                    <ul className="space-y-1.5">
                                        {features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                                <span className="text-emerald-500 text-xs">✓</span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline mt-1"
                                    >
                                        Learn more →
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Why AILA ───────────────────────────────────────────────────── */}
                <section className="py-20">
                    <div className="container mx-auto px-6">
                        <SectionHeader title="Why Choose AILA?" />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {WHY_ITEMS.map(({ emoji, title, body }) => (
                                <div key={title} className="bg-slate-50 rounded-2xl p-6 text-center">
                                    <div className="text-3xl mb-3">{emoji}</div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-2 capitalize">{title}</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Contact ────────────────────────────────────────────────────── */}
                <section id="contact" className="py-20 bg-gray-50">
                    <div className="container mx-auto px-6">
                        <SectionHeader title="Get In Touch" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {CONTACT_ITEMS.map(({ emoji, bg, title, content }) => (
                                <div
                                    key={title}
                                    className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center text-center gap-3"
                                >
                                    <ContactIcon emoji={emoji} bg={bg} />
                                    <h4 className="text-sm font-bold text-gray-950">{title}</h4>
                                    {content}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Social ─────────────────────────────────────────────────────── */}
                <section className="py-14 border-t border-gray-100 bg-sky-400 text-center">
                    <div className="container mx-auto px-6">
                        <h3 className="text-base font-bold text-gray-950 mb-5">Follow Us</h3>
                        <div className="flex justify-center gap-3 flex-wrap">
                            {[
                                { href: '#', label: 'Facebook', textColor: 'text-blue-700' },
                                { href: '#', label: 'Instagram', textColor: 'text-pink-600' },
                                { href: '#', label: 'TikTok', textColor: 'text-gray-900' },
                            ].map(({ href, label, textColor }) => (
                                <a
                                    key={label}
                                    href={href}
                                    className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors ${textColor}`}
                                >
                                    {label}
                                </a>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <footer className="bg-gray-950 text-white">
                <div className="container mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <LogoMark />
                            <span className="font-bold text-sm tracking-wide">AILA INSTITUTE</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                            Expert language test preparation in Douala, Cameroon. Helping
                            students achieve their goals since 2014.
                        </p>
                    </div>

                    <FooterLinks
                        title="Quick Links"
                        links={[
                            { label: 'Home', href: '#' },
                            { label: 'About Us', href: '/about' },
                            { label: 'Programs', href: '#programs' },
                            { label: 'Testimonials', href: '#' },
                        ]}
                    />
                    <FooterLinks
                        title="Programs"
                        links={[
                            { label: 'IELTS & TOEFL', href: '#' },
                            { label: 'TCF Preparation', href: '#' },
                            { label: 'European Placement', href: '#' },
                            { label: 'Business English', href: '#' },
                        ]}
                    />
                    <FooterLinks
                        title="Contact"
                        links={[
                            { label: 'ailainstitut7@gmail.com', href: 'mailto:ailainstitut7@gmail.com' },
                            { label: '+237 6 92 51 77 21', href: 'tel:+237692517721' },
                            { label: 'Douala, Cameroon', href: '#' },
                        ]}
                    />
                </div>

                <div className="border-t border-gray-800 py-5 text-center text-xs text-gray-600">
                    © 2026 AILA Institute SARL. All rights reserved.
                </div>
            </footer>
        </div>
    </>
);

// ─── Shared helpers ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({
                                                                           title,
                                                                           subtitle,
                                                                       }) => (
    <div className="text-center mb-12">
        <h2 className="text-2xl font-extrabold text-gray-950 mb-2">{title}</h2>
        <div className="h-0.5 w-10 bg-violet-600 rounded-full mx-auto" />
        {subtitle && (
            <p className="text-sm text-gray-500 max-w-lg mx-auto mt-3 leading-relaxed">
                {subtitle}
            </p>
        )}
    </div>
);

const FooterLinks: React.FC<{
    title: string;
    links: { label: string; href: string }[];
}> = ({ title, links }) => (
    <div className="space-y-4">
        <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {title}
        </h5>
        <ul className="space-y-2">
            {links.map(({ label, href }) => (
                <li key={label}>
                    <a href={href} className="text-sm text-gray-500 hover:text-white transition-colors">
                        {label}
                    </a>
                </li>
            ))}
        </ul>
    </div>
);

export default HomePage;