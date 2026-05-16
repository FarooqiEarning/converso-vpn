import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl text-center space-y-8">
        <h1 className="text-6xl font-bold gradient-text">Converso VPN</h1>
        <p className="text-xl text-muted-foreground">
          Secure, fast, and private VPN for everyone. Connect to servers worldwide with
          enterprise-grade encryption.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
