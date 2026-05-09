/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  School, 
  User, 
  Calendar, 
  IdCard, 
  Wrench, 
  Upload, 
  Plus, 
  MapPin, 
  Phone,
  Trash2,
  ChevronDown,
  CheckCircle2,
  FileDown,
  LogIn,
  Image as ImageIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Student {
  id: string;
  name: string;
  gender: string;
  dob: string;
  age: number;
  idNumber: string;
  skill: string;
}

const SKILL_OPTIONS = [
  "Automobile mechanic",
  "Electrical installations and electronics",
  "Tailoring and fashion design"
];

const GENDER_OPTIONS = ["Male", "Female"];

export default function App() {
  const [logo, setLogo] = useState<string | null>(null);
  const [leftAffiliateLogo, setLeftAffiliateLogo] = useState<string | null>(null);
  const [rightAffiliateLogo, setRightAffiliateLogo] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const leftLogoRef = useRef<HTMLInputElement>(null);
  const rightLogoRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    dob: '',
    idNumber: '',
    skill: ''
  });

  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.gender || !formData.dob || !formData.idNumber || !formData.skill) {
      alert("Please fill in all student details");
      return;
    }

    const newStudent: Student = {
      id: crypto.randomUUID(),
      ...formData,
      age: calculateAge(formData.dob)
    };

    setStudents([...students, newStudent]);
    setFormData({
      name: '',
      gender: '',
      dob: '',
      idNumber: '',
      skill: ''
    });
  };

  const removeStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const age = formData.dob ? calculateAge(formData.dob) : null;

  // Summary Calculations
  const totalRegistered = students.length;
  const totalMale = students.filter(s => s.gender === 'Male').length;
  const totalFemale = students.filter(s => s.gender === 'Female').length;
  
  const skillBreakdown = SKILL_OPTIONS.map(skill => ({
    name: skill,
    count: students.filter(s => s.skill === skill).length
  }));

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add Logo if exists
    if (logo) {
      try {
        doc.addImage(logo, 'PNG', 15, 10, 25, 25);
      } catch (e) {
        console.error("Error adding logo to PDF", e);
      }
    }

    // Header Details
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("STEP UP Institute of ICT and", 50, 15);
    doc.text("Community skills development", 50, 23);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("P.O BOX 97, Lumbadzi", 50, 30);
    doc.text("Contact: +(265)990 554 107", 50, 35);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 42, 195, 42);

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("Student Registration Report", 15, 52);
    
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 58);

    // Summary Section in PDF
    doc.setFontSize(11);
    doc.text("Registration Summary", 15, 70);
    doc.setFontSize(9);
    doc.text(`Total Registered: ${totalRegistered}`, 15, 76);
    doc.text(`Male: ${totalMale} | Female: ${totalFemale}`, 15, 81);
    
    let skillY = 76;
    doc.text("Skill Breakdown:", 100, 70);
    skillBreakdown.forEach(skill => {
      doc.text(`${skill.name}: ${skill.count}`, 100, skillY);
      skillY += 5;
    });

    // Table Data
    const tableData = students.map((s, index) => [
      index + 1,
      s.name,
      s.gender,
      new Date(s.dob).toLocaleDateString(),
      s.age,
      s.idNumber,
      s.skill
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['#', 'Full Name', 'Gender', 'D.O.B', 'Age', 'ID Number', 'Skill Path']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 }, // blue-600
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    // Footer Section - Sticky at bottom of first page for now
    const footerY = 275;
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(15, footerY - 10, 195, footerY - 10);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("AFFILIATED PARTNERS", 105, footerY - 4, { align: 'center' });
    doc.text(`© ${new Date().getFullYear()} STEP UP Institute. All rights reserved.`, 105, footerY + 12, { align: 'center' });

    // Affiliate Logos
    if (leftAffiliateLogo) {
      try {
        doc.addImage(leftAffiliateLogo, 'PNG', 15, footerY - 8, 25, 15);
      } catch (e) { console.error(e); }
    }
    if (rightAffiliateLogo) {
      try {
        doc.addImage(rightAffiliateLogo, 'PNG', 170, footerY - 8, 25, 15);
      } catch (e) { console.error(e); }
    }

    // Save PDF
    doc.save(`STEP_UP_Registration_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Header Section */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div 
                className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 group-hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {logo ? (
                  <img src={logo} alt="School Logo" className="w-full h-full object-cover" />
                ) : (
                  <School className="w-10 h-10 text-slate-400 group-hover:text-blue-500 transition-colors" />
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleLogoUpload(e, setLogo)} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                title="Attach Logo"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                STEP UP Institute of ICT and <br className="hidden md:block" />
                Community skills development
              </h1>
              <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  P.O BOX 97, Lumbadzi
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  +(265)990 554 107
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => alert("Affiliate Login Coming Soon")}
              className="group flex items-center gap-2 px-5 py-2.5 bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 hover:border-slate-300 active:scale-95 transition-all text-sm"
            >
              <LogIn className="w-4 h-4 text-slate-500 group-hover:text-slate-900" />
              Affiliate Login
            </button>
            <div className="hidden lg:block">
              <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-blue-700 font-medium text-sm">Student Registration Portal</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Registration Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 sticky top-32">
              <div className="mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Add New Student
                </h2>
                <p className="text-slate-500 text-sm mt-1">Enter individual student details below.</p>
              </div>

              <form onSubmit={addStudent} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                    <div className="relative">
                      <select 
                        required
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={formData.gender}
                        onChange={e => setFormData({...formData, gender: e.target.value})}
                      >
                        <option value="">Select</option>
                        {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">ID Number</label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        placeholder="N-1234"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={formData.idNumber}
                        onChange={e => setFormData({...formData, idNumber: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="date" 
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={formData.dob}
                        onChange={e => setFormData({...formData, dob: e.target.value})}
                      />
                    </div>
                    {age !== null && (
                      <div className="w-20 flex flex-col items-center justify-center bg-blue-50 border border-blue-100 rounded-xl">
                        <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">Age</span>
                        <span className="text-lg font-bold text-blue-700">{age}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Selected Course/Skill</label>
                  <div className="relative">
                    <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      value={formData.skill}
                      onChange={e => setFormData({...formData, skill: e.target.value})}
                    >
                      <option value="">Choose a skill path...</option>
                      {SKILL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add to Register
                </button>
              </form>
            </div>
          </div>

          {/* Registration List */}
          <div className="lg:col-span-7 space-y-6">
            {/* Registration Summary Card */}
            <AnimatePresence>
              {students.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">Registration Summary</h3>
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {totalRegistered} Total
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Male</p>
                      <p className="text-xl font-bold text-slate-700">{totalMale}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Female</p>
                      <p className="text-xl font-bold text-slate-700">{totalFemale}</p>
                    </div>
                    <div className="col-span-2 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] uppercase font-bold text-blue-400 mb-2">Skill Breakdown</p>
                      <div className="space-y-1">
                        {skillBreakdown.map(skill => (
                          <div key={skill.name} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 truncate mr-2" title={skill.name}>{skill.name}</span>
                            <span className="font-bold text-blue-700 shrink-0">{skill.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Registered Students</h2>
                  <p className="text-slate-500 text-sm mt-1">{students.length} enrollment{students.length !== 1 ? 's' : ''} listed</p>
                </div>
                {students.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={generatePDF}
                      className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 hover:bg-slate-900 transition-colors"
                      title="Download A4 PDF"
                    >
                      <FileDown className="w-4 h-4" />
                      Print A4 PDF
                    </button>
                    <button 
                      onClick={() => {
                        setIsSubmitting(true);
                        setTimeout(() => {
                          alert("Registrations submitted successfully!");
                          setIsSubmitting(false);
                          setStudents([]);
                        }, 1500);
                      }}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? "Processing..." : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Finalize All
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="divide-y divide-slate-100 min-h-[400px]">
                <AnimatePresence mode="popLayout" initial={false}>
                  {students.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full py-20 px-6 text-center"
                    >
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <User className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-slate-900 font-medium">No students registered yet</h3>
                      <p className="text-slate-500 text-sm mt-1 max-w-[240px]">Use the form on the left to start adding students to the institute's database.</p>
                    </motion.div>
                  ) : (
                    students.map((student) => (
                      <motion.div 
                        key={student.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group flex items-start p-6 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 font-bold shrink-0">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-900">{student.name}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              ID: {student.idNumber}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              {student.gender === 'Male' ? 'M' : 'F'} · {student.age} years
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              Born {new Date(student.dob).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600">
                              <Wrench className="w-3 h-3 text-blue-500" />
                              {student.skill}
                            </div>
                            <button 
                              onClick={() => removeStudent(student.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {students.length > 0 && (
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-400">
                    System time: {new Date().toLocaleString()} · Records are temporary until finalized.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-12 mt-12 border-t border-slate-200">
        <div className="grid grid-cols-3 items-center gap-8 mb-8">
          {/* Left Affiliate Logo */}
          <div className="flex justify-start">
            <div className="relative group">
              <div 
                className="w-24 h-16 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group-hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => leftLogoRef.current?.click()}
              >
                {leftAffiliateLogo ? (
                  <img src={leftAffiliateLogo} alt="Affiliate Left" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-tighter">Affiliate L</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={leftLogoRef} 
                onChange={(e) => handleLogoUpload(e, setLeftAffiliateLogo)} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={() => leftLogoRef.current?.click()}
                className="absolute -top-2 -right-2 bg-white text-slate-400 p-1 rounded-full shadow-sm border border-slate-200 hover:text-blue-600 transition-colors"
              >
                <Upload className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Center Content */}
          <div className="text-center">
            <p className="text-slate-500 font-medium text-sm mb-1">Affiliated Partners</p>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">Supporting Skills Development</p>
          </div>

          {/* Right Affiliate Logo */}
          <div className="flex justify-end">
            <div className="relative group">
              <div 
                className="w-24 h-16 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group-hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => rightLogoRef.current?.click()}
              >
                {rightAffiliateLogo ? (
                  <img src={rightAffiliateLogo} alt="Affiliate Right" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-tighter">Affiliate R</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={rightLogoRef} 
                onChange={(e) => handleLogoUpload(e, setRightAffiliateLogo)} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={() => rightLogoRef.current?.click()}
                className="absolute -top-2 -right-2 bg-white text-slate-400 p-1 rounded-full shadow-sm border border-slate-200 hover:text-blue-600 transition-colors"
              >
                <Upload className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} STEP UP Institute of ICT and Community skills development. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

