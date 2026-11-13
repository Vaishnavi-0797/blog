import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import FormField from './FormField.jsx';
import PostImage from './PostImage.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as blog from '../services/blogService.js';
import { getErrorMessage } from '../utils/format.js';

// Shared by the Create and Edit pages.
// onSubmit(values, status) is called with status "draft" or "published".
export default function PostForm({ mode, initial, submitting, onSubmit, onCancel }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState({
    title: initial?.title || '',
    content: initial?.content || '',
    category_id: initial?.category_id ? String(initial.category_id) : '',
    featured_image: initial?.featured_image || '',
  });

  useEffect(() => {
    blog.getCategories().then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const onChange = (e) => setValues({ ...values, [e.target.name]: e.target.value });

  const validate = (status) => {
    const e = {};
    if (values.title.trim().length < 3) e.title = 'Title must be at least 3 characters.';
    if (values.title.trim().length > 200) e.title = 'Title must be 200 characters or fewer.';
    if (values.content.trim().length < 20) e.content = 'Content must be at least 20 characters.';
    if (values.featured_image && !/^(https?:\/\/\S+|\/uploads\/[\w.-]+)$/i.test(values.featured_image.trim()))
      e.featured_image = 'Use a full link starting with http:// or https://, or upload an image.';
    if (status === 'published' && !values.category_id) e.category_id = 'Choose a category before publishing.';
    return e;
  };

  const submit = (status) => {
    const e = validate(status);
    setErrors(e);
    if (Object.keys(e).length) return toast.error('Please fix the highlighted fields.');
    onSubmit({ ...values, title: values.title.trim(), content: values.content.trim(), featured_image: values.featured_image.trim() }, status);
  };

  const handleFile = async (ev) => {
    const file = ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) return toast.error('Choose a JPG, PNG, WEBP or GIF image.');
    if (file.size > 3 * 1024 * 1024) return toast.error('Image must be smaller than 3 MB.');
    setUploading(true);
    try {
      const { data } = await blog.uploadImage(file);
      setValues((v) => ({ ...v, featured_image: data.url }));
      toast.success('Image uploaded.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const isDraft = initial?.status === 'draft';

  return (
    <form className="post-form" onSubmit={(e) => e.preventDefault()} noValidate>
      <FormField label="Title" id="title" name="title" value={values.title} onChange={onChange}
        error={errors.title} placeholder="A clear, specific title" maxLength={200} />

      <div className="field">
        <label htmlFor="category_id">Category</label>
        <select id="category_id" name="category_id" className={errors.category_id ? 'input input-error' : 'input'}
          value={values.category_id} onChange={onChange}>
          <option value="">Select a category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
        </select>
        {errors.category_id && <p className="field-error">{errors.category_id}</p>}
      </div>

      <div className="field">
        <label htmlFor="featured_image">Featured image</label>
        <div className="image-row">
          <input id="featured_image" name="featured_image" className={errors.featured_image ? 'input input-error' : 'input'}
            value={values.featured_image} onChange={onChange} placeholder="Paste an image link (https://…) or upload" />
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={handleFile} />
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current.click()} disabled={uploading}>
            <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
        {errors.featured_image && <p className="field-error">{errors.featured_image}</p>}
        {values.featured_image ? (
          <div className="image-preview"><PostImage src={values.featured_image} alt="Featured image preview" /></div>
        ) : (
          <p className="field-hint"><ImagePlus size={14} /> Optional. A wide image (like 1200×700) looks best.</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="content">Content</label>
        <textarea id="content" name="content" rows={16} className={errors.content ? 'input input-error' : 'input'}
          value={values.content} onChange={onChange} placeholder="Write your article here…" />
        {errors.content ? <p className="field-error">{errors.content}</p>
          : <p className="field-hint">Leave a blank line between paragraphs. Start a line with “## ” to make a heading.</p>}
      </div>

      <div className="row form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>Cancel</button>
        {mode === 'edit' && !isDraft ? (
          <button type="button" className="btn btn-primary" onClick={() => submit('published')} disabled={submitting || uploading}>
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => submit('draft')} disabled={submitting || uploading}>
              {submitting ? 'Saving…' : 'Save draft'}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => submit('published')} disabled={submitting || uploading}>
              {submitting ? 'Publishing…' : 'Publish'}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
