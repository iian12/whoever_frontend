import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from './apiConfig';
import Cookies from 'js-cookie';
import './PostDetailPage.css';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // 쿠키를 포함하도록 설정
});

const PostDetailPage = () => {
    const { postId } = useParams(); // URL에서 게시글 ID 가져오기
    const [post, setPost] = useState(null);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = Cookies.get('accessToken');
            setIsAuthenticated(!!token);
        };

        checkAuth();
    }, []);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) {
                setError('Invalid post ID');
                return;
            }

            try {
                const token = Cookies.get('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const response = await apiClient.get(`/posts/${postId}`, { headers });
                setPost(response.data);
            } catch (err) {
                console.error('API Error:', err);
                setError('Failed to fetch post details');
            }
        };

        fetchPost();
    }, [postId, isAuthenticated]);

    const handleCommentChange = (e) => {
        setNewComment(e.target.value);
    };

    const handleCommentSubmit = async () => {
        if (!isAuthenticated) {
            setError('You must be logged in to comment.');
            return;
        }

        try {
            const token = Cookies.get('accessToken');
            const headers = { Authorization: `Bearer ${token}` };
            const response = await apiClient.post(`/posts/${postId}/comments`, { content: newComment }, { headers });

            setPost(prevPost => ({
                ...prevPost,
                comments: [response.data, ...prevPost.comments]
            }));
            setNewComment('');
        } catch (err) {
            console.error('Comment Post Error:', err);
            setError('Failed to post comment');
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) {
            setError('You must be logged in to like this post.');
            return;
        }

        try {
            const token = Cookies.get('accessToken');
            const headers = { Authorization: `Bearer ${token}` };
            await apiClient.post(`/posts/${postId}/like`, {}, { headers });

            setPost(prevPost => ({
                ...prevPost,
                isLiked: !prevPost.isLiked
            }));
        } catch (err) {
            console.error('Like Post Error:', err);
            setError('Failed to like post');
        }
    };

    if (error) return <p className="error-message">{error}</p>;

    if (!post) return <p>Loading...</p>;

    return (
        <div className="post-detail-container">
            <h1>{post.title}</h1>
            <p className="post-meta">
                <span className="author">Author: {post.authorNickname}</span> |
                <span className="date">Created At: {new Date(post.createdAt).toLocaleString()}</span> |
                <span className="date">Updated At: {new Date(post.updatedAt).toLocaleString()}</span> |
                <span className="view-count">Views: {post.viewCount}</span> |
                <span className="comment-count">Comments: {post.commentCount}</span>
            </p>
            <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

            <div className="hashtags-section">
                <h2>Hashtags</h2>
                <div className="hashtags-list">
                    {post.hashtags.map((hashtag) => (
                        <span key={hashtag.id} className="hashtag">
                            {hashtag.name}
                        </span>
                    ))}
                </div>
            </div>

            <button className="like-button" onClick={handleLike}>
                {post.isLiked ? 'Unlike' : 'Like'}
            </button>

            <div className="comments-section">
                <h2>Comments</h2>
                <div className="comment-form">
                    <textarea
                        value={newComment}
                        onChange={handleCommentChange}
                        placeholder="Add a comment..."
                    />
                    <button onClick={handleCommentSubmit}>Submit</button>
                </div>
                <ul className="comments-list">
                    {post.comments.map((comment, index) => (
                        <li key={index} className="comment">
                            <p><strong>{comment.authorNickname}</strong>:</p>
                            <p>{comment.content}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PostDetailPage;
