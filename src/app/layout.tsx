import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import { Profile, Kanji } from "@/types/database";

type ProfileWithKanji = Profile & { kanjis: Kanji | null };

export const metadata: Metadata = {
  title: "漢字大好き | Kanji Daisuki",
  description: "日本語学習者のためのSNS。漢字をアバターにして、日本語で投稿しよう。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let profile: ProfileWithKanji | null = null;
  if (user) {
    // まずプロフィールのみ取得
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('=== Profile Fetch Debug ===');
    console.log('User ID:', user.id);
    console.log('Profile data:', profileData);
    console.log('Profile error:', profileError);

    let baseProfile: Profile | null = profileData as Profile | null;

    if (!profileData) {
      // プロフィールがない場合は作成
      const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
      console.log('Creating new profile with username:', username);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase.from('profiles') as any)
        .insert({
          id: user.id,
          username: username,
        });

      console.log('Insert error:', insertError);

      // 再度取得
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      baseProfile = newProfile as Profile | null;
    }

    // 漢字情報を別途取得
    if (baseProfile) {
      let kanjiData: Kanji | null = null;
      if (baseProfile.selected_kanji_id) {
        const { data: kanji } = await supabase
          .from('kanjis')
          .select('*')
          .eq('id', baseProfile.selected_kanji_id)
          .single();
        kanjiData = kanji as Kanji | null;
      }
      profile = { ...baseProfile, kanjis: kanjiData };
    }

    // デバッグログ
    console.log('=== Final Profile ===');
    console.log('Username:', profile?.username);
    console.log('Selected Kanji ID:', profile?.selected_kanji_id);
    console.log('Kanji:', profile?.kanjis);
  }

  return (
    <html lang="ja">
      <body className="antialiased">
        <Header
          user={user ? { id: user.id, email: user.email || '' } : null}
          profile={profile}
        />
        <main>{children}</main>
      </body>
    </html>
  );
}
