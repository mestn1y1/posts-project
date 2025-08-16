import { supabase } from "../lib/supabaseClient";

export async function getPosts(maxNumber) {
  let query = supabase
    .from("posts")
    .select(
      `
      id,
      image_url,
      title,
      content,
      created_at,
      users!posts_user_id_fkey(first_name, last_name),
      likes(user_id)
    `
    )
    .order("created_at", { ascending: false });

  if (maxNumber) query = query.limit(maxNumber);

  const { data, error } = await query;
  if (error) throw error;

  return data.map((post) => ({
    ...post,
    image: post.image_url,
    createdAt: post.created_at,
    likes: post.likes?.length || 0,
    isLiked: post.likes?.some((like) => like.user_id === 2) || false,
    userFirstName: post.users?.first_name,
    userLastName: post.users?.last_name,
  }));
}

export async function storePost(post) {
  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        image_url: post.imageUrl,
        title: post.title,
        content: post.content,
        user_id: post.userId,
      },
    ])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updatePostLikeStatus(postId, userId) {
  const { data: existing, error } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", userId)
    .eq("post_id", postId);

  if (error) throw error;

  if (existing.length === 0) {
    const { data, error: insertError } = await supabase
      .from("likes")
      .insert([{ user_id: userId, post_id: postId }]);

    if (insertError) throw insertError;
    return { liked: true };
  } else {
    // якщо лайк є → видаляємо
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);

    if (deleteError) throw deleteError;
    return { liked: false };
  }
}
