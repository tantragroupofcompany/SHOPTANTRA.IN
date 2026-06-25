import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const Privacy = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    {
      id: 'information',
      title: 'Information We Collect',
    },
    {
      id: 'usage',
      title: 'How We Use It',
    },
    {
      id: 'cookies',
      title: 'Cookies and Tracking',
    },
    {
      id: 'third-parties',
      title: 'Third-Party Services',
    },
    {
      id: 'security',
      title: 'Security Measures',
    },
    {
      id: 'rights',
      title: 'Your Rights',
    },
    {
      id: 'contact',
      title: 'Contact Us',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#1B3A6B] to-[#2d5a9e] text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-xl text-blue-100">
            Your privacy is important to us. Learn how we protect and use your data.
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
                ShopTantra ("we", "us", "our", or "Company") operates the ShopTantra platform.
                This page informs you of our policies regarding the collection, use, and
                disclosure of personal data when you use our service and the choices you have
                associated with that data.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg mt-4">
                We use your data to provide and improve the service. By using ShopTantra, you
                agree to the collection and use of information in accordance with this policy.
              </p>
            </div>

            {/* Section 1: Information We Collect */}
            <div id="information" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                Information We Collect
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  We collect various types of information in connection with the services we
                  provide, including:
                </p>
                <ul className="space-y-3 ml-6 list-disc">
                  <li className="text-gray-700">
                    <strong>Account Information:</strong> Name, email address, phone number,
                    shipping and billing addresses
                  </li>
                  <li className="text-gray-700">
                    <strong>Payment Information:</strong> Credit card details (processed securely
                    through payment gateways)
                  </li>
                  <li className="text-gray-700">
                    <strong>Profile Information:</strong> Profile picture, preferences, and
                    wishlist items
                  </li>
                  <li className="text-gray-700">
                    <strong>Purchase History:</strong> Details of products purchased and order
                    information
                  </li>
                  <li className="text-gray-700">
                    <strong>Device Information:</strong> IP address, browser type, operating
                    system, and usage data
                  </li>
                  <li className="text-gray-700">
                    <strong>Communication:</strong> Messages, reviews, and feedback you provide
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 2: How We Use It */}
            <div id="usage" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                How We Use Your Information
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  ShopTantra uses the collected data for various purposes:
                </p>
                <ul className="space-y-3 ml-6 list-disc">
                  <li className="text-gray-700">
                    To provide, maintain, and improve our services
                  </li>
                  <li className="text-gray-700">
                    To process transactions and send related information
                  </li>
                  <li className="text-gray-700">
                    To send promotional emails and marketing communications (you can opt-out)
                  </li>
                  <li className="text-gray-700">
                    To respond to your inquiries and provide customer support
                  </li>
                  <li className="text-gray-700">
                    To monitor and analyze trends, usage, and activities for security purposes
                  </li>
                  <li className="text-gray-700">
                    To detect, prevent, and address fraudulent transactions and other illegal
                    activities
                  </li>
                  <li className="text-gray-700">
                    To personalize your experience and deliver content relevant to your interests
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 3: Cookies and Tracking */}
            <div id="cookies" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                Cookies and Tracking Technologies
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  ShopTantra uses cookies and similar tracking technologies to track activity on
                  our platform and hold certain information. You can instruct your browser to
                  refuse all cookies or to indicate when a cookie is being sent.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Types of cookies we use:</strong>
                </p>
                <ul className="space-y-3 ml-6 list-disc">
                  <li className="text-gray-700">
                    <strong>Essential Cookies:</strong> Required for the platform to function
                  </li>
                  <li className="text-gray-700">
                    <strong>Performance Cookies:</strong> Track how you use our platform
                  </li>
                  <li className="text-gray-700">
                    <strong>Functional Cookies:</strong> Remember your preferences
                  </li>
                  <li className="text-gray-700">
                    <strong>Marketing Cookies:</strong> Used to track visitors across websites
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 4: Third-Party Services */}
            <div id="third-parties" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </span>
                Third-Party Services
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  ShopTantra may employ third-party companies and individuals to facilitate our
                  service, provide service on our behalf, perform service-related services, or
                  assist us in analyzing how our service is used.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  These third parties have access to your personal data only to perform these
                  tasks on our behalf and are obligated not to disclose or use it for any other
                  purpose. Third-party service providers include payment processors, shipping
                  partners, analytics providers, and customer support platforms.
                </p>
              </div>
            </div>

            {/* Section 5: Security */}
            <div id="security" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  5
                </span>
                Security of Your Data
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  The security of your data is important to us but remember that no method of
                  transmission over the internet or method of electronic storage is 100% secure.
                  While we strive to use commercially acceptable means to protect your personal
                  data, we cannot guarantee its absolute security.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Security measures we implement:</strong>
                </p>
                <ul className="space-y-3 ml-6 list-disc">
                  <li className="text-gray-700">SSL/TLS encryption for data in transit</li>
                  <li className="text-gray-700">Secure password hashing and storage</li>
                  <li className="text-gray-700">Regular security audits and penetration testing</li>
                  <li className="text-gray-700">Access controls and data minimization</li>
                  <li className="text-gray-700">Employee training on data protection</li>
                </ul>
              </div>
            </div>

            {/* Section 6: Your Rights */}
            <div id="rights" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  6
                </span>
                Your Privacy Rights
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Depending on your location, you may have certain rights regarding your personal
                  data:
                </p>
                <ul className="space-y-3 ml-6 list-disc">
                  <li className="text-gray-700">
                    <strong>Right to Access:</strong> You can request a copy of your personal data
                  </li>
                  <li className="text-gray-700">
                    <strong>Right to Rectification:</strong> You can correct inaccurate data
                  </li>
                  <li className="text-gray-700">
                    <strong>Right to Erasure:</strong> You can request deletion of your data
                  </li>
                  <li className="text-gray-700">
                    <strong>Right to Restrict:</strong> You can limit how we use your data
                  </li>
                  <li className="text-gray-700">
                    <strong>Right to Data Portability:</strong> You can receive data in a portable
                    format
                  </li>
                  <li className="text-gray-700">
                    <strong>Right to Object:</strong> You can object to certain processing
                  </li>
                  <li className="text-gray-700">
                    <strong>Right to Withdraw Consent:</strong> You can withdraw consent at any time
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  To exercise any of these rights, please contact us using the information below.
                </p>
              </div>
            </div>

            {/* Section 7: Contact */}
            <div id="contact" className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  7
                </span>
                Contact Us
              </h2>
              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-lg p-8 border border-blue-200">
                <p className="text-gray-700 leading-relaxed mb-6">
                  If you have any questions about this Privacy Policy, please contact us:
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Email</p>
                    <p className="text-gray-900">privacy@shoptantra.com</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Mailing Address</p>
                    <p className="text-gray-900">
                      ShopTantra Privacy Team<br />
                      Mumbai, India 400001
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Phone</p>
                    <p className="text-gray-900">+91 1800 123 4567</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="border-t-2 border-gray-200 pt-8 mt-12">
              <p className="text-gray-600 text-sm">
                This Privacy Policy was last updated on June 13, 2026. We may update this policy
                from time to time. We will notify you of any changes by posting the new Privacy
                Policy on this page and updating the "Last updated" date above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
