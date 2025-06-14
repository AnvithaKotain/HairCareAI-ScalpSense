import React, { useState, useEffect } from 'react';
import { auth } from "../firbaseauth/firbaseconfig";
import './communityForum.css';
import { FaHeart, FaComment, FaUserCircle, FaTrash } from 'react-icons/fa';

const CommunityForum = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const user = auth.currentUser;

  // Fetch posts on mount
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching posts from http://localhost:5000/forum/posts');
        const response = await fetch('http://localhost:5000/forum/posts', {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }
        const data = await response.json();
        setPosts(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Error fetching posts: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Handle post submission
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to post');
      return;
    }
    if (!newPost.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', newPost);
      formData.append('user_id', user.uid);
      formData.append('username', user.displayName || user.email.split('@')[0]);
      if (newImage) formData.append('image', newImage);

      const response = await fetch('http://localhost:5000/forum/post', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create post');

      setPosts([data, ...posts]);
      setNewPost('');
      setNewImage(null);
      setError(null);
    } catch (err) {
      setError(`Error creating post: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle post deletion
  const handleDeletePost = async (postId, imageUrl) => {
    if (!user) {
      setError('You must be logged in to delete posts');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/forum/post/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, image_url: imageUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete post');

      setPosts(posts.filter(post => post._id !== postId));
      setError(null);
    } catch (err) {
      setError(`Error deleting post: ${err.message}`);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (postId) => {
    if (!user) {
      setError('You must be logged in to comment');
      return;
    }
    if (!newComment[postId]?.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/forum/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          user_id: user.uid,
          username: user.displayName || user.email.split('@')[0],
          text: newComment[postId],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add comment');

      setPosts(posts.map(post => 
        post._id === postId ? { ...post, comments: [...post.comments, data] } : post
      ));
      setNewComment({ ...newComment, [postId]: '' });
      setError(null);
    } catch (err) {
      setError(`Error adding comment: ${err.message}`);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (postId, commentId) => {
    if (!user) {
      setError('You must be logged in to delete comments');
      return;
    }
    if (!postId || !commentId) {
      setError('Invalid post or comment ID');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/forum/comment', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, comment_id: commentId, user_id: user.uid }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete comment: HTTP ${response.status}`);
      }
      await response.json(); // Process response but don't assign to unused variable

      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, comments: post.comments.filter(comment => comment._id !== commentId) }
          : post
      ));
      setError(null);
    } catch (err) {
      console.error('Delete comment error:', err);
      setError(`Error deleting comment: ${err.message}`);
    }
  };

  // Handle like toggle
  const handleLike = async (postId) => {
    if (!user) {
      setError('You must be logged in to like');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/forum/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, user_id: user.uid }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to toggle like');

      setPosts(posts.map(post => 
        post._id === postId ? { ...post, likes: data.likes } : post
      ));
      setError(null);
    } catch (err) {
      setError(`Error toggling like: ${err.message}`);
    }
  };

  // Separate user posts and other posts
  const userPosts = user ? posts.filter(post => post.user_id === user.uid) : [];
  const otherPosts = user ? posts.filter(post => post.user_id !== user.uid) : posts;

  // Common post rendering function
  const renderPost = (post) => (
    <div 
      key={post._id} 
      className={`post-card ${user && post.user_id === user.uid ? 'user-post' : ''}`}
    >
      <div className="post-header">
        <FaUserCircle className="avatar" />
        <div>
          <p className="username">{post.username}</p>
          <p className="timestamp">
            {new Date(post.timestamp).toLocaleString()}
          </p>
        </div>
        {user && post.user_id === user.uid && (
          <button
            onClick={() => handleDeletePost(post._id, post.image_url)}
            className="delete-button"
            title="Delete Post"
          >
            <FaTrash />
          </button>
        )}
      </div>
      <div className="post-content">
        <p>{post.text}</p>
        {post.image_url && (
          <img src={post.image_url} alt="Post" className="post-image" />
        )}
      </div>
      <div className="post-actions">
        <button
          onClick={() => handleLike(post._id)}
          className={`like-button ${post.likes.includes(user?.uid) ? 'liked' : ''}`}
          disabled={!user}
        >
          <FaHeart /> {post.likes.length}
        </button>
        <button className="comment-button">
          <FaComment /> {post.comments.length}
        </button>
      </div>
      <div className="comments-section">
        {post.comments.map((comment) => (
          <div key={comment._id || `${post._id}-${comment.timestamp}`} className="comment">
            <p>
              <strong>{comment.username}</strong>: {comment.text}
              {user && comment.user_id === user.uid && comment._id && (
                <button
                  onClick={() => handleDeleteComment(post._id, comment._id)}
                  className="comment-delete-button"
                  title="Delete Comment"
                >
                  <FaTrash />
                </button>
              )}
            </p>
            <p className="comment-timestamp">
              {new Date(comment.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
        {user && (
          <div className="comment-form">
            <input
              type="text"
              value={newComment[post._id] || ''}
              onChange={(e) =>
                setNewComment({ ...newComment, [post._id]: e.target.value })
              }
              placeholder="Add a comment..."
            />
            <button onClick={() => handleCommentSubmit(post._id)}>
              Comment
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="community-forum-container">
      <h2>Community Forum</h2>
      <p>Share your hair care tips and journeys!</p>
      {error && <div className="error-message">{error}</div>}

      {/* Post Form */}
      {user ? (
        <div className="post-form-container">
          <p className="posting-as">Posting as: {user.displayName || user.email.split('@')[0]}</p>
          <form onSubmit={handlePostSubmit} className="post-form">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your tip or journey..."
              maxLength={500}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files[0])}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      ) : (
        <p>Please log in to post, comment, or like.</p>
      )}

      {/* User Posts Feed */}
      {user && userPosts.length > 0 && (
        <div className="user-posts-feed">
          <h3>Your Posts</h3>
          <div className="posts-grid">
            {userPosts.map(renderPost)}
          </div>
        </div>
      )}

      {/* Other Posts Feed */}
      <div className="other-posts-feed">
        <h3>Community Posts</h3>
        <div className="posts-grid">
          {isLoading && <div className="spinner">Loading...</div>}
          {otherPosts.length === 0 && !isLoading && <p>No posts yet. Be the first!</p>}
          {otherPosts.map(renderPost)}
        </div>
      </div>
    </div>
  );
};

export default CommunityForum;