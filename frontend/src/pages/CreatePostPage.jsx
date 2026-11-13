import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostForm from '../components/PostForm.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as blog from '../services/blogService.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { getErrorMessage } from '../utils/format.js';

export default function CreatePostPage() {
  useDocumentTitle('Write a post');
  const toast = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values, status) => {
    setSubmitting(true);
    try {
      const { data } = await blog.createPost({ ...values, status });
      toast.success(status === 'draft' ? 'Draft saved.' : 'Post published.');
      navigate(status === 'draft' ? '/my-blogs' : `/blogs/${data.post.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="container narrow section-tight">
      <header className="page-head">
        <h1>Write a post</h1>
        <p className="lead">Save a draft to finish later, or publish when you are ready.</p>
      </header>
      <PostForm mode="create" submitting={submitting} onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
    </div>
  );
}
