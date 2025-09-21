 import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, Globe, Book, Heart, AlertTriangle, Users, Brain } from 'lucide-react';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      {/* Navigation Back */}
      <div className="fixed top-4 left-4 z-50">
        <Link 
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md rounded-full text-[#5D5A8C] hover:text-[#4C4977] transition-colors shadow-lg border border-white/20"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-light">Back to Home</span>
        </Link>
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-serif font-light tracking-wider text-[#6B5FA8] mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Resources
            </h1>
            <p className="text-xl text-[#8B86B8] font-light leading-relaxed max-w-2xl mx-auto">
              Trusted global crisis hotlines, mental health organisations, and evidence-based tools, grouped by world regions (APAC, EMEA, Americas) to support you wherever you are.
            </p>
          </div>

          {/* Emergency Section */}
          <div className="mb-16">
            <div className="bg-red-50/70 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-red-200/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-3xl font-light text-red-700">Crisis & Emergency Resources</h2>
              </div>
              <p className="text-lg text-red-700 font-light mb-8">
                If you&apos;re having thoughts of self-harm or suicide, please reach out immediately. You are not alone—these numbers are for life-saving help, 24/7 in many regions.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Americas */}
                <div className="bg-white/50 rounded-2xl p-6 border border-red-200/30">
                  <div className="flex items-center gap-3 mb-4">
                    <Phone className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-light text-red-700">United States / Canada</h3>
                  </div>
                <p className="text-2xl font-light text-red-800 mb-2">988</p>
                  <p className="text-sm text-red-600">Suicide & crisis lifeline; 24/7 support by phone/text.</p>
                </div>

                {/* APAC */}
                <div className="bg-white/50 rounded-2xl p-6 border border-red-200/30">
                  <div className="flex items-center gap-3 mb-4">
                    <Phone className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-light text-red-700">Australia</h3>
                  </div>
                  <p className="text-lg font-light text-red-800 mb-2">13 11 14</p>
                  <p className="text-sm text-red-600">Lifeline Australia – free, confidential 24/7 crisis support.</p>
                </div>

                {/* EMEA */}
                <div className="bg-white/50 rounded-2xl p-6 border border-red-200/30">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-light text-red-700">United Kingdom & Ireland</h3>
                  </div>
                  <p className="text-lg font-light text-red-800 mb-2">116 123</p>
                  <p className="text-sm text-red-600">Samaritans – emotional support 24/7.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mental Health Support Organisations */}
          <div className="mb-16">
            <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-white/20">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#EBE7F8] rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-[#6B5FA8]" />
                </div>
                <h2 className="text-3xl font-light text-[#6B5FA8]">Mental Health Support Organisations</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-white/40 rounded-2xl p-6">
                    <h3 className="text-xl font-light text-[#6B5FA8] mb-4">Find A Helpline (Global Directory)</h3>
                    <p className="text-[#8B86B8] font-light mb-3">
                      Over 1,300 free, anonymous, confidential helplines in 130+ countries. Search by country or region.
                    </p>
                    <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer" 
                       className="text-[#6B5FA8] hover:text-[#4C4977] underline font-light">
                      Visit findahelpline.com
                    </a>
                  </div>

                  <div className="bg-white/40 rounded-2xl p-6">
                    <h3 className="text-xl font-light text-[#6B5FA8] mb-4">United for Global Mental Health</h3>
                    <p className="text-[#8B86B8] font-light mb-3">
                      Global advocacy NGO; provides listings & support resources worldwide.
                    </p>
                    <a href="https://unitedgmh.org/support/" target="_blank" rel="noopener noreferrer" 
                       className="text-[#6B5FA8] hover:text-[#4C4977] underline font-light">
                      unitedgmh.org
                    </a>
                  </div>

                  <div className="bg-white/40 rounded-2xl p-6">
                    <h3 className="text-xl font-light text-[#6B5FA8] mb-4">HelpGuide – International Helpline Directory</h3>
                    <p className="text-[#8B86B8] font-light mb-3">
                      Directory of hotlines around the world; browse by your country to get immediate/future support.
                    </p>
                    <a href="https://www.helpguide.org/find-help" target="_blank" rel="noopener noreferrer" 
                       className="text-[#6B5FA8] hover:text-[#4C4977] underline font-light">
                      helpguide.org/find-help
                    </a>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/40 rounded-2xl p-6">
                    <h3 className="text-xl font-light text-[#6B5FA8] mb-4">The Volunteer Emotional Support Helplines (VESH)</h3>
                    <p className="text-[#8B86B8] font-light mb-3">
                      Network of ~1,200 member emotional support centres in 61 countries via Befrienders, IFOTES & Lifeline International.
                    </p>
                    <a href="https://www.befrienders.org/" target="_blank" rel="noopener noreferrer" 
                       className="text-[#6B5FA8] hover:text-[#4C4977] underline font-light">
                      befrienders.org
                    </a>
                  </div>

                  <div className="bg-white/40 rounded-2xl p-6">
                    <h3 className="text-xl font-light text-[#6B5FA8] mb-4">Crisis Text Line</h3>
                    <p className="text-[#8B86B8] font-light mb-3">
                      Text-based crisis support available in US, Canada, UK & Ireland. Text HOME to 741741.
                    </p>
                    <a href="https://www.crisistextline.org/" target="_blank" rel="noopener noreferrer" 
                       className="text-[#6B5FA8] hover:text-[#4C4977] underline font-light">
                      crisistextline.org
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence-Based Therapies */}
          <div className="mb-16">
            <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-white/20">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#EBE7F8] rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-[#6B5FA8]" />
                </div>
                <h2 className="text-3xl font-light text-[#6B5FA8]">Evidence-Based Therapies</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/40 rounded-2xl p-6">
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-4">Cognitive Behavioral Therapy (CBT)</h3>
                  <p className="text-[#8B86B8] font-light mb-4">
                    Helps identify and change negative thought patterns to relieve distress, anxiety & depression.
                  </p>
                  <div className="text-sm text-[#6B5FA8] font-light">
                    <p>• Effective for depression, anxiety, OCD etc.</p>
                    <p>• Structured, time-limited, skill-based therapy.</p>
                  </div>
                </div>

                <div className="bg-white/40 rounded-2xl p-6">
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-4">Dialectical Behavior Therapy (DBT)</h3>
                  <p className="text-[#8B86B8] font-light mb-4">
                    Combines CBT with mindfulness, emotional regulation & distress tolerance. Especially helpful for self-harm or strong emotional reactivity.
                  </p>
                  <div className="text-sm text-[#6B5FA8] font-light">
                    <p>• Skills training modules.</p>
                    <p>• Often includes mindfulness & interpersonal effectiveness.</p>
                  </div>
                </div>

                <div className="bg-white/40 rounded-2xl p-6">
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-4">Trauma-Informed Care</h3>
                  <p className="text-[#8B86B8] font-light mb-4">
                    Recognizes impact of trauma (past or ongoing), emphasizes safety, trust, choice & resilience. Often used in global mental health settings.  
                  </p>
                  <div className="text-sm text-[#6B5FA8] font-light">
                    <p>• Includes grounding & stabilization techniques.</p>
                    <p>• Mindfulness, peer support & empowerment approaches.</p>
                  </div>
                </div>

                <div className="bg-white/40 rounded-2xl p-6">
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-4">Interpersonal Therapy (IPT)</h3>
                  <p className="text-[#8B86B8] font-light mb-4">
                    Helps improve relationships & social functioning to relieve depression, especially effective in low-resource or culturally diverse settings.
                  </p>
                  <div className="text-sm text-[#6B5FA8] font-light">
                    <p>• Short-term & structured.</p>
                    <p>• Adapts well to group formats or remote delivery.</p>
                  </div>
                </div>

                <div className="bg-white/40 rounded-2xl p-6">
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-4">Mindfulness & Meditation Practices</h3>
                  <p className="text-[#8B86B8] font-light mb-4">
                    Practices like guided breathing, meditation, body scans to reduce stress, anxiety, rumination. Widely used across regions.  
                  </p>
                  <div className="text-sm text-[#6B5FA8] font-light">
                    <p>• Accessible via apps, online courses, community groups.</p>
                  </div>
                </div>

                <div className="bg-white/40 rounded-2xl p-6">
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-4">Peer Support & Community Groups</h3>
                  <p className="text-[#8B86B8] font-light mb-4">
                    Connecting with others who&apos;ve had similar experiences. Reduces isolation across cultures & geographies.  
                  </p>
                  <div className="text-sm text-[#6B5FA8] font-light">
                    <p>• Local NGOs, online forums, volunteer helplines.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Self-Help Resources */}
          <div className="mb-16">
            <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-white/20">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#EBE7F8] rounded-full flex items-center justify-center">
                  <Book className="w-6 h-6 text-[#6B5FA8]" />
                </div>
                <h2 className="text-3xl font-light text-[#6B5FA8]">Self-Help & Educational Resources</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-light text-[#6B5FA8]">Recommended Books</h3>
                  <div className="space-y-4">
                    <div className="bg-white/40 rounded-2xl p-4">
                      <h4 className="font-light text-[#6B5FA8] mb-2">&quot;Lost Connections&quot; by Johann Hari</h4>
                      <p className="text-sm text-[#8B86B8] font-light">Explores causes of depression beyond individual biology; connection, social fabric, meaning. </p>
                    </div>
                    <div className="bg-white/40 rounded-2xl p-4">
                      <h4 className="font-light text-[#6B5FA8] mb-2">&quot;The Body Keeps the Score&quot; by Bessel van der Kolk</h4>
                      <p className="text-sm text-[#8B86B8] font-light">A deep look at trauma, its effects, and how healing can occur through body & mind integration. </p>
                    </div>
                    <div className="bg-white/40 rounded-2xl p-4">
                      <h4 className="font-light text-[#6B5FA8] mb-2">&quot;Man&apos;s Search for Meaning&quot; by Viktor Frankl</h4>
                      <p className="text-sm text-[#8B86B8] font-light">A classic exploring purpose, suffering & resilience. </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-light text-[#6B5FA8]">Apps & Digital Tools</h3>
                  <div className="space-y-4">
                    <div className="bg-white/40 rounded-2xl p-4">
                      <h4 className="font-light text-[#6B5FA8] mb-2">Crisis Text Line</h4>
                      <p className="text-sm text-[#8B86B8] font-light">Text-based crisis support in US/Canada/UK/Ireland: text HOME to 741741.</p>
                    </div>
                    <div className="bg-white/40 rounded-2xl p-4">
                      <h4 className="font-light text-[#6B5FA8] mb-2">7 Cups</h4>
                      <p className="text-sm text-[#8B86B8] font-light">Online peer-support chat, many languages, free and paid versions.</p>
                    </div>
                    <div className="bg-white/40 rounded-2xl p-4">
                      <h4 className="font-light text-[#6B5FA8] mb-2">Calm / Headspace</h4>
                      <p className="text-sm text-[#8B86B8] font-light">Global meditation / mindfulness apps with free content to help reduce anxiety / sleep issues.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support Communities */}
          <div className="mb-16">
            <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-white/20">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#EBE7F8] rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#6B5FA8]" />
                </div>
                <h2 className="text-3xl font-light text-[#6B5FA8]">Support Communities</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/40 rounded-2xl p-6">
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-4">Befrienders / Samaritans / Lifeline International</h3>
                  <p className="text-[#8B86B8] font-light mb-3">
                    Partner network offering emotional support services globally; reach via befrienders.org.
                  </p>
                  <a href="https://www.befrienders.org/" target="_blank" rel="noopener noreferrer" className="text-[#6B5FA8] hover:text-[#4C4977] underline font-light">
                    befrienders.org
                  </a>
                </div>

                <div className="bg-white/40 rounded-2xl p-6">
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-4">Child Helpline International</h3>
                  <p className="text-[#8B86B8] font-light mb-3">
                    Network of 173 child helplines in 142 countries; support for children & youth.
                  </p>
                  <a href="https://www.childhelplineinternational.org/" target="_blank" rel="noopener noreferrer" className="text-[#6B5FA8] hover:text-[#4C4977] underline font-light">
                    childhelplineinternational.org
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="text-center">
            <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-white/20">
              <h2 className="text-3xl font-light text-[#6B5FA8] mb-6">Remember</h2>
              <p className="text-lg text-[#8B86B8] font-light leading-relaxed mb-6">
                These resources complement but do **not** replace professional mental health care. If you are experiencing persistent symptoms, severe distress, or suicidal thoughts, please contact a qualified mental health professional or emergency services in your country.
              </p>
              <p className="text-lg text-[#6B5FA8] font-light italic">
                Asking for help is a sign of strength. You deserve support and healing. 💙
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
