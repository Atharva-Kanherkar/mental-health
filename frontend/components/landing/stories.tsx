"use-client"
import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Quote, Heart, Star } from "lucide-react";

export function Stories() {
  const stories = [
    {
      name: "Sarah",
      role: "College Student",
      avatar: "S",
      story: "This app became my safe space during exam stress. Being able to revisit happy memories and get gentle encouragement from my virtual support network made all the difference.",
      gradient: "from-pink-400 to-rose-400",
      bgColor: "bg-pink-100"
    },
    {
      name: "Michael",
      role: "Working Professional",
      avatar: "M",
      story: "After my anxiety diagnosis, I needed something to help me process daily experiences. The memory vault helps me focus on positive moments instead of dwelling on worries.",
      gradient: "from-blue-400 to-indigo-400", 
      bgColor: "bg-blue-100"
    },
    {
      name: "Emma",
      role: "New Mom",
      avatar: "E",
      story: "Postpartum depression felt overwhelming, but having a place to store beautiful moments with my baby and receive personalized support has been incredibly healing.",
      gradient: "from-purple-400 to-violet-400",
      bgColor: "bg-purple-100"
    },
    {
      name: "David",
      role: "Retiree",
      avatar: "D",
      story: "At 65, technology usually intimidates me, but this felt so warm and welcoming. It&apos;s helped me stay connected to cherished memories and feel less lonely.",
      gradient: "from-emerald-400 to-green-400",
      bgColor: "bg-emerald-100"
    },
    {
      name: "Zoe",
      role: "High School Student",
      avatar: "Z",
      story: "Social anxiety made it hard to open up to anyone. Having an AI companion that truly understands me has been life-changing. I feel heard and supported.",
      gradient: "from-amber-400 to-orange-400",
      bgColor: "bg-amber-100"
    },
    {
      name: "James",
      role: "Healthcare Worker",
      avatar: "J",
      story: "Working in healthcare during tough times burned me out. This app reminds me why I love helping people and gives me strength to keep going each day.",
      gradient: "from-cyan-400 to-teal-400",
      bgColor: "bg-cyan-100"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-purple-50/30 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/20">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm bg-pink-100 text-pink-700 hover:bg-pink-200">
            Real Stories
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-6">
            You&apos;re Not Alone
            <br />
            <span className="text-3xl md:text-4xl">In This Journey</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Real people sharing how they&apos;ve found comfort, healing, and hope 
            through their personal memory vaults.
          </p>
        </div>

        {/* Stories grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {stories.map((story, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/95 hover:scale-105 relative overflow-hidden"
            >
              {/* Quote decoration */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-12 h-12 text-purple-500" />
              </div>
              
              <CardContent className="p-6">
                {/* Avatar and info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${story.gradient} flex items-center justify-center text-white font-semibold shadow-lg`}>
                    {story.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{story.name}</h4>
                    <p className="text-sm text-muted-foreground">{story.role}</p>
                  </div>
                </div>

                {/* Story */}
                <blockquote className="text-gray-700 leading-relaxed mb-4 italic">
                  &ldquo;{story.story}&rdquo;
                </blockquote>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom section */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center gap-4 p-8 bg-gradient-to-r from-white/80 to-purple-50/80 backdrop-blur-sm rounded-3xl border border-purple-100 shadow-lg">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-500 fill-pink-500/20" />
              <span className="text-lg font-semibold text-gray-800">
                Your story matters too
              </span>
              <Heart className="w-6 h-6 text-purple-500 fill-purple-500/20" />
            </div>
            <p className="text-muted-foreground max-w-md">
              Every journey is unique, and yours deserves to be honored and supported with the same care and compassion.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
