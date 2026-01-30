-- =============================================
-- Migration: Add likes_count trigger (similar to comments_count)
-- =============================================

-- 1. Function to update likes_count on posts
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for likes count
DROP TRIGGER IF EXISTS on_like_change ON likes;
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();

-- 3. Policy to allow users to update posts likes_count (for anonymous likes from client)
DROP POLICY IF EXISTS "Anyone can update post likes_count" ON posts;
CREATE POLICY "Anyone can update post likes_count"
  ON posts FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Sync existing likes counts (in case there's a mismatch)
UPDATE posts SET likes_count = (
  SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id
);
