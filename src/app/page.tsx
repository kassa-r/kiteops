import { LessonSearch } from "@/components/LessonSearch";

export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Book Your Kite Surfing Lesson</h1>
          <p className="text-muted-foreground text-lg">Find the perfect wind window and instructor for your skill level.</p>
        </header>
        
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <LessonSearch />
        </div>
      </div>
    </main>
  );
}