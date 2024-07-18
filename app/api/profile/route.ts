import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
  return NextResponse.json(profile || { username: '', email: '', phone: '', highscore: 0 });
}

export async function POST(request: Request) {
  const { username, email, phone, highscore } = await request.json();
  const existingProfile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
  if (existingProfile) {
    db.prepare('UPDATE profile SET username = ?, email = ?, phone = ?, highscore = ? WHERE id = 1')
      .run(username, email, phone, highscore);
  } else {
    db.prepare('INSERT INTO profile (username, email, phone, highscore) VALUES (?, ?, ?, ?)')
      .run(username, email, phone, highscore);
  }
  return NextResponse.json({ message: 'Profile updated' });
}