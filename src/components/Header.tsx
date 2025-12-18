import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:opacity-90">
            Property Explorer
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/saved-search" className="hover:underline">
              Saved Searches
            </Link>
            <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">
              Signed in as Guest
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
}
