export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted">
      <div className="space-y-4 text-center max-w-2xl">
        <h1 className="text-4xl font-bold text-foreground">Welcome to v0</h1>
        <p className="text-lg text-muted-foreground">
          Your application is ready. Start building by editing <code className="bg-muted px-2 py-1 rounded text-sm font-mono">app/page.tsx</code>
        </p>
      </div>
    </main>
  )
}
