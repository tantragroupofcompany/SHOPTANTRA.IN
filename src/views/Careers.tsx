import { Briefcase, MapPin, DollarSign, Clock, Users, ShieldCheck, Heart, Coffee } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Careers() {
  const { addNotification } = useApp();

  const benefits = [
    { icon: Heart, title: 'Health & Wellness', desc: 'Comprehensive medical coverage for you and your direct dependents.' },
    { icon: ShieldCheck, title: 'Secure Future', desc: 'Employee Provident Fund (EPF), gratuity benefits, and life insurance.' },
    { icon: Coffee, title: 'Work-Life Balance', desc: 'Flexible hours, remote-friendly culture, and regular team gatherings.' },
    { icon: Users, title: 'Professional Growth', desc: 'Annual learning allowances, certifications, and mentorship initiatives.' }
  ];

  const jobs = [
    {
      title: 'Senior Frontend Developer (React / Next.js)',
      dept: 'Engineering',
      location: 'Ahmedabad (Hybrid)',
      type: 'Full-time',
      salary: '₹12L - ₹18L per annum'
    },
    {
      title: 'Seller Acquisition Specialist',
      dept: 'Sales & Growth',
      location: 'Gujarat (On-field/Remote)',
      type: 'Full-time',
      salary: '₹5L - ₹8L + Incentives'
    },
    {
      title: 'Customer Success Executive',
      dept: 'Support',
      location: 'Bodiyar Office (In-office)',
      type: 'Full-time',
      salary: '₹3L - ₹5L per annum'
    },
    {
      title: 'Product Manager - Seller Portal',
      dept: 'Product Management',
      location: 'Ahmedabad / Hybrid',
      type: 'Full-time',
      salary: '₹15L - ₹22L per annum'
    }
  ];

  const handleApply = (jobTitle: string) => {
    addNotification(
      'Application Initiated',
      `Thank you for your interest in the ${jobTitle} role! Please email your CV to careers@shoptantra.in to proceed.`,
      'info'
    );
    window.location.href = `mailto:careers@shoptantra.in?subject=Application for ${encodeURIComponent(jobTitle)}&body=Hello ShopTantra HR Team,%0D%0A%0D%0AI would like to apply for the position of ${encodeURIComponent(jobTitle)}. Attached is my CV.%0D%0A%0D%0ABest regards.`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-brand-navy-dark transition-colors duration-300">
      
      {/* Hero */}
      <section className="bg-gradient-to-r from-brand-navy via-brand-navy-light to-brand-navy text-white py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">Join Our Team</span>
          <h1 className="text-4xl sm:text-5xl font-black mt-4 mb-6">Build the Future of Indian E-Commerce</h1>
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl mx-auto">
            At ShopTantra, we empower millions of local merchants, manufacturers, and artisans. Join us in making digital trade accessible and fair.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white dark:bg-brand-navy">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white">Why Work at ShopTantra?</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">We offer a healthy, growth-oriented workspace with comprehensive benefits.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div key={i} className="p-6 bg-gray-50/50 dark:bg-brand-navy-dark border border-gray-150/40 dark:border-brand-navy-light/10 rounded-2xl shadow-xs space-y-4">
                  <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-white">{benefit.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Job Openings */}
      <section className="py-16 bg-gray-50/50 dark:bg-brand-navy-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white">Current Job Openings</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">Explore active positions across technical and operational departments.</p>
          </div>
          <div className="space-y-4">
            {jobs.map((job, idx) => (
              <div key={idx} className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-brand-orange/40 transition-colors">
                <div className="space-y-2">
                  <span className="bg-brand-orange/15 text-brand-orange dark:text-orange-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{job.dept}</span>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">{job.title}</h3>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-brand-orange" /> {job.location}</span>
                    <span className="flex items-center gap-1"><Clock size={14} className="text-brand-orange" /> {job.type}</span>
                    <span className="flex items-center gap-1"><DollarSign size={14} className="text-brand-orange" /> {job.salary}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleApply(job.title)}
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
