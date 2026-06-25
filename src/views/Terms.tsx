import { useState } from 'react';

const Terms = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
    },
    {
      id: 'accounts',
      title: 'User Accounts',
    },
    {
      id: 'seller',
      title: 'Seller Terms',
    },
    {
      id: 'buyer',
      title: 'Buyer Terms',
    },
    {
      id: 'prohibited',
      title: 'Prohibited Activities',
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
    },
    {
      id: 'termination',
      title: 'Termination',
    },
    {
      id: 'governing',
      title: 'Governing Law',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#1B3A6B] to-[#2d5a9e] text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-6">Terms & Conditions</h1>
          <p className="text-xl text-blue-100">
            Please read these terms and conditions carefully before using ShopTantra.
          </p>
          <p className="text-blue-100 mt-4">
            Last updated: June 13, 2026
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Table of Contents */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Contents</h2>
              <nav className="space-y-3">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-orange-500 text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Introduction */}
            <div>
              <p className="text-gray-700 leading-relaxed text-lg">
                These Terms & Conditions ("Terms") constitute a legal agreement between you
                ("User") and ShopTantra ("Company", "we", "us", "our"). By accessing and using
                the ShopTantra platform, website, mobile application, and services, you agree to
                be bound by these Terms.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg mt-4">
                If you do not agree to any part of these Terms, you may not use our services.
                We reserve the right to modify these Terms at any time. Your continued use of
                ShopTantra following any changes constitutes acceptance of the updated Terms.
              </p>
            </div>

            {/* Section 1: Acceptance */}
            <div id="acceptance" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                Acceptance of Terms
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  By using the ShopTantra platform, you agree to comply with all applicable laws,
                  regulations, and these Terms. If you are using ShopTantra on behalf of a
                  business or organization, you represent and warrant that you have the authority
                  to bind that entity to these Terms.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  ShopTantra reserves the right to deny access to any user or suspend accounts
                  that violate these Terms. We also reserve the right to update these Terms at
                  any time without prior notice.
                </p>
              </div>
            </div>

            {/* Section 2: User Accounts */}
            <div id="accounts" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                User Accounts
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  To use certain features of ShopTantra, you must create an account. You agree to:
                </p>
                <ul className="space-y-3 ml-6 list-disc">
                  <li className="text-gray-700">
                    Provide accurate, complete, and current information during registration
                  </li>
                  <li className="text-gray-700">
                    Maintain the confidentiality of your password and account credentials
                  </li>
                  <li className="text-gray-700">
                    Accept responsibility for all activities under your account
                  </li>
                  <li className="text-gray-700">
                    Promptly notify ShopTantra of any unauthorized account access
                  </li>
                  <li className="text-gray-700">
                    Not use another person's account without permission
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  ShopTantra is not responsible for any loss or damage resulting from failure to
                  maintain account confidentiality.
                </p>
              </div>
            </div>

            {/* Section 3: Seller Terms */}
            <div id="seller" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                Seller Terms
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  If you are a seller on ShopTantra, you agree to:
                </p>
                <ul className="space-y-3 ml-6 list-disc">
                  <li className="text-gray-700">
                    Maintain accurate product listings and descriptions
                  </li>
                  <li className="text-gray-700">
                    Honor all prices and product availability shown on the platform
                  </li>
                  <li className="text-gray-700">
                    Ship products within the stated timeframe
                  </li>
                  <li className="text-gray-700">
                    Provide quality products in good condition
                  </li>
                  <li className="text-gray-700">
                    Respond to customer inquiries within 48 hours
                  </li>
                  <li className="text-gray-700">
                    Comply with all applicable tax and regulatory requirements
                  </li>
                  <li className="text-gray-700">
                    Not engage in fraudulent or deceptive practices
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  <strong>Commission & Fees:</strong> Sellers agree to pay ShopTantra's applicable
                  commission and fees. These may include platform fees, payment processing fees,
                  and listing fees. Commission rates are subject to change with 30 days' notice.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  <strong>Product Restrictions:</strong> Certain categories of products are
                  prohibited. Sellers must review and comply with our prohibited products list
                  before listing items.
                </p>
              </div>
            </div>

            {/* Section 4: Buyer Terms */}
            <div id="buyer" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </span>
                Buyer Terms
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  If you are a buyer on ShopTantra, you agree to:
                </p>
                <ul className="space-y-3 ml-6 list-disc">
                  <li className="text-gray-700">
                    Provide accurate shipping and contact information
                  </li>
                  <li className="text-gray-700">
                    Pay for purchases according to the stated terms
                  </li>
                  <li className="text-gray-700">
                    Not use offensive or abusive language when contacting sellers
                  </li>
                  <li className="text-gray-700">
                    Accept products as described by the seller
                  </li>
                  <li className="text-gray-700">
                    Report issues within the return window
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  <strong>Return Policy:</strong> Products may be returned within 30 days of
                  delivery if they are unused and in original condition. Specific return policies
                  vary by seller and product category.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  <strong>Product Guarantee:</strong> ShopTantra facilitates transactions between
                  buyers and sellers. We are not liable for product quality issues unless they
                  result from our negligence.
                </p>
              </div>
            </div>

            {/* Section 5: Prohibited Activities */}
            <div id="prohibited" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  5
                </span>
                Prohibited Activities
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  You agree not to engage in any of the following prohibited activities:
                </p>
                <ul className="space-y-3 ml-6 list-disc">
                  <li className="text-gray-700">
                    Illegal or fraudulent activities
                  </li>
                  <li className="text-gray-700">
                    Hacking, unauthorized access, or interference with platform security
                  </li>
                  <li className="text-gray-700">
                    Transmission of viruses, malware, or harmful code
                  </li>
                  <li className="text-gray-700">
                    Intellectual property infringement
                  </li>
                  <li className="text-gray-700">
                    Harassment, threats, or defamatory content
                  </li>
                  <li className="text-gray-700">
                    Price manipulation or collusion with other sellers
                  </li>
                  <li className="text-gray-700">
                    Creating fake reviews or misleading ratings
                  </li>
                  <li className="text-gray-700">
                    Using automated tools to scrape or collect data without permission
                  </li>
                  <li className="text-gray-700">
                    Spam, unsolicited communications, or marketing
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Violation of these terms may result in account suspension or termination.
                </p>
              </div>
            </div>

            {/* Section 6: Limitation of Liability */}
            <div id="liability" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  6
                </span>
                Limitation of Liability
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Disclaimer:</strong> ShopTantra provides the platform "as is" and "as
                  available". We make no warranties, expressed or implied, regarding the platform's
                  functionality, availability, or suitability for a particular purpose.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Limitation:</strong> In no event shall ShopTantra be liable for:
                </p>
                <ul className="space-y-3 ml-6 list-disc">
                  <li className="text-gray-700">
                    Lost profits, revenue, or data
                  </li>
                  <li className="text-gray-700">
                    Indirect, incidental, or consequential damages
                  </li>
                  <li className="text-gray-700">
                    Business interruption
                  </li>
                  <li className="text-gray-700">
                    Third-party seller conduct or product quality
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Our total liability shall not exceed the amount you have paid to ShopTantra in
                  the 12 months prior to the claim.
                </p>
              </div>
            </div>

            {/* Section 7: Termination */}
            <div id="termination" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  7
                </span>
                Termination
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>User Termination:</strong> You may terminate your account at any time by
                  contacting customer support. Upon termination, we will delete your account data
                  within 30 days, except where we are required to retain it by law.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>ShopTantra Termination:</strong> We may terminate or suspend your account
                  immediately without notice if you:
                </p>
                <ul className="space-y-3 ml-6 list-disc">
                  <li className="text-gray-700">
                    Violate these Terms or any applicable laws
                  </li>
                  <li className="text-gray-700">
                    Engage in fraudulent or illegal activities
                  </li>
                  <li className="text-gray-700">
                    Repeatedly violate platform policies
                  </li>
                  <li className="text-gray-700">
                    Fail to pay owed amounts (for sellers)
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 8: Governing Law */}
            <div id="governing" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  8
                </span>
                Governing Law & Dispute Resolution
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  These Terms are governed by and construed in accordance with the laws of India,
                  without regard to its conflict of law provisions. You agree that any legal
                  action or proceeding arising from these Terms shall be exclusively resolved in
                  the courts located in Mumbai, India.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Dispute Resolution:</strong> Before pursuing legal action, both parties
                  agree to attempt resolution through good-faith negotiation. If negotiation fails,
                  either party may escalate to arbitration or mediation as applicable under Indian law.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Jurisdiction:</strong> You irrevocably submit to the jurisdiction of the
                  courts in Mumbai, India, and agree not to contest the applicability of those courts.
                </p>
              </div>
            </div>

            {/* Miscellaneous */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-lg p-8 border border-blue-200 mt-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Miscellaneous</h3>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Entire Agreement:</strong> These Terms constitute the entire agreement
                  between you and ShopTantra regarding the use of the platform.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Severability:</strong> If any provision of these Terms is found to be
                  unenforceable, the remaining provisions shall remain in effect.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Contact:</strong> For questions regarding these Terms, please contact
                  legal@shoptantra.com.
                </p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="border-t-2 border-gray-200 pt-8 mt-12">
              <p className="text-gray-600 text-sm">
                These Terms & Conditions were last updated on June 13, 2026. We reserve the right
                to modify these Terms at any time. Your continued use of ShopTantra constitutes
                acceptance of the updated Terms. It is your responsibility to review these Terms
                periodically for changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
