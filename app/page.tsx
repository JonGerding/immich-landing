import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import path from 'path';
import fs from 'fs';
import { Suspense } from 'react';


interface Album {
  title: string;
  image: string;
  url: string;
}

// Funktion zum Laden der Alben (prüft, ob die gemountete Datei existiert, sonst Fallback)
function getAlbums(): Album[] {
  try {
    // Im Docker-Container zeigen wir auf einen festen Pfad, lokal auf den Projektordner
    const filePath = process.env.NODE_ENV === 'production' 
      ? '/app/data/albums.json' 
      : path.join(process.cwd(), 'data', 'albums.json');
      console.log(filePath);
      
    const fileData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileData) as Album[];
  } catch (error: unknown) {
    // Falls die Datei noch nicht da ist, ein leerer Array oder ein Fallback
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Fehler beim einlesen der Datei: ${errorMessage}`)
    return [];
  }
}

const correctPassword = process.env.LANDING_PASSWORD ?? "MeinGeheimesPasswort123";

// Server Action für den Login
async function handleLogin(formData: FormData) {
  'use server';
  const password = formData.get('password');
  
  // Dein Passwort (sollte später idealerweise in die .env)
  if (password === correctPassword) {
    const cookieStore = await cookies();
    cookieStore.set('auth', 'true', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 // 1 Tag gültig
    });
    redirect('/');
  } else {
    redirect('/?error=1');
  }
}

// Interne Komponente, die Cookies abfragt
async function AlbumContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
const cookieStore = await cookies();
const isAuthenticated = cookieStore.get('auth')?.value === 'true';

// Warten auf searchParams (Next.js 15+ Standard)
const params = await searchParams;
const hasError = params.error === '1';

// Wenn NICHT eingeloggt -> Zeige die Passwort-Maske
if (!isAuthenticated) {
  return (
    <main className="flex h-screen items-center justify-center bg-cyan-500/70  text-slate-100 font-sans">
      <div className="bg-slate-800 p-8 rounded-xl shadow-xl w-80 text-center">
        <h1 className="text-xl font-semibold mb-6">Hochzeitsfotos</h1>
        <form action={handleLogin} className="flex flex-col gap-4">
          <input 
            type="password" 
            name="password" 
            placeholder="Passwort eingeben" 
            required 
            autoFocus
            className="p-2 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded font-medium transition-colors">
            Anmelden
          </button>
        </form>

        {/* Fehlermeldung, falls der URL-Parameter gesetzt ist */}
        {hasError && (
          <p className="text-red-400 text-sm mt-4">Falsches Passwort! Bitte versuche es erneut.</p>
        )}
      </div>
    </main>
  );
}

const albums = getAlbums();

// Wenn eingeloggt -> Zeige die Alben
return (
  <main className="min-h-screen bg-cyan-500/70 text-slate-100 p-10 flex flex-col items-center font-sans">
    <h1 className="text-3xl font-bold mb-10">Hochzeitsfotos</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
      {albums.map((album, index) => (
        <a key={index} href={album.url} target="_blank" rel="noopener noreferrer" className="bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:-translate-y-1 transition-transform block">
          <img src={album.image} alt={album.title} className="w-full h-48 object-cover" />
          <div className="p-5">
            <h2 className="text-xl font-semibold mb-1">{album.title}</h2>
          </div>
        </a>
      ))}
    </div>
  </main>
);
}

// Hauptseite mit eingepacktem Suspense-Boundary, wie von Next.js gefordert
export default function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-900 text-white">Laden...</div>}>
      <AlbumContent searchParams={searchParams} />
    </Suspense>
  );
}