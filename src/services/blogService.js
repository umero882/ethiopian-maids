import { v4 as uuidv4 } from 'uuid';
// Note: Blog service uses mock data - database integration can be added later

// Database-only storage for posts and comments
let posts = [];
let comments = [];

// Utility function to check if a user can modify content (post or comment)
export const canModifyContent = (content, user) => {
  if (!user || !content) return false;
  return content.authorId === user.id;
};

// Get posts with pagination
export const getPosts = (page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  // Sort posts by date (newest first)
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const paginatedPosts = sortedPosts.slice(startIndex, endIndex);
  const hasMore = endIndex < sortedPosts.length;

  return {
    posts: paginatedPosts,
    hasMore,
    total: sortedPosts.length,
  };
};

// Get a post by ID
export const getPostById = (postId) => {
  return posts.find((post) => post.id === postId);
};

// Create a new post
export const createPost = (content, mediaUrls = [], user) => {
  if (!user) throw new Error('User not authenticated');

  const newPost = {
    id: uuidv4(),
    authorId: user.id,
    authorName: user.name,
    authorAvatar: user.avatar || `https://i.pravatar.cc/150?u=${user.id}`,
    authorType: user.type || 'user',
    content: content,
    mediaUrls: mediaUrls,
    createdAt: new Date().toISOString(),
    isEdited: false,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    likes: [],
    isSharedPost: false,
  };

  // Add to posts array
  posts = [newPost, ...posts];

  return newPost;
};

// Update a post
export const updatePost = (postId, content, mediaUrls) => {
  const postIndex = posts.findIndex((post) => post.id === postId);

  if (postIndex === -1) throw new Error('Post not found');

  // Create updated post object
  const updatedPost = {
    ...posts[postIndex],
    content: content,
    mediaUrls: mediaUrls || posts[postIndex].mediaUrls,
    isEdited: true,
  };

  // Update posts array
  posts = [
    ...posts.slice(0, postIndex),
    updatedPost,
    ...posts.slice(postIndex + 1),
  ];

  return updatedPost;
};

// Delete a post
export const deletePost = (postId) => {
  const postIndex = posts.findIndex((post) => post.id === postId);

  if (postIndex === -1) throw new Error('Post not found');

  // Remove from posts array
  posts = [...posts.slice(0, postIndex), ...posts.slice(postIndex + 1)];

  // Also delete all comments associated with this post
  comments = comments.filter((comment) => comment.postId !== postId);

  return true;
};

// Toggle reaction on a post (like, love, haha, wow, sad, angry)
export const togglePostLike = (postId, userId, reactionType = 'like') => {
  const postIndex = posts.findIndex((post) => post.id === postId);

  if (postIndex === -1) throw new Error('Post not found');

  const post = posts[postIndex];

  // Initialize or get existing reactions
  const reactions = post.reactions || {};
  const userReactions = post.userReactions || {};

  // Check if user already has any reaction
  const currentReaction = userReactions[userId];

  // If the same reaction is clicked again, remove it
  if (currentReaction === reactionType) {
    // Remove user's reaction
    const newUserReactions = { ...userReactions };
    delete newUserReactions[userId];

    // Decrement count for this reaction type
    const newReactions = { ...reactions };
    newReactions[reactionType] = (newReactions[reactionType] || 1) - 1;

    // If count reaches 0, remove the reaction type
    if (newReactions[reactionType] <= 0) {
      delete newReactions[reactionType];
    }

    // Create updated post object
    const updatedPost = {
      ...post,
      reactions: newReactions,
      userReactions: newUserReactions,
      likeCount: (post.likeCount || 1) - 1, // Keep likeCount for backward compatibility
      likes: (post.likes || []).filter((id) => id !== userId), // Keep likes for backward compatibility
    };

    // Update posts array
    posts = [
      ...posts.slice(0, postIndex),
      updatedPost,
      ...posts.slice(postIndex + 1),
    ];

    return updatedPost;
  }

  // If user already has a different reaction, update it
  if (currentReaction) {
    // Decrement count for previous reaction
    const newReactions = { ...reactions };
    newReactions[currentReaction] = (newReactions[currentReaction] || 1) - 1;

    // If count reaches 0, remove the reaction type
    if (newReactions[currentReaction] <= 0) {
      delete newReactions[currentReaction];
    }

    // Increment count for new reaction
    newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;

    // Update user's reaction
    const newUserReactions = {
      ...userReactions,
      [userId]: reactionType,
    };

    // Create updated post object
    const updatedPost = {
      ...post,
      reactions: newReactions,
      userReactions: newUserReactions,
      likeCount: post.likeCount, // Keep likeCount for backward compatibility
      likes: post.likes, // Keep likes for backward compatibility
    };

    // Update posts array
    posts = [
      ...posts.slice(0, postIndex),
      updatedPost,
      ...posts.slice(postIndex + 1),
    ];

    return updatedPost;
  }

  // User has no reaction yet, add new one
  const newReactions = { ...reactions };
  newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;

  const newUserReactions = {
    ...userReactions,
    [userId]: reactionType,
  };

  // Create updated post object with the new reaction
  const updatedPost = {
    ...post,
    reactions: newReactions,
    userReactions: newUserReactions,
    likeCount: (post.likeCount || 0) + 1, // Increment likeCount for backward compatibility
    likes: [...(post.likes || []), userId], // Add to likes for backward compatibility
  };

  // Update posts array
  posts = [
    ...posts.slice(0, postIndex),
    updatedPost,
    ...posts.slice(postIndex + 1),
  ];

  return updatedPost;
};

// Share a post
export const sharePost = (postId, comment, user) => {
  if (!user) throw new Error('User not authenticated');

  const originalPost = getPostById(postId);

  if (!originalPost) throw new Error('Post not found');

  // Create a new shared post
  const sharedPost = {
    id: uuidv4(),
    authorId: user.id,
    authorName: user.name,
    authorAvatar: user.avatar || `https://i.pravatar.cc/150?u=${user.id}`,
    authorType: user.type || 'user',
    content: comment,
    mediaUrls: [],
    createdAt: new Date().toISOString(),
    isEdited: false,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    likes: [],
    isSharedPost: true,
    originalPostId: postId,
  };

  // Update the share count of the original post
  const postIndex = posts.findIndex((post) => post.id === postId);

  if (postIndex !== -1) {
    const updatedOriginalPost = {
      ...posts[postIndex],
      shareCount: posts[postIndex].shareCount + 1,
    };

    // Update the original post in the array
    posts = [
      ...posts.slice(0, postIndex),
      updatedOriginalPost,
      ...posts.slice(postIndex + 1),
    ];
  }

  // Add the shared post to the posts array
  posts = [sharedPost, ...posts];

  return sharedPost;
};

// Get comments for a post with pagination and sorting options
export const getCommentsByPostId = (postId, options = {}) => {
  const { page = 1, limit = 10, sortBy = 'newest' } = options;

  // Get all comments for this post
  let filteredComments = comments.filter(
    (comment) => comment.postId === postId && !comment.parentCommentId
  );

  // Sort comments based on sortBy parameter
  if (sortBy === 'oldest') {
    filteredComments.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  } else if (sortBy === 'popular') {
    filteredComments.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
  } else {
    // 'newest' is default
    filteredComments.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  // Return paginated results
  return filteredComments.slice(startIndex, endIndex);
};

// Get replies for a specific comment
export const getRepliesByCommentId = (commentId) => {
  return comments
    .filter((comment) => comment.parentCommentId === commentId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Oldest first for replies
};

// Create a new comment
export const createComment = (
  postId,
  content,
  user,
  parentCommentId = null,
  media = null
) => {
  if (!user) throw new Error('User not authenticated');

  const post = getPostById(postId);

  if (!post) throw new Error('Post not found');

  // If this is a reply, verify parent comment exists
  if (parentCommentId) {
    const parentComment = comments.find((c) => c.id === parentCommentId);
    if (!parentComment) throw new Error('Parent comment not found');
  }

  const newComment = {
    id: uuidv4(),
    postId: postId,
    parentCommentId: parentCommentId,
    authorId: user.id,
    authorName: user.name,
    authorAvatar: user.avatar || `https://i.pravatar.cc/150?u=${user.id}`,
    authorType: user.type || 'user',
    content: content,
    media: media, // Could be an image, video, etc.
    createdAt: new Date().toISOString(),
    isEdited: false,
    likeCount: 0,
    likes: [],
    reactions: {},
    userReactions: {},
    replyCount: 0,
  };

  // Add to comments array
  comments = [newComment, ...comments];

  // Update comment count on the post
  const postIndex = posts.findIndex((p) => p.id === postId);

  if (postIndex !== -1) {
    const updatedPost = {
      ...posts[postIndex],
      commentCount: posts[postIndex].commentCount + 1,
    };

    posts = [
      ...posts.slice(0, postIndex),
      updatedPost,
      ...posts.slice(postIndex + 1),
    ];
  }

  return newComment;
};

// Update a comment
export const updateComment = (commentId, content) => {
  const commentIndex = comments.findIndex(
    (comment) => comment.id === commentId
  );

  if (commentIndex === -1) throw new Error('Comment not found');

  // Create updated comment object
  const updatedComment = {
    ...comments[commentIndex],
    content: content,
    isEdited: true,
  };

  // Update comments array
  comments = [
    ...comments.slice(0, commentIndex),
    updatedComment,
    ...comments.slice(commentIndex + 1),
  ];

  return updatedComment;
};

// Delete a comment
export const deleteComment = (commentId) => {
  const commentIndex = comments.findIndex(
    (comment) => comment.id === commentId
  );

  if (commentIndex === -1) throw new Error('Comment not found');

  const comment = comments[commentIndex];

  // Remove from comments array
  comments = [
    ...comments.slice(0, commentIndex),
    ...comments.slice(commentIndex + 1),
  ];

  // Update comment count on the post
  const postId = comment.postId;
  const postIndex = posts.findIndex((post) => post.id === postId);

  if (postIndex !== -1 && posts[postIndex].commentCount > 0) {
    const updatedPost = {
      ...posts[postIndex],
      commentCount: posts[postIndex].commentCount - 1,
    };

    posts = [
      ...posts.slice(0, postIndex),
      updatedPost,
      ...posts.slice(postIndex + 1),
    ];
  }

  return true;
};

// Toggle reaction on a comment (like, love, haha, wow, sad, angry)
export const toggleCommentLike = (commentId, userId, reactionType = 'like') => {
  const commentIndex = comments.findIndex(
    (comment) => comment.id === commentId
  );

  if (commentIndex === -1) throw new Error('Comment not found');

  const comment = comments[commentIndex];

  // Initialize or get existing reactions
  const reactions = comment.reactions || {};
  const userReactions = comment.userReactions || {};

  // Check if user already has any reaction
  const currentReaction = userReactions[userId];

  // If the same reaction is clicked again, remove it
  if (currentReaction === reactionType) {
    // Remove user's reaction
    const newUserReactions = { ...userReactions };
    delete newUserReactions[userId];

    // Decrement count for this reaction type
    const newReactions = { ...reactions };
    newReactions[reactionType] = (newReactions[reactionType] || 1) - 1;

    // If count reaches 0, remove the reaction type
    if (newReactions[reactionType] <= 0) {
      delete newReactions[reactionType];
    }

    // Create updated comment object
    const updatedComment = {
      ...comment,
      reactions: newReactions,
      userReactions: newUserReactions,
      likeCount: (comment.likeCount || 1) - 1, // Keep likeCount for backward compatibility
      likes: (comment.likes || []).filter((id) => id !== userId), // Keep likes for backward compatibility
    };

    // Update comments array
    comments = [
      ...comments.slice(0, commentIndex),
      updatedComment,
      ...comments.slice(commentIndex + 1),
    ];

    return updatedComment;
  }

  // If user already has a different reaction, update it
  if (currentReaction) {
    // Decrement count for previous reaction
    const newReactions = { ...reactions };
    newReactions[currentReaction] = (newReactions[currentReaction] || 1) - 1;

    // If count reaches 0, remove the reaction type
    if (newReactions[currentReaction] <= 0) {
      delete newReactions[currentReaction];
    }

    // Increment count for new reaction
    newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;

    // Update user's reaction
    const newUserReactions = {
      ...userReactions,
      [userId]: reactionType,
    };

    // Create updated comment object
    const updatedComment = {
      ...comment,
      reactions: newReactions,
      userReactions: newUserReactions,
      likeCount: comment.likeCount, // Keep likeCount for backward compatibility
      likes: comment.likes, // Keep likes for backward compatibility
    };

    // Update comments array
    comments = [
      ...comments.slice(0, commentIndex),
      updatedComment,
      ...comments.slice(commentIndex + 1),
    ];

    return updatedComment;
  }

  // User has no reaction yet, add new one
  const newReactions = { ...reactions };
  newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;

  const newUserReactions = {
    ...userReactions,
    [userId]: reactionType,
  };

  // Create updated comment object with the new reaction
  const updatedComment = {
    ...comment,
    reactions: newReactions,
    userReactions: newUserReactions,
    likeCount: (comment.likeCount || 0) + 1, // Increment likeCount for backward compatibility
    likes: [...(comment.likes || []), userId], // Add to likes for backward compatibility
  };

  // Update comments array
  comments = [
    ...comments.slice(0, commentIndex),
    updatedComment,
    ...comments.slice(commentIndex + 1),
  ];

  return updatedComment;
};

// Simulate file upload for media in posts
export const uploadMedia = async (files) => {
  // In a real application, this would upload files to a server/cloud storage
  // For demo purposes, we'll simulate a delay and return fake URLs

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Generate fake URLs for the uploaded files
  return files.map((file, _index) => {
    const isImage = file.type.startsWith('image/');
    const fileType = isImage ? 'image' : 'video';
    const fileExtension = file.name.split('.').pop();

    // In a real app, this would be a URL returned from the server
    return `https://example.com/uploads/${fileType}-${uuidv4()}.${fileExtension}`;
  });
};
