"use-client"
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, Sparkles, ArrowRight, Shield, Users, BookOpen } from "lucide-react";

export function CallToAction() {
  const benefits = [
    {
      icon: Shield,
      text: "100% Private & Secure",
      description: "Your memories stay yours"
    },
    {
      icon: Heart,
      text: "Free to Start",
      description: "Begin your journey today"
    },
    {
      icon: Users,
      text: "Loving Community",
      description: "You&apos;re never alone"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 right-16 w-40 h-40 bg-pink-300/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm bg-white/20 text-white border-white/30 hover:bg-white/30">
            Ready to Begin?
          </Badge>

          {/* Main heading */}
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your Journey to
            <br />
            <span className="text-3xl md:text-5xl bg-gradient-to-r from-pink-200 to-yellow-200 bg-clip-text text-transparent">
              Peace & Healing
            </span>
            <br />
            Starts Here
          </h2>

          {/* Description */}
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Take the first gentle step towards better mental wellness. 
            Create your safe space, store your precious memories, and discover 
            the support you deserve.
          </p>

          {/* Main CTA */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <Input 
                placeholder="Enter your email" 
                className="bg-white/95 border-0 text-gray-900 placeholder:text-gray-500 rounded-full px-6 py-6 text-lg shadow-lg backdrop-blur-sm"
              />
              <Button 
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-50 px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
              >
                Start Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
            <p className="text-white/70 text-sm mt-4">
              No credit card required • Get started in under 2 minutes
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-4">
                    <benefit.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-2">{benefit.text}</h4>
                  <p className="text-white/80 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom message */}
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Heart className="w-5 h-5 text-pink-300 fill-pink-300/50" />
            <span className="text-white/90 font-medium">
              Join thousands finding their inner peace
            </span>
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="hidden lg:block">
        <div className="absolute top-32 left-16 animate-float">
          <div className="w-16 h-16 bg-pink-300/30 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <Heart className="w-8 h-8 text-pink-200" />
          </div>
        </div>
        
        <div className="absolute bottom-40 right-20 animate-float-delay">
          <div className="w-20 h-20 bg-purple-300/30 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-purple-200" />
          </div>
        </div>

        <div className="absolute top-1/2 right-10 animate-float-slow">
          <div className="w-12 h-12 bg-indigo-300/30 rounded-full backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-indigo-200" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float 6s ease-in-out infinite 2s;
        }
        .animate-float-slow {
          animation: float 8s ease-in-out infinite 1s;
        }
      `}</style>
    </section>
  );
}
